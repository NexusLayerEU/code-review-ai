package eu.nexuslayer.agentreview.controller;

import eu.nexuslayer.agentreview.dto.UserApiKeyDto;
import eu.nexuslayer.agentreview.entity.User;
import eu.nexuslayer.agentreview.service.UserApiKeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/keys")
@RequiredArgsConstructor
public class ApiKeyController {

    private final UserApiKeyService keyService;

    @PostMapping
    public ResponseEntity<UserApiKeyDto> generate(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        String name = body.getOrDefault("name", "My key");
        if (name.isBlank() || name.length() > 100) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(keyService.generate(user.getId(), name));
    }

    @GetMapping
    public ResponseEntity<List<UserApiKeyDto>> list(Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(keyService.list(user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revoke(@PathVariable String id, Authentication auth) {
        User user = (User) auth.getPrincipal();
        keyService.revoke(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
