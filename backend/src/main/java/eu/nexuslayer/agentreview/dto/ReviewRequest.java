package eu.nexuslayer.agentreview.dto;

import eu.nexuslayer.agentreview.model.ReviewMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class ReviewRequest {
    private String taskDescription;

    @NotBlank
    private String language = "java";

    private ReviewMode reviewMode = ReviewMode.FULL;
    private String agentId;

    @NotEmpty
    @Valid
    private List<ReviewFileDto> files;

    private ReviewContextDto context;
    private List<String> customRuleSets;
    private ExecutorConfigDto executorConfig;
}
