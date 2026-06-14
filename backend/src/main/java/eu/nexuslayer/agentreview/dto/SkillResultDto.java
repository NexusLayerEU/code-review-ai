package eu.nexuslayer.agentreview.dto;

import lombok.Data;

import java.util.List;

@Data
public class SkillResultDto {
    private List<SkillFindingDto> findings;
    private Integer riskScore;
    private String recommendation;
    private String summary;
    private Long durationMs;
}
