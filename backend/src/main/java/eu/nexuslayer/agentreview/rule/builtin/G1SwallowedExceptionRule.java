package eu.nexuslayer.agentreview.rule.builtin;

import eu.nexuslayer.agentreview.entity.Finding;
import eu.nexuslayer.agentreview.model.Confidence;
import eu.nexuslayer.agentreview.model.FindingCategory;
import eu.nexuslayer.agentreview.model.Severity;
import eu.nexuslayer.agentreview.rule.ReviewRule;
import eu.nexuslayer.agentreview.rule.RuleContext;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
public class G1SwallowedExceptionRule implements ReviewRule {

    private static final Pattern CATCH_PATTERN = Pattern.compile(
            "}?\\s*catch\\s*\\([^)]+\\)\\s*\\{", Pattern.MULTILINE);
    private static final Pattern LOG_ONLY = Pattern.compile(
            "log\\.(error|warn|info|debug)|logger\\.|System\\.out\\.print|LOG\\.", Pattern.CASE_INSENSITIVE);
    private static final Pattern PROPAGATION = Pattern.compile(
            "\\bthrow\\b|\\breturn\\b.*[Ee]rror|response\\.setError|result\\.fail|CompletableFuture.*completeExceptionally");

    @Override public String getId() { return "AI_G1_SWALLOWED"; }
    @Override public String getName() { return "Swallowed Exception"; }
    @Override public FindingCategory getCategory() { return FindingCategory.GHOST_HANDLING; }
    @Override public Severity getDefaultSeverity() { return Severity.HIGH; }
    @Override public Set<String> getSupportedLanguages() { return Set.of("java", "typescript", "javascript", "python"); }

    @Override
    public List<Finding> analyze(RuleContext context) {
        List<Finding> findings = new ArrayList<>();
        String[] lines = context.code().split("\n");
        int i = 0;
        while (i < lines.length) {
            String line = lines[i];
            if (CATCH_PATTERN.matcher(line).find()) {
                int catchLine = i + 1;
                StringBuilder body = new StringBuilder();
                int depth = 1;
                int j = i + 1;
                while (j < lines.length && depth > 0 && j < i + 30) {
                    String l = lines[j];
                    depth += countChar(l, '{') - countChar(l, '}');
                    if (depth > 0) body.append(l).append("\n");
                    j++;
                }
                // bodyStr contains lines strictly inside the braces (depth > 0 guards the closing brace).
                // isBlank() correctly handles catch blocks that contain only whitespace/newlines.
                String bodyStr = body.toString();
                if (bodyStr.isBlank()) {
                    findings.add(Finding.builder()
                            .id(UUID.randomUUID().toString())
                            .ruleId(getId()).category(getCategory())
                            .severity(Severity.CRITICAL).confidence(Confidence.HIGH)
                            .analysisLayer(1)
                            .lineStart(catchLine).lineEnd(j - 1)
                            .description("Empty catch block silently swallows exception — no logging, no rethrowing")
                            .suggestion("At minimum log the exception, or rethrow it")
                            .evidence(line.trim())
                            .build());
                } else if (LOG_ONLY.matcher(bodyStr).find() && !PROPAGATION.matcher(bodyStr).find()) {
                    findings.add(Finding.builder()
                            .id(UUID.randomUUID().toString())
                            .ruleId(getId()).category(getCategory())
                            .severity(getDefaultSeverity()).confidence(Confidence.HIGH)
                            .analysisLayer(1)
                            .lineStart(catchLine).lineEnd(j)
                            .description("Catch block only logs exception and continues to success path — error is silently swallowed")
                            .suggestion("After logging, rethrow the exception or return an error result to the caller")
                            .evidence(lines[Math.min(i + 1, lines.length - 1)].trim())
                            .build());
                }
                i = j;
            } else {
                i++;
            }
        }
        return findings;
    }

    private int countChar(String s, char c) {
        int count = 0;
        for (char ch : s.toCharArray()) if (ch == c) count++;
        return count;
    }
}
