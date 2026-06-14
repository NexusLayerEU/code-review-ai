package eu.nexuslayer.agentreview.controller;

import eu.nexuslayer.agentreview.dto.AuthResponse;
import eu.nexuslayer.agentreview.dto.LoginRequest;
import eu.nexuslayer.agentreview.dto.RegisterRequest;
import eu.nexuslayer.agentreview.entity.User;
import eu.nexuslayer.agentreview.repository.UserRepository;
import eu.nexuslayer.agentreview.security.JwtService;
import eu.nexuslayer.agentreview.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole().name())
                .build());
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
