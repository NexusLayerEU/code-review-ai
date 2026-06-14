package eu.nexuslayer.agentreview.rule;

import eu.nexuslayer.agentreview.entity.Finding;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class RuleEngine {

    private final RuleRegistry ruleRegistry;

    public List<Finding> run(RuleContext context, String reviewId, List<String> customRuleSets) {
        List<ReviewRule> rules = ruleRegistry.getRulesFor(context.language(), customRuleSets);
        List<Finding> findings = new ArrayList<>();
        for (ReviewRule rule : rules) {
            try {
                List<Finding> ruleFindings = rule.analyze(context);
                ruleFindings.forEach(f -> f.setReviewId(reviewId));
                findings.addAll(ruleFindings);
            } catch (Exception e) {
                log.warn("Rule {} failed: {}", rule.getId(), e.getMessage());
            }
        }
        return findings;
    }
}
