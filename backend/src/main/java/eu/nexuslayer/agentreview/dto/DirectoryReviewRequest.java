package eu.nexuslayer.agentreview.dto;

import eu.nexuslayer.agentreview.model.ReviewMode;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class DirectoryReviewRequest {
    @NotBlank
    private String directoryPath;

    private String language;
    private String taskDescription;
    private ReviewMode reviewMode = ReviewMode.FULL;
    private String agentId;
    private List<String> includeExtensions;
    private List<String> excludePatterns;
    private ExecutorConfigDto executorConfig;
}
