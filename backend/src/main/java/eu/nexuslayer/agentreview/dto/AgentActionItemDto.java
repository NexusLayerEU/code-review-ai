package eu.nexuslayer.agentreview.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AgentActionItemDto {
    private int priority;
    private String action;
    private String findingId;
    private String instruction;
}
