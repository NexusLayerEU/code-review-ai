package eu.nexuslayer.agentreview.dto;

import lombok.Data;

@Data
public class SkillFindingDto {
    private String ruleId;
    private String category;
    private String severity;
    private String confidence;
    private String filePath;
    private Integer lineStart;
    private Integer lineEnd;
    private String description;
    private String suggestion;
    private String evidence;
}
