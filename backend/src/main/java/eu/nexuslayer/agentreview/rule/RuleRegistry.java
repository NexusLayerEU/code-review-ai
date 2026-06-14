package eu.nexuslayer.agentreview.rule;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
@RequiredArgsConstructor
public class RuleRegistry {

    private final List<ReviewRule> builtInRules;

    public List<ReviewRule> getRulesFor(String language, List<String> customRuleSetIds) {
        return builtInRules.stream()
                .filter(ReviewRule::isEnabled)
                .filter(rule -> rule.getSupportedLanguages().contains(language.toLowerCase()) ||
                                rule.getSupportedLanguages().contains("all"))
                .collect(Collectors.toList());
    }

    public List<ReviewRule> getAllBuiltInRules() {
        return builtInRules;
    }
}
