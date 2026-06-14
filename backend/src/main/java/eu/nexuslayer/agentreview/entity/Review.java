package eu.nexuslayer.agentreview.entity;

import eu.nexuslayer.agentreview.model.*;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    private String id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "agent_id")
    private String agentId;

    @Column(nullable = false)
    private String language;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    @Builder.Default
    private SourceType sourceType = SourceType.CODE_PASTE;

    @Column(name = "source_meta", columnDefinition = "JSON")
    private String sourceMeta;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_mode", nullable = false)
    @Builder.Default
    private ReviewMode reviewMode = ReviewMode.FULL;

    @Enumerated(EnumType.STRING)
    @Column(name = "executor_type", nullable = false)
    @Builder.Default
    private ExecutorType executorType = ExecutorType.CLAUDE_API;

    @Column(name = "executor_config", columnDefinition = "JSON")
    private String executorConfig;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReviewStatus status = ReviewStatus.PENDING;

    @Column(name = "task_description", columnDefinition = "TEXT")
    private String taskDescription;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "risk_label")
    private String riskLabel;

    @Column(name = "recommendation")
    private String recommendation;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "duration_ms")
    private Long durationMs;
}
