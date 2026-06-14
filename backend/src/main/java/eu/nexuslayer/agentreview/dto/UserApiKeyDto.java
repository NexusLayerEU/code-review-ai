package eu.nexuslayer.agentreview.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserApiKeyDto {
    private String id;
    private String name;
    private String keyPrefix;
    private LocalDateTime createdAt;
    private LocalDateTime lastUsedAt;
    /** Only present on creation — never returned again. */
    private String plainKey;
}
