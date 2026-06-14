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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class D3DeadImportRule implements ReviewRule {

    private static final Pattern JAVA_IMPORT = Pattern.compile("^import\\s+(?:static\\s+)?([\\w.]+)\\.(\\w+);");
    private static final Pattern TS_IMPORT = Pattern.compile("^import\\s+(?:type\\s+)?(?:\\{\\s*)?(\\w+)");
    private static final Pattern PY_IMPORT = Pattern.compile("^(?:from\\s+\\S+\\s+)?import\\s+(\\w+)");

    @Override public String getId() { return "AI_D3_DEAD_IMPORT"; }
    @Override public String getName() { return "Dead Import"; }
    @Override public FindingCategory getCategory() { return FindingCategory.DEAD_REPLICA; }
    @Override public Severity getDefaultSeverity() { return Severity.LOW; }
    @Override public Set<String> getSupportedLanguages() { return Set.of("java", "typescript", "javascript", "python"); }

    @Override
    public List<Finding> analyze(RuleContext context) {
        List<Finding> findings = new ArrayList<>();
        String[] lines = context.code().split("\n");
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            String symbol = extractImportedSymbol(line, context.language());
            if (symbol == null || symbol.isBlank() || symbol.contains("*")) continue;
            String body = buildBodyWithoutLine(lines, i);
            if (!Pattern.compile("\\b" + Pattern.quote(symbol) + "\\b").matcher(body).find()) {
                findings.add(Finding.builder()
                        .id(UUID.randomUUID().toString())
                        .ruleId(getId()).category(getCategory())
                        .severity(getDefaultSeverity()).confidence(Confidence.HIGH)
                        .analysisLayer(1)
                        .lineStart(i + 1).lineEnd(i + 1)
                        .description("Import '" + symbol + "' is never used in this file")
                        .suggestion("Remove unused import: " + line)
                        .evidence(line)
                        .build());
            }
        }
        return findings;
    }

    private String extractImportedSymbol(String line, String language) {
        Matcher m;
        switch (language.toLowerCase()) {
            case "java":
                m = JAVA_IMPORT.matcher(line);
                return m.find() ? m.group(2) : null;
            case "typescript": case "javascript":
                m = TS_IMPORT.matcher(line);
                return m.find() ? m.group(1) : null;
            case "python":
                m = PY_IMPORT.matcher(line);
                return m.find() ? m.group(1) : null;
        }
        return null;
    }

    private String buildBodyWithoutLine(String[] lines, int skipIndex) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lines.length; i++) {
            if (i != skipIndex) sb.append(lines[i]).append("\n");
        }
        return sb.toString();
    }
}
