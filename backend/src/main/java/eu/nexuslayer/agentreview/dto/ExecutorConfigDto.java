package eu.nexuslayer.agentreview.dto;

import eu.nexuslayer.agentreview.model.ExecutorType;
import lombok.Data;

@Data
public class ExecutorConfigDto {
    private ExecutorType type = ExecutorType.CLAUDE_API;
    private String apiKey;
    private String model = "claude-sonnet-4-6";
    private String cliPath;
    private String extraArgs;
}
