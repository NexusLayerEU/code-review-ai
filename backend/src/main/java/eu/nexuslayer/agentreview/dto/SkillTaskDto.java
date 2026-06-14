package eu.nexuslayer.agentreview.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SkillTaskDto {
    private String reviewId;
    private String language;
    private String taskDescription;
    private List<ReviewFileDto> files;
    private ReviewContextDto context;
}
