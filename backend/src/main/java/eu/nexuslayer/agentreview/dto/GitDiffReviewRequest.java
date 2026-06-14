package eu.nexuslayer.agentreview.dto;

import eu.nexuslayer.agentreview.model.ReviewMode;
import lombok.Data;

@Data
public class GitDiffReviewRequest {
    private String localRepoPath;
    private String repoUrl;
    private String branch1;
    private String branch2;
    private String prNumber;
    private String accessToken;
    private String language;
    private String taskDescription;
    private ReviewMode reviewMode = ReviewMode.FULL;
    private String agentId;
    private ExecutorConfigDto executorConfig;
}
