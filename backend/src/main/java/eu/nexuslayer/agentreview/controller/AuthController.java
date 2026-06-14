package eu.nexuslayer.agentreview.controller;

import eu.nexuslayer.agentreview.dto.AuthResponse;
import eu.nexuslayer.agentreview.dto.LoginRequest;
import eu.nexuslayer.agentreview.dto.RegisterRequest;
import eu.nexuslayer.agentreview.entity.User;
import eu.nexuslayer.agentreview.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(AuthResponse.builder()
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole().name())
                .build());
    }
}
