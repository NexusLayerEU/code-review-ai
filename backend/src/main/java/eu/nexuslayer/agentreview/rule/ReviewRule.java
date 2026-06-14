package eu.nexuslayer.agentreview.rule;

import eu.nexuslayer.agentreview.entity.Finding;
import eu.nexuslayer.agentreview.model.FindingCategory;
import eu.nexuslayer.agentreview.model.Severity;

import java.util.List;
import java.util.Set;

public interface ReviewRule {
    String getId();
    String getName();
    FindingCategory getCategory();
    Severity getDefaultSeverity();
    Set<String> getSupportedLanguages();
    List<Finding> analyze(RuleContext context);
    default boolean isEnabled() { return true; }
}
