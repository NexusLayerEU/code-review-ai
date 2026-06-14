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
public class M3HappyPathOnlyRule implements ReviewRule {

    private static final Pattern TEST_METHOD = Pattern.compile(
            "@Test|@ParameterizedTest|void test\\w+|def test_", Pattern.CASE_INSENSITIVE);
    private static final Pattern ERROR_HANDLING = Pattern.compile(
            "assertThrows|pytest\\.raises|shouldThrow|toThrow|toThrowError|null|None|empty|\"-1\"|\\bnull\\b",
            Pattern.CASE_INSENSITIVE);

    @Override public String getId() { return "AI_M3_HAPPY_PATH"; }
    @Override public String getName() { return "Happy Path Only Tests"; }
    @Override public FindingCategory getCategory() { return FindingCategory.MIRROR_TEST; }
    @Override public Severity getDefaultSeverity() { return Severity.MEDIUM; }
    @Override public Set<String> getSupportedLanguages() { return Set.of("java", "typescript", "javascript", "python"); }

    @Override
    public List<Finding> analyze(RuleContext context) {
        List<Finding> findings = new ArrayList<>();
        if (context.filePath() == null) return findings;
        String filePath = context.filePath().toLowerCase();
        boolean isTestFile = filePath.contains("test") || filePath.contains("spec");
        if (!isTestFile) return findings;

        String code = context.code();
        long testCount = TEST_METHOD.matcher(code).results().count();
        if (testCount < 3) return findings;

        boolean hasErrorHandling = ERROR_HANDLING.matcher(code).find();
        if (!hasErrorHandling) {
            findings.add(Finding.builder()
                    .id(UUID.randomUUID().toString())
                    .ruleId(getId()).category(getCategory())
                    .severity(getDefaultSeverity()).confidence(Confidence.MEDIUM)
                    .analysisLayer(1)
                    .description("Test file has " + testCount + " tests but no error or edge-case coverage")
                    .suggestion("Add tests for: null inputs, empty collections, boundary values, invalid states, exception paths")
                    .build());
        }
        return findings;
    }
}
