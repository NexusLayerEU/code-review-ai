package eu.nexuslayer.agentreview.llm;

import eu.nexuslayer.agentreview.dto.ReviewRequest;
import eu.nexuslayer.agentreview.entity.Finding;
import eu.nexuslayer.agentreview.model.Confidence;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class LLMJudgeService {

    private final PromptBuilder promptBuilder;
    private final LLMResponseParser responseParser;

    public List<Finding> judge(ReviewRequest request, List<Finding> priorFindings,
                                LLMExecutor executor, String reviewId) {
        List<Finding> llmFindings = new ArrayList<>();

        if (request.getTaskDescription() != null && !request.getTaskDescription().isBlank()) {
            try {
                String response = executor.complete(PromptBuilder.SYSTEM_PROMPT,
                        promptBuilder.buildIntentAlignmentPrompt(request));
                llmFindings.addAll(responseParser.parse(response, reviewId, 3));
            } catch (Exception e) {
                log.warn("Intent alignment check failed: {}", e.getMessage());
            }
        }

        try {
            String response = executor.complete(PromptBuilder.SYSTEM_PROMPT,
                    promptBuilder.buildConfidenceBugPrompt(request, priorFindings));
            llmFindings.addAll(responseParser.parse(response, reviewId, 3));
        } catch (Exception e) {
            log.warn("Confidence bug check failed: {}", e.getMessage());
        }

        boolean hasTests = request.getFiles() != null && request.getFiles().stream()
                .anyMatch(f -> f.getPath() != null &&
                        (f.getPath().contains("Test") || f.getPath().contains("Spec") || f.getPath().contains("test_")));
        if (hasTests) {
            try {
                String response = executor.complete(PromptBuilder.SYSTEM_PROMPT,
                        promptBuilder.buildTestQualityPrompt(request, priorFindings));
                llmFindings.addAll(responseParser.parse(response, reviewId, 3));
            } catch (Exception e) {
                log.warn("Test quality check failed: {}", e.getMessage());
            }
        }

        return llmFindings.stream()
                .map(this::downgradeConfidence)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private Finding downgradeConfidence(Finding f) {
        Confidence downgraded = switch (f.getConfidence()) {
            case HIGH -> Confidence.MEDIUM;
            case MEDIUM -> Confidence.LOW;
            case LOW -> null;
        };
        if (downgraded == null) return null;
        return Finding.builder()
                .id(f.getId()).reviewId(f.getReviewId()).ruleId(f.getRuleId())
                .category(f.getCategory()).severity(f.getSeverity()).confidence(downgraded)
                .analysisLayer(f.getAnalysisLayer()).filePath(f.getFilePath())
                .lineStart(f.getLineStart()).lineEnd(f.getLineEnd())
                .description(f.getDescription()).suggestion(f.getSuggestion()).evidence(f.getEvidence())
                .build();
    }
}
