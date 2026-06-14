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
public class G4OptimisticAsyncRule implements ReviewRule {

    private static final Pattern ASYNC_CALL = Pattern.compile(
            "CompletableFuture\\.(runAsync|supplyAsync)|\\bexecutor\\.submit|@Async");
    private static final Pattern ERROR_HANDLER = Pattern.compile(
            "\\.exceptionally\\(|\\.handle\\(|\\.whenComplete\\(|\\.thenApply.*catch|try\\s*\\{");

    @Override public String getId() { return "AI_G4_OPTIMISTIC_ASYNC"; }
    @Override public String getName() { return "Optimistic Async (No Error Handler)"; }
    @Override public FindingCategory getCategory() { return FindingCategory.GHOST_HANDLING; }
    @Override public Severity getDefaultSeverity() { return Severity.MEDIUM; }
    @Override public Set<String> getSupportedLanguages() { return Set.of("java", "typescript", "javascript"); }

    @Override
    public List<Finding> analyze(RuleContext context) {
        List<Finding> findings = new ArrayList<>();
        String[] lines = context.code().split("\n");
        for (int i = 0; i < lines.length; i++) {
            if (ASYNC_CALL.matcher(lines[i]).find()) {
                // Check next 6 lines for error handling
                StringBuilder window = new StringBuilder(lines[i]);
                for (int j = i + 1; j < Math.min(lines.length, i + 7); j++) {
                    window.append("\n").append(lines[j]);
                }
                if (!ERROR_HANDLER.matcher(window.toString()).find()) {
                    findings.add(Finding.builder()
                            .id(UUID.randomUUID().toString())
                            .ruleId(getId()).category(getCategory())
                            .severity(getDefaultSeverity()).confidence(Confidence.MEDIUM)
                            .analysisLayer(1)
                            .lineStart(i + 1)
                            .description("Async operation has no error handler — failures will be silently swallowed")
                            .suggestion("Add .exceptionally() handler or wrap in try/catch to handle failures")
                            .evidence(lines[i].trim())
                            .build());
                }
            }
        }
        return findings;
    }
}
