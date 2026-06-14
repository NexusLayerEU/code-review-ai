package eu.nexuslayer.agentreview.security;

import eu.nexuslayer.agentreview.entity.User;
import eu.nexuslayer.agentreview.entity.UserApiKey;
import eu.nexuslayer.agentreview.repository.UserRepository;
import eu.nexuslayer.agentreview.service.UserApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final UserApiKeyService keyService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("X-API-Key");
        if (header != null && header.startsWith("ar_")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            keyService.authenticate(header).ifPresent(apiKey -> {
                userRepository.findById(apiKey.getUserId()).ifPresent(user -> {
                    var auth = new UsernamePasswordAuthenticationToken(
                            user, null, user.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    keyService.touch(apiKey);
                });
            });
        }
        chain.doFilter(request, response);
    }
}
