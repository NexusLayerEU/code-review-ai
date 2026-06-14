package eu.nexuslayer.agentreview.repository;

import eu.nexuslayer.agentreview.entity.Review;
import eu.nexuslayer.agentreview.model.ExecutorType;
import eu.nexuslayer.agentreview.model.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, String> {
    Page<Review> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    List<Review> findByUserIdAndExecutorTypeAndStatusOrderByCreatedAtAsc(
            String userId, ExecutorType executorType, ReviewStatus status);
    Page<Review> findByAgentIdOrderByCreatedAtDesc(String agentId, Pageable pageable);
    Page<Review> findByRecommendationOrderByCreatedAtDesc(String recommendation, Pageable pageable);
    List<Review> findByStatusIn(List<ReviewStatus> statuses);
    long countByUserId(String userId);

    @Query("SELECT r FROM Review r WHERE r.agentId = :agentId AND r.createdAt >= :since")
    List<Review> findByAgentIdSince(@Param("agentId") String agentId, @Param("since") LocalDateTime since);

    @Query("SELECT r FROM Review r WHERE r.userId = :userId ORDER BY r.createdAt DESC")
    List<Review> findRecentByUserId(@Param("userId") String userId, Pageable pageable);
}
