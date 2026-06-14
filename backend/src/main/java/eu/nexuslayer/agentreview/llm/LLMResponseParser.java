package eu.nexuslayer.agentreview.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import eu.nexuslayer.agentreview.entity.Finding;
import eu.nexuslayer.agentreview.model.Confidence;
import eu.nexuslayer.agentreview.model.FindingCategory;
import eu.nexuslayer.agentreview.model.Severity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class LLMResponseParser {

    private final ObjectMapper objectMapper;

    public List<Finding> parse(String llmResponse, String reviewId, int layer) {
        if (llmResponse == null || llmResponse.isBlank()) return List.of();
        try {
            String json = extractJson(llmResponse);
            JsonNode root = objectMapper.readTree(json);
            JsonNode findings = root.path("findings");
            if (!findings.isArray()) return List.of();

            List<Finding> result = new ArrayList<>();
            for (JsonNode node : findings) {
                try {
                    result.add(Finding.builder()
                            .id(UUID.randomUUID().toString())
                            .reviewId(reviewId)
                            .ruleId(node.path("rule_id").asText("AI_LLM_FINDING"))
                            .category(parseCategory(node.path("category").asText("INTENT_DRIFT")))
                            .severity(parseSeverity(node.path("severity").asText("MEDIUM")))
                            .confidence(parseConfidence(node.path("confidence").asText("MEDIUM")))
                            .analysisLayer(layer)
                            .description(node.path("description").asText(""))
                            .suggestion(node.path("suggestion").isNull() ? null : node.path("suggestion").asText())
                            .evidence(node.path("evidence").isNull() ? null : node.path("evidence").asText())
                            .filePath(node.path("file").isNull() ? null : node.path("file").asText())
                            .lineStart(node.path("line_start").isNumber() ? node.path("line_start").asInt() : null)
                            .build());
                } catch (Exception e) {
                    log.debug("Skipping malformed finding: {}", e.getMessage());
                }
            }
            return result;
        } catch (Exception e) {
            log.warn("Failed to parse LLM response: {}", e.getMessage());
            return List.of();
        }
    }

    private String extractJson(String text) {
        text = text.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "").trim();
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) return text.substring(start, end + 1);
        return text;
    }

    private FindingCategory parseCategory(String s) {
        try { return FindingCategory.valueOf(s.toUpperCase().replace("-", "_")); }
        catch (Exception e) { return FindingCategory.INTENT_DRIFT; }
    }

    private Severity parseSeverity(String s) {
        try { return Severity.valueOf(s.toUpperCase()); }
        catch (Exception e) { return Severity.MEDIUM; }
    }

    private Confidence parseConfidence(String s) {
        try { return Confidence.valueOf(s.toUpperCase()); }
        catch (Exception e) { return Confidence.MEDIUM; }
    }
}
