package eu.nexuslayer.agentreview.dto;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String email;
    private String username;
    private String role;
}
