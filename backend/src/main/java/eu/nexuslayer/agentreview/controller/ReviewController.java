package eu.nexuslayer.agentreview.controller;

import eu.nexuslayer.agentreview.dto.*;
import eu.nexuslayer.agentreview.entity.Finding;
import eu.nexuslayer.agentreview.entity.Review;
import eu.nexuslayer.agentreview.entity.User;
import eu.nexuslayer.agentreview.model.ReviewStatus;
import eu.nexuslayer.agentreview.model.SourceType;
import eu.nexuslayer.agentreview.repository.FindingRepository;
import eu.nexuslayer.agentreview.repository.ReviewRepository;
import eu.nexuslayer.agentreview.service.DirectoryReviewService;
import eu.nexuslayer.agentreview.service.GitDiffService;
import eu.nexuslayer.agentreview.service.ReviewOrchestrator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@Slf4j
public class ReviewController {

    private final ReviewOrchestrator orchestrator;
    private final ReviewRepository reviewRepository;
    private final FindingRepository findingRepository;
    private final DirectoryReviewService directoryReviewService;
    private final GitDiffService gitDiffService;

    @PostMapping
    public ResponseEntity<ReviewResponse> submit(@Valid @RequestBody ReviewRequest request, Authentication auth) {
        User user = (User) auth.getPrincipal();
        Review review = orchestrator.createReview(request, user.getId(), SourceType.CODE_PASTE);
        orchestrator.runReview(review, request);
        return ResponseEntity.accepted().body(ReviewResponse.builder()
                .reviewId(review.getId())
                .status(ReviewStatus.PENDING)
                .pollingUrl("/api/v1/reviews/" + review.getId() + "/status")
                .streamUrl("/api/v1/reviews/" + review.getId() + "/stream")
                .build());
    }

    @PostMapping("/directory")
    public ResponseEntity<ReviewResponse> submitDirectory(@Valid @RequestBody DirectoryReviewRequest request, Authentication auth) {
        try {
            ReviewRequest reviewRequest = directoryReviewService.buildReviewRequest(request);
            User user = (User) auth.getPrincipal();
            Review review = orchestrator.createReview(reviewRequest, user.getId(), SourceType.DIRECTORY);
            orchestrator.runReview(review, reviewRequest);
            return ResponseEntity.accepted().body(ReviewResponse.builder()
                    .reviewId(review.getId())
                    .status(ReviewStatus.PENDING)
                    .pollingUrl("/api/v1/reviews/" + review.getId() + "/status")
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ReviewResponse.builder()
                    .reviewId(null).status(ReviewStatus.FAILED).build());
        } catch (Exception e) {
            log.error("Directory review failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/git-diff")
    public ResponseEntity<ReviewResponse> submitGitDiff(@Valid @RequestBody GitDiffReviewRequest request, Authentication auth) {
        try {
            ReviewRequest reviewRequest = gitDiffService.buildReviewRequest(request);
            User user = (User) auth.getPrincipal();
            Review review = orchestrator.createReview(reviewRequest, user.getId(), SourceType.GIT_DIFF);
            orchestrator.runReview(review, reviewRequest);
            return ResponseEntity.accepted().body(ReviewResponse.builder()
                    .reviewId(review.getId())
                    .status(ReviewStatus.PENDING)
                    .pollingUrl("/api/v1/reviews/" + review.getId() + "/status")
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Git diff review failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<ReviewResponse> get(@PathVariable String id, Authentication auth) {
        User user = (User) auth.getPrincipal();
        return reviewRepository.findById(id)
                .filter(r -> r.getUserId() == null || r.getUserId().equals(user.getId()))
                .map(review -> {
                    List<Finding> findings = findingRepository.findByReviewIdOrderBySeverityAsc(review.getId());
                    return ResponseEntity.ok(orchestrator.buildResponse(review, findings));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/status")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getStatus(@PathVariable String id, Authentication auth) {
        User user = (User) auth.getPrincipal();
        return reviewRepository.findById(id)
                .filter(r -> r.getUserId() == null || r.getUserId().equals(user.getId()))
                .map(review -> ResponseEntity.ok(Map.<String, Object>of(
                        "reviewId", review.getId(),
                        "status", review.getStatus().name(),
                        "riskScore", review.getRiskScore() != null ? review.getRiskScore() : 0,
                        "recommendation", review.getRecommendation() != null ? review.getRecommendation() : "",
                        "durationMs", review.getDurationMs() != null ? review.getDurationMs() : 0
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Page<Review>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(reviewRepository.findByUserIdOrderByCreatedAtDesc(
                user.getId(), PageRequest.of(page, Math.min(size, 50))));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        User user = (User) auth.getPrincipal();
        var found = reviewRepository.findById(id)
                .filter(r -> r.getUserId() != null && r.getUserId().equals(user.getId()));
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        findingRepository.deleteByReviewId(found.get().getId());
        reviewRepository.delete(found.get());
        return ResponseEntity.noContent().build();
    }
}
