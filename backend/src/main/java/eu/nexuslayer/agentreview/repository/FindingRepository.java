package eu.nexuslayer.agentreview.repository;

import eu.nexuslayer.agentreview.entity.Finding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FindingRepository extends JpaRepository<Finding, String> {
    List<Finding> findByReviewId(String reviewId);
    List<Finding> findByReviewIdOrderBySeverityAsc(String reviewId);
    void deleteByReviewId(String reviewId);

    @Query("SELECT f.ruleId, COUNT(f) FROM Finding f WHERE f.reviewId IN " +
           "(SELECT r.id FROM Review r WHERE r.agentId = :agentId) " +
           "GROUP BY f.ruleId ORDER BY COUNT(f) DESC")
    List<Object[]> findTopRulesByAgentId(@Param("agentId") String agentId);

    @Query("SELECT f.category, COUNT(f) FROM Finding f WHERE f.reviewId IN " +
           "(SELECT r.id FROM Review r WHERE r.agentId = :agentId) " +
           "GROUP BY f.category ORDER BY COUNT(f) DESC")
    List<Object[]> findTopCategoriesByAgentId(@Param("agentId") String agentId);
}
