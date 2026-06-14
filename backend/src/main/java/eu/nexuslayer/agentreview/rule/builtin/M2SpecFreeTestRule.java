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
public class M2SpecFreeTestRule implements ReviewRule {

    private static final Pattern RELATIONAL_ASSERT = Pattern.compile(
            "assertNotNull|assertNull|assertTrue|assertFalse|isNotNull|isNull|isPresent|isEmpty|toBeDefined|toBeNull|toBeTruthy|toBeFalsy");
    private static final Pattern LITERAL_VALUE = Pattern.compile(
            "\"[^\"]{2,}\"|'[^']{2,}'|assertEquals.*,\\s*\\d{2,}\\)");

    @Override public String getId() { return "AI_M2_SPEC_FREE"; }
    @Override public String getName() { return "Spec-Free Test (No Expected Values)"; }
    @Override public FindingCategory getCategory() { return FindingCategory.MIRROR_TEST; }
    @Override public Severity getDefaultSeverity() { return Severity.MEDIUM; }
    @Override public Set<String> getSupportedLanguages() { return Set.of("java", "typescript", "javascript", "python"); }

    @Override
    public List<Finding> analyze(RuleContext context) {
        List<Finding> findings = new ArrayList<>();
        if (context.filePath() == null) return findings;
        String filePath = context.filePath().toLowerCase();
        if (!filePath.contains("test") && !filePath.contains("spec")) return findings;

        String[] lines = context.code().split("\n");
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            if (!line.contains("@Test") && !line.contains("void test") && !line.trim().startsWith("def test_")) continue;
            StringBuilder body = new StringBuilder();
            for (int j = i; j < Math.min(lines.length, i + 25); j++) body.append(lines[j]).append("\n");
            String bodyStr = body.toString();
            boolean hasRelational = RELATIONAL_ASSERT.matcher(bodyStr).find();
            boolean hasLiteral = LITERAL_VALUE.matcher(bodyStr).find();
            if (hasRelational && !hasLiteral) {
                String methodLine = line.trim();
                findings.add(Finding.builder()
                        .id(UUID.randomUUID().toString())
                        .ruleId(getId()).category(getCategory())
                        .severity(getDefaultSeverity()).confidence(Confidence.MEDIUM)
                        .analysisLayer(1).lineStart(i + 1)
                        .description("Test only uses existence/relational assertions with no specific expected values")
                        .suggestion("Assert specific expected values (e.g., assertEquals(\"john@example.com\", user.getEmail()))")
                        .evidence(methodLine)
                        .build());
            }
        }
        return findings;
    }
}
