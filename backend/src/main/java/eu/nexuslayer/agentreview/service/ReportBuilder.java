package eu.nexuslayer.agentreview.service;

import eu.nexuslayer.agentreview.dto.*;
import eu.nexuslayer.agentreview.entity.Finding;
import eu.nexuslayer.agentreview.entity.Review;
import eu.nexuslayer.agentreview.model.Severity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@Slf4j
public class ReportBuilder {

    private static final int RISK_PASS = 25;
    private static final int RISK_WARN = 75;

    public ReviewSummaryDto buildSummary(List<Finding> findings) {
        int riskScore = calculateRiskScore(findings);
        String riskLabel = calculateRiskLabel(riskScore);
        String recommendation = calculateRecommendation(riskScore);

        Map<String, Integer> bySeverity = new LinkedHashMap<>();
        for (Severity s : Severity.values()) {
            long count = findings.stream().filter(f -> f.getSeverity() == s).count();
            if (count > 0) bySeverity.put(s.name(), (int) count);
        }

        Map<String, Integer> byCategory = findings.stream()
                .collect(Collectors.groupingBy(f -> f.getCategory().name(), Collectors.summingInt(f -> 1)));

        return ReviewSummaryDto.builder()
                .totalFindings(findings.size())
                .bySeverity(bySeverity)
                .byCategory(byCategory)
                .riskScore(riskScore)
                .riskLabel(riskLabel)
                .recommendation(recommendation)
                .build();
    }

    public List<AgentActionItemDto> buildActionItems(List<Finding> findings) {
        return findings.stream()
                .filter(f -> f.getSeverity() == Severity.CRITICAL || f.getSeverity() == Severity.HIGH)
                .sorted(Comparator.comparingInt(f -> -f.getSeverity().getWeight()))
                .limit(10)
                .map(this::toActionItem)
                .collect(Collectors.toList());
    }

    public List<FindingDto> buildFindingDtos(List<Finding> findings) {
        return findings.stream()
                .sorted(Comparator.comparingInt(f -> -f.getSeverity().getWeight()))
                .map(this::toFindingDto)
                .collect(Collectors.toList());
    }

    public void applyToReview(Review review, ReviewSummaryDto summary) {
        if (summary == null) {
            log.warn("Summary is null for review {}, skipping applyToReview", review.getId());
            return;
        }
        review.setRiskScore(summary.getRiskScore());
        review.setRiskLabel(summary.getRiskLabel());
        review.setRecommendation(summary.getRecommendation());
    }

    public int calculateRiskScore(List<Finding> findings) {
        return findings.stream()
                .mapToInt(f -> (int) (f.getSeverity().getWeight() * f.getConfidence().getMultiplier()))
                .sum();
    }

    private String calculateRiskLabel(int score) {
        if (score <= RISK_PASS) return "LOW";
        if (score <= RISK_WARN) return "MEDIUM";
        return "HIGH";
    }

    private String calculateRecommendation(int score) {
        if (score <= RISK_PASS) return "PASS";
        if (score <= RISK_WARN) return "WARN";
        return "BLOCK";
    }

    private AgentActionItemDto toActionItem(Finding f) {
        int priority = switch (f.getSeverity()) {
            case CRITICAL -> 1;
            case HIGH -> 2;
            default -> 3;
        };
        return AgentActionItemDto.builder()
                .priority(priority)
                .findingId(f.getId())
                .action("Fix " + f.getRuleId() + ": " + truncate(f.getDescription(), 100))
                .instruction(f.getSuggestion() != null ? f.getSuggestion() : "Review and address this finding")
                .build();
    }

    private FindingDto toFindingDto(Finding f) {
        return FindingDto.builder()
                .id(f.getId())
                .ruleId(f.getRuleId())
                .category(f.getCategory())
                .severity(f.getSeverity())
                .confidence(f.getConfidence())
                .layer(f.getAnalysisLayer())
                .file(f.getFilePath())
                .lineStart(f.getLineStart())
                .lineEnd(f.getLineEnd())
                .description(f.getDescription())
                .suggestion(f.getSuggestion())
                .evidence(f.getEvidence())
                .build();
    }

    private String truncate(String s, int max) {
        return s != null && s.length() > max ? s.substring(0, max) + "..." : s;
    }
}
