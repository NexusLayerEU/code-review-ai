package eu.nexuslayer.agentreview.controller;

import eu.nexuslayer.agentreview.entity.User;
import eu.nexuslayer.agentreview.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> myStats(
            @RequestParam(defaultValue = "30") int days,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(analyticsService.getUserStats(user.getId(), days));
    }

    @GetMapping("/agent/{agentId}")
    public ResponseEntity<Map<String, Object>> agentStats(
            @PathVariable String agentId,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getAgentStats(agentId, days));
    }
}
