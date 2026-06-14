package eu.nexuslayer.agentreview.dto;

import eu.nexuslayer.agentreview.model.ReviewStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ReviewResponse {
    private String reviewId;
    private ReviewStatus status;
    private LocalDateTime createdAt;
    private Long durationMs;
    private ReviewSummaryDto summary;
    private List<FindingDto> findings;
    private List<AgentActionItemDto> agentActionItems;
    private String pollingUrl;
    private String streamUrl;
}
