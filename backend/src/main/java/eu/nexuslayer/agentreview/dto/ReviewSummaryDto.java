package eu.nexuslayer.agentreview.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class ReviewSummaryDto {
    private int totalFindings;
    private Map<String, Integer> bySeverity;
    private Map<String, Integer> byCategory;
    private int riskScore;
    private String riskLabel;
    private String recommendation;
}
