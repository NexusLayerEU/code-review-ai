package eu.nexuslayer.agentreview.controller;

import eu.nexuslayer.agentreview.rule.ReviewRule;
import eu.nexuslayer.agentreview.rule.RuleRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/rules")
@RequiredArgsConstructor
public class RuleController {

    private final RuleRegistry ruleRegistry;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listRules() {
        List<Map<String, Object>> rules = ruleRegistry.getAllBuiltInRules().stream()
                .map(rule -> Map.<String, Object>of(
                        "id", rule.getId(),
                        "name", rule.getName(),
                        "category", rule.getCategory().name(),
                        "defaultSeverity", rule.getDefaultSeverity().name(),
                        "supportedLanguages", rule.getSupportedLanguages(),
                        "enabled", rule.isEnabled()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(rules);
    }
}
