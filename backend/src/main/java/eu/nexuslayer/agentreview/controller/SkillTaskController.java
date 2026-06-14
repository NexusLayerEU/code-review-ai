package eu.nexuslayer.agentreview.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import eu.nexuslayer.agentreview.dto.*;
import eu.nexuslayer.agentreview.entity.Finding;
import eu.nexuslayer.agentreview.entity.Review;
import eu.nexuslayer.agentreview.entity.User;
import eu.nexuslayer.agentreview.model.*;
import eu.nexuslayer.agentreview.repository.FindingRepository;
import eu.nexuslayer.agentreview.repository.ReviewRepository;
import eu.nexuslayer.agentreview.service.ReportBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/skill")
@RequiredArgsConstructor
@Slf4j
public class SkillTaskController {

    private final ReviewRepository reviewRepository;
    private final FindingRepository findingRepository;
    private final ReportBuilder reportBuilder;
    private final ObjectMapper objectMapper;

    /**
     * Skill-initiated scan: register a new review already in PROCESSING state.
     * The skill reads files locally, calls this to get a reviewId, analyzes them,
     * then posts results to /tasks/{id}/complete. No web UI action needed.
     */
    @PostMapping("/scan")
    @Transactional
    public ResponseEntity<Map<String, String>> scan(
            @RequestBody SkillScanRequest request,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        String lang = request.getLanguage() != null ? request.getLanguage() : "unknown";
        Review review = Review.builder()
                .id(UUID.randomUUID().toString())
                .userId(user.getId())
                .agentId(request.getProjectName())
                .language(lang)
                .sourceType(SourceType.DIRECTORY)
                .reviewMode(ReviewMode.FULL)
                .executorType(ExecutorType.REMOTE_SKILL)
                .taskDescription(request.getTaskDescription())
                .status(ReviewStatus.PROCESSING)
                .createdAt(LocalDateTime.now())
                .build();
        if (request.getFiles() != null) {
            try {
                review.setSourceMeta(objectMapper.writeValueAsString(request.getFiles()));
            } catch (Exception e) {
                log.warn("Could not serialize files for scan: {}", e.getMessage());
            }
        }
        reviewRepository.save(review);
        log.info("Skill scan registered: reviewId={} project={} lang={} files={}",
                review.getId(), request.getProjectName(), lang,
                request.getFiles() != null ? request.getFiles().size() : 0);
        Map<String, String> resp = new LinkedHashMap<>();
        resp.put("reviewId", review.getId());
        resp.put("status", "PROCESSING");
        return ResponseEntity.ok(resp);
    }

