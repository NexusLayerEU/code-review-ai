package eu.nexuslayer.agentreview.service;

import eu.nexuslayer.agentreview.entity.Finding;
import eu.nexuslayer.agentreview.model.Confidence;
import eu.nexuslayer.agentreview.model.FindingCategory;
import eu.nexuslayer.agentreview.model.Severity;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class StaticAnalyzerClient {

    @Value("${agentreview.analyzer.url:http://localhost:8081}")
    private String analyzerUrl;

    private RestClient client;

    @PostConstruct
    void init() {
        client = RestClient.builder().baseUrl(analyzerUrl).build();
    }

    public List<Finding> analyze(String code, String language, String filePath, String reviewId) {
        if (code == null || code.isBlank()) return List.of();
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("code", code);
            request.put("language", language);
            request.put("file_path", filePath);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = client.post()
                    .uri("/analyze")
                    .header("Content-Type", "application/json")
                    .body(request)
                    .retrieve()
                    .body(Map.class);

            if (response == null) return List.of();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawFindings = (List<Map<String, Object>>) response.getOrDefault("findings", List.of());

            List<Finding> findings = new ArrayList<>();
            for (Map<String, Object> raw : rawFindings) {
                findings.add(Finding.builder()
                        .id(UUID.randomUUID().toString())
                        .reviewId(reviewId)
                        .ruleId(String.valueOf(raw.getOrDefault("rule_id", "AI_STATIC")))
                        .category(parseCategory(String.valueOf(raw.getOrDefault("category", "GHOST_HANDLING"))))
                        .severity(parseSeverity(String.valueOf(raw.getOrDefault("severity", "MEDIUM"))))
                        .confidence(parseConfidence(String.valueOf(raw.getOrDefault("confidence", "HIGH"))))
                        .analysisLayer(1)
                        .filePath(String.valueOf(raw.getOrDefault("file", filePath)))
                        .lineStart(raw.get("line_start") instanceof Number n ? n.intValue() : null)
                        .lineEnd(raw.get("line_end") instanceof Number n ? n.intValue() : null)
                        .description(String.valueOf(raw.getOrDefault("description", "")))
                        .suggestion(raw.get("suggestion") != null ? String.valueOf(raw.get("suggestion")) : null)
                        .evidence(raw.get("evidence") != null ? String.valueOf(raw.get("evidence")) : null)
                        .build());
            }
            return findings;
        } catch (RestClientException e) {
            log.warn("Static analyzer unavailable ({}), skipping layer-1 analysis: {}", analyzerUrl, e.getMessage());
            return List.of();
        } catch (Exception e) {
            log.error("Static analyzer error: {}", e.getMessage());
            return List.of();
        }
    }

    private FindingCategory parseCategory(String s) {
        try { return FindingCategory.valueOf(s.toUpperCase().replace("-", "_")); }
        catch (Exception e) { return FindingCategory.GHOST_HANDLING; }
    }

    private Severity parseSeverity(String s) {
        try { return Severity.valueOf(s.toUpperCase()); }
        catch (Exception e) { return Severity.MEDIUM; }
    }

    private Confidence parseConfidence(String s) {
        try { return Confidence.valueOf(s.toUpperCase()); }
        catch (Exception e) { return Confidence.HIGH; }
    }
}
