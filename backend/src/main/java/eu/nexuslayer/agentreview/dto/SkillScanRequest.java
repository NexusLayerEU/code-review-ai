package eu.nexuslayer.agentreview.dto;

import lombok.Data;

import java.util.List;

@Data
public class SkillScanRequest {
    private String projectName;
    private String language;
    private String taskDescription;
    private List<ReviewFileDto> files;
}
