package eu.nexuslayer.agentreview.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import eu.nexuslayer.agentreview.dto.*;
import eu.nexuslayer.agentreview.entity.Finding;
import eu.nexuslayer.agentreview.entity.Review;
import eu.nexuslayer.agentreview.llm.LLMExecutor;
import eu.nexuslayer.agentreview.llm.LLMExecutorFactory;
import eu.nexuslayer.agentreview.llm.LLMJudgeService;
import eu.nexuslayer.agentreview.model.ReviewMode;
import eu.nexuslayer.agentreview.model.ReviewStatus;
import eu.nexuslayer.agentreview.model.SourceType;
import eu.nexuslayer.agentreview.repository.FindingRepository;
import eu.nexuslayer.agentreview.repository.ReviewRepository;
import eu.nexuslayer.agentreview.rule.RuleContext;
import eu.nexuslayer.agentreview.rule.RuleEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReviewOrchestrator {

    private final ReviewRepository reviewRepository;
    private final FindingRepository findingRepository;
    private final RuleEngine ruleEngine;
    private final LLMJudgeService llmJudgeService;
    private final LLMExecutorFactory executorFactory;
    private final StaticAnalyzerClient staticAnalyzerClient;
    private final ReportBuilder reportBuilder;
    private final ObjectMapper objectMapper;

    @Transactional
    public Review createReview(ReviewRequest request, String userId, SourceType sourceType) {
        Review review = Review.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .agentId(request.getAgentId())
                .language(request.getLanguage() != null ? request.getLanguage() : "java")
                .sourceType(sourceType)
                .reviewMode(request.getReviewMode() != null ? request.getReviewMode() : ReviewMode.FULL)
                .executorType(request.getExecutorConfig() != null && request.getExecutorConfig().getType() != null
                        ? request.getExecutorConfig().getType()
                        : eu.nexuslayer.agentreview.model.ExecutorType.CLAUDE_API)
                .taskDescription(request.getTaskDescription())
                .status(ReviewStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        if (request.getExecutorConfig() != null) {
            try {
                review.setExecutorConfig(objectMapper.writeValueAsString(request.getExecutorConfig()));
            } catch (Exception e) {
                log.warn("Could not serialize executor config: {}", e.getMessage());
            }
        }

        return reviewRepository.save(review);
    }

    @Async
    public void runReview(Review review, ReviewRequest request) {
        // Reload review from DB — the entity passed in may be detached after createReview()'s transaction commits
        final String reviewId = review.getId();
        review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalStateException("Review not found after creation: " + reviewId));
        long startMs = System.currentTimeMillis();
        try {
            updateStatus(review, ReviewStatus.PROCESSING);
            List<Finding> allFindings = new ArrayList<>();

            // Layer 1: Static analysis (Python service)
            if (request.getFiles() != null && review.getReviewMode() != ReviewMode.LLM_ONLY) {
                for (ReviewFileDto file : request.getFiles()) {
                    List<Finding> staticFindings = staticAnalyzerClient.analyze(
                            file.getContent(), review.getLanguage(), file.getPath(), review.getId());
                    allFindings.addAll(staticFindings);
                }
            }

            // Layer 2: Rule engine (JavaParser-based semantic rules)
            if (request.getFiles() != null && review.getReviewMode() != ReviewMode.LLM_ONLY) {
                for (ReviewFileDto file : request.getFiles()) {
                    RuleContext ctx = new RuleContext(
                            file.getContent(),
                            review.getLanguage(),
                            review.getTaskDescription(),
                            request.getContext() != null ? request.getContext().getDependencies() : null,
                            List.copyOf(allFindings),
                            file.getPath()
                    );
                    List<Finding> ruleFindings = ruleEngine.run(ctx, review.getId(), request.getCustomRuleSets());
                    allFindings.addAll(ruleFindings);
                }
            }

            // Layer 3: LLM judge
            if (review.getReviewMode() != ReviewMode.STATIC) {
                ExecutorConfigDto executorConfig = null;
                if (review.getExecutorConfig() != null) {
                    try {
                        executorConfig = objectMapper.readValue(review.getExecutorConfig(), ExecutorConfigDto.class);
                    } catch (Exception e) {
                        log.warn("Could not deserialize executor config: {}", e.getMessage());
                    }
                }
                LLMExecutor executor = executorFactory.create(executorConfig);
                List<Finding> llmFindings = llmJudgeService.judge(request, List.copyOf(allFindings), executor, review.getId());
                allFindings.addAll(llmFindings);
            }

            // Save findings
            if (!allFindings.isEmpty()) {
                findingRepository.saveAll(allFindings);
            }

            // Build summary
            ReviewSummaryDto summary = reportBuilder.buildSummary(allFindings);
            reportBuilder.applyToReview(review, summary);
            review.setStatus(ReviewStatus.COMPLETE);
            review.setCompletedAt(LocalDateTime.now());
            review.setDurationMs(System.currentTimeMillis() - startMs);
            reviewRepository.save(review);

        } catch (Exception e) {
            log.error("Review {} failed: {}", review.getId(), e.getMessage(), e);
            review.setStatus(ReviewStatus.FAILED);
            review.setCompletedAt(LocalDateTime.now());
            review.setDurationMs(System.currentTimeMillis() - startMs);
            reviewRepository.save(review);
        }
    }

    public ReviewResponse buildResponse(Review review, List<Finding> findings) {
        ReviewSummaryDto summary = reportBuilder.buildSummary(findings);
        List<FindingDto> findingDtos = reportBuilder.buildFindingDtos(findings);
        List<AgentActionItemDto> actionItems = reportBuilder.buildActionItems(findings);

        return ReviewResponse.builder()
                .reviewId(review.getId())
                .status(review.getStatus())
                .createdAt(review.getCreatedAt())
                .durationMs(review.getDurationMs())
                .summary(summary)
                .findings(findingDtos)
                .agentActionItems(actionItems)
                .pollingUrl("/api/v1/reviews/" + review.getId() + "/status")
                .streamUrl("/api/v1/reviews/" + review.getId() + "/stream")
                .build();
    }

    private void updateStatus(Review review, ReviewStatus status) {
        review.setStatus(status);
        reviewRepository.save(review);
    }
}
