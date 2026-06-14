package eu.nexuslayer.agentreview.dto;

import eu.nexuslayer.agentreview.model.*;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FindingDto {
    private String id;
    private String ruleId;
    private FindingCategory category;
    private Severity severity;
    private Confidence confidence;
    private int layer;
    private String file;
    private Integer lineStart;
    private Integer lineEnd;
    private String description;
    private String suggestion;
    private String evidence;
}
