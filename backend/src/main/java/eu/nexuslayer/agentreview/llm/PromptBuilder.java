package eu.nexuslayer.agentreview.llm;

import eu.nexuslayer.agentreview.dto.ReviewRequest;
import eu.nexuslayer.agentreview.entity.Finding;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PromptBuilder {

    private static final int MAX_CODE_CHARS = 16000;

    public static final String SYSTEM_PROMPT =
            "You are AgentReview, an expert code reviewer specializing in AI-generated code failure modes. " +
            "You return ONLY valid JSON. No markdown, no explanation, just the JSON object.";

    public String buildIntentAlignmentPrompt(ReviewRequest request) {
        String code = truncateCode(extractAllCode(request));
        return "Analyze whether this code actually implements what was described in the task.\n\n" +
               "TASK DESCRIPTION: " + request.getTaskDescription() + "\n\n" +
               "CODE:\n" + code + "\n\n" +
               "Return JSON: {\"findings\": [{\"rule_id\": \"AI_INTENT_DRIFT\", \"category\": \"INTENT_DRIFT\", " +
               "\"severity\": \"HIGH|MEDIUM|LOW\", \"confidence\": \"HIGH|MEDIUM|LOW\", " +
               "\"description\": \"...\", \"suggestion\": \"...\", \"evidence\": \"...\"}]}\n" +
               "Return {\"findings\": []} if code aligns with intent.";
    }

    public String buildConfidenceBugPrompt(ReviewRequest request, List<Finding> priorFindings) {
        String code = truncateCode(extractAllCode(request));
        String prior = formatPriorFindings(priorFindings);
        return "Review this " + request.getLanguage() + " code for confidence bugs — logic that assumes success, " +
               "ignores edge cases, or makes overconfident assumptions.\n\n" +
               "CODE:\n" + code + "\n\n" +
               "PRIOR FINDINGS (already detected):\n" + prior + "\n\n" +
               "Return JSON with findings array. Use rule_id AI_CONFIDENCE_BUG, category CONFIDENCE_BUG. " +
               "Include severity, confidence, description, suggestion, evidence.\n" +
               "Return {\"findings\": []} if none found.";
    }

    public String buildTestQualityPrompt(ReviewRequest request, List<Finding> priorFindings) {
        String code = truncateCode(extractAllCode(request));
        return "Analyze test quality for AI-generated tests. Look for: tautological tests, missing edge cases, " +
               "tests that only test the happy path, tests that verify the implementation was called rather than asserting values.\n\n" +
               "CODE:\n" + code + "\n\n" +
               "Return JSON with findings array using category MIRROR_TEST. " +
               "Include rule_id, severity, confidence, description, suggestion, evidence.\n" +
               "Return {\"findings\": []} if tests are acceptable quality.";
    }

    public String buildAbstractionPrompt(ReviewRequest request) {
        String code = truncateCode(extractAllCode(request));
        return "Analyze abstractions in this " + request.getLanguage() + " code. " +
               "Look for: interfaces with only one implementation that add no value, " +
               "methods that only delegate without transformation, fake modularity.\n\n" +
               "CODE:\n" + code + "\n\n" +
               "Return JSON with findings array using category ABSTRACTION_SMELL, rule_id AI_ABSTRACTION_SMELL. " +
               "Return {\"findings\": []} if abstractions are justified.";
    }

    private String extractAllCode(ReviewRequest request) {
        if (request.getFiles() == null) return "";
        return request.getFiles().stream()
                .map(f -> "// File: " + f.getPath() + "\n" + f.getContent())
                .collect(Collectors.joining("\n\n"));
    }

    private String truncateCode(String code) {
        return code.length() > MAX_CODE_CHARS ? code.substring(0, MAX_CODE_CHARS) + "\n... [truncated]" : code;
    }

    private String formatPriorFindings(List<Finding> findings) {
        if (findings == null || findings.isEmpty()) return "None";
        return findings.stream()
                .map(f -> "- [" + f.getSeverity() + "] " + f.getRuleId() + ": " + f.getDescription())
                .collect(Collectors.joining("\n"));
    }
}
