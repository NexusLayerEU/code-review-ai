package eu.nexuslayer.agentreview.rule;

import eu.nexuslayer.agentreview.entity.Finding;

import java.util.List;
import java.util.Map;

public record RuleContext(
    String code,
    String language,
    String taskDescription,
    Map<String, String> dependencies,
    List<Finding> priorFindings,
    String filePath
) {}
