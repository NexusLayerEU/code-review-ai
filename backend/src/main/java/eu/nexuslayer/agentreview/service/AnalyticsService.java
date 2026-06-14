package eu.nexuslayer.agentreview.service;

import eu.nexuslayer.agentreview.entity.Review;
import eu.nexuslayer.agentreview.repository.FindingRepository;
import eu.nexuslayer.agentreview.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ReviewRepository reviewRepository;
    private final FindingRepository findingRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getAgentStats(String agentId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Review> reviews = reviewRepository.findByAgentIdSince(agentId, since);

        long total = reviews.size();
        long pass = reviews.stream().filter(r -> "PASS".equals(r.getRecommendation())).count();
        long warn = reviews.stream().filter(r -> "WARN".equals(r.getRecommendation())).count();
        long block = reviews.stream().filter(r -> "BLOCK".equals(r.getRecommendation())).count();

        double avgRisk = reviews.stream()
                .filter(r -> r.getRiskScore() != null)
                .mapToInt(Review::getRiskScore)
                .average().orElse(0);

        List<Object[]> topRules = findingRepository.findTopRulesByAgentId(agentId);
        List<Object[]> topCategories = findingRepository.findTopCategoriesByAgentId(agentId);

        Map<String, Integer> ruleFrequency = new LinkedHashMap<>();
        topRules.stream().limit(10).forEach(row -> ruleFrequency.put(String.valueOf(row[0]), ((Number) row[1]).intValue()));

        Map<String, Integer> categoryFrequency = new LinkedHashMap<>();
        topCategories.stream().limit(8).forEach(row -> categoryFrequency.put(String.valueOf(row[0]), ((Number) row[1]).intValue()));

        Map<String, Object> result = new HashMap<>();
        result.put("agentId", agentId);
        result.put("totalReviews", total);
        result.put("pass", pass);
        result.put("warn", warn);
        result.put("block", block);
        result.put("passRate", total > 0 ? (double) pass / total : 0.0);
        result.put("avgRiskScore", Math.round(avgRisk * 10.0) / 10.0);
        result.put("topRules", ruleFrequency);
        result.put("topCategories", categoryFrequency);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUserStats(String userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Review> recent = reviewRepository.findRecentByUserId(userId, PageRequest.of(0, 100));
        List<Review> filtered = recent.stream()
                .filter(r -> r.getCreatedAt().isAfter(since))
                .collect(Collectors.toList());

        long total = filtered.size();
        Map<String, Long> byRecommendation = filtered.stream()
                .filter(r -> r.getRecommendation() != null)
                .collect(Collectors.groupingBy(Review::getRecommendation, Collectors.counting()));

        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId);
        result.put("totalReviews", total);
        result.put("byRecommendation", byRecommendation);
        return result;
    }
}