    /** List recent completed reviews for this user — lets the skill show a history summary. */
    @GetMapping("/reviews")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> reviews(Authentication auth) {
        User user = (User) auth.getPrincipal();
        List<Review> recent = reviewRepository.findRecentByUserId(user.getId(), PageRequest.of(0, 20));
        List<Map<String, Object>> result = recent.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("reviewId", r.getId());
            m.put("createdAt", r.getCreatedAt());
            m.put("status", r.getStatus().name());
            m.put("language", r.getLanguage());
            m.put("projectName", r.getAgentId() != null ? r.getAgentId() : "");
            m.put("riskScore", r.getRiskScore() != null ? r.getRiskScore() : 0);
            m.put("recommendation", r.getRecommendation() != null ? r.getRecommendation() : "");
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    /** Poll for pending tasks. Atomically marks them PROCESSING so no task is picked up twice. */
    @GetMapping("/tasks/pending")
    @Transactional
    public ResponseEntity<List<SkillTaskDto>> pending(Authentication auth) {
        User user = (User) auth.getPrincipal();
        List<Review> pending = reviewRepository
                .findByUserIdAndExecutorTypeAndStatusOrderByCreatedAtAsc(
                        user.getId(), ExecutorType.REMOTE_SKILL, ReviewStatus.PENDING);

        List<SkillTaskDto> tasks = new ArrayList<>();
        for (Review review : pending) {
            review.setStatus(ReviewStatus.PROCESSING);
            reviewRepository.save(review);
            tasks.add(toTaskDto(review));
        }
        return ResponseEntity.ok(tasks);
    }

    /** Skill posts completed findings and verdict. */
    @PostMapping("/tasks/{reviewId}/complete")
    @Transactional
    public ResponseEntity<Void> complete(
            @PathVariable String reviewId,
            @RequestBody SkillResultDto result,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        var opt = reviewRepository.findById(reviewId)
                .filter(r -> user.getId().equals(r.getUserId()))
                .filter(r -> r.getStatus() == ReviewStatus.PROCESSING || r.getStatus() == ReviewStatus.PENDING);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Review review = opt.get();

        List<Finding> findings = mapFindings(result.getFindings(), reviewId);
        if (!findings.isEmpty()) {
            findingRepository.saveAll(findings);
        }

        ReviewSummaryDto summary = reportBuilder.buildSummary(findings);
        if (result.getRiskScore() != null) {
            summary = ReviewSummaryDto.builder()
                    .totalFindings(summary.getTotalFindings())
                    .bySeverity(summary.getBySeverity())
                    .byCategory(summary.getByCategory())
                    .riskScore(result.getRiskScore())
                    .riskLabel(summary.getRiskLabel())
                    .recommendation(result.getRecommendation() != null
                            ? result.getRecommendation()
                            : summary.getRecommendation())
                    .build();
        }

        reportBuilder.applyToReview(review, summary);
        review.setStatus(ReviewStatus.COMPLETE);
        review.setCompletedAt(LocalDateTime.now());
        if (result.getDurationMs() != null) review.setDurationMs(result.getDurationMs());
        reviewRepository.save(review);
        log.info("Skill completed review {} — score={} rec={}", reviewId, review.getRiskScore(), review.getRecommendation());
        return ResponseEntity.noContent().build();
    }

    /** Skill reports a failure. */
    @PostMapping("/tasks/{reviewId}/fail")
    @Transactional
    public ResponseEntity<Void> fail(
            @PathVariable String reviewId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        var failOpt = reviewRepository.findById(reviewId)
                .filter(r -> user.getId().equals(r.getUserId()));
        if (failOpt.isEmpty()) return ResponseEntity.notFound().build();
        Review failReview = failOpt.get();
        failReview.setStatus(ReviewStatus.FAILED);
        failReview.setCompletedAt(LocalDateTime.now());
        reviewRepository.save(failReview);
        log.warn("Skill failed review {}: {}", reviewId, body.get("error"));
        return ResponseEntity.noContent().build();
    }

    private SkillTaskDto toTaskDto(Review review) {
        List<ReviewFileDto> files = List.of();
        if (review.getSourceMeta() != null) {
            try {
                ReviewFileDto[] arr = objectMapper.readValue(review.getSourceMeta(), ReviewFileDto[].class);
                files = List.of(arr);
            } catch (Exception e) {
                log.warn("Could not deserialize files for review {}", review.getId());
            }
        }
        return SkillTaskDto.builder()
                .reviewId(review.getId())
                .language(review.getLanguage())
                .taskDescription(review.getTaskDescription())
                .files(files)
                .build();
    }

    private List<Finding> mapFindings(List<SkillFindingDto> dtos, String reviewId) {
        if (dtos == null) return List.of();
        return dtos.stream().map(d -> {
            Severity severity = parseSeverity(d.getSeverity());
            Confidence confidence = parseConfidence(d.getConfidence());
            FindingCategory category = parseCategory(d.getCategory());
            return Finding.builder()
                    .id(UUID.randomUUID().toString())
                    .reviewId(reviewId)
                    .ruleId(d.getRuleId() != null ? d.getRuleId() : "REMOTE_SKILL")
                    .category(category)
                    .severity(severity)
                    .confidence(confidence)
                    .analysisLayer(3)
                    .filePath(d.getFilePath())
                    .lineStart(d.getLineStart())
                    .lineEnd(d.getLineEnd())
                    .description(d.getDescription())
                    .suggestion(d.getSuggestion())
                    .evidence(d.getEvidence())
                    .build();
        }).toList();
    }

    private Severity parseSeverity(String s) {
        if (s == null) return Severity.MEDIUM;
        try { return Severity.valueOf(s.toUpperCase()); } catch (Exception e) { return Severity.MEDIUM; }
    }

    private Confidence parseConfidence(String s) {
        if (s == null) return Confidence.MEDIUM;
        try { return Confidence.valueOf(s.toUpperCase()); } catch (Exception e) { return Confidence.MEDIUM; }
    }

    private FindingCategory parseCategory(String s) {
        if (s == null) return FindingCategory.CONFIDENCE_BUG;
        try { return FindingCategory.valueOf(s.toUpperCase()); } catch (Exception e) { return FindingCategory.CONFIDENCE_BUG; }
    }
}
