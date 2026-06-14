package eu.nexuslayer.agentreview.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReviewFileDto {
    @NotBlank
    private String path;

    @NotBlank
    private String content;

    private boolean isDiff = false;
}
