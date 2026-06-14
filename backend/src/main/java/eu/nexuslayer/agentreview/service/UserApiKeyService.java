package eu.nexuslayer.agentreview.service;

import eu.nexuslayer.agentreview.dto.UserApiKeyDto;
import eu.nexuslayer.agentreview.entity.UserApiKey;
import eu.nexuslayer.agentreview.repository.UserApiKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserApiKeyService {

    private final UserApiKeyRepository keyRepository;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional
    public UserApiKeyDto generate(String userId, String name) {
        byte[] raw = new byte[32];
        SECURE_RANDOM.nextBytes(raw);
        String plain = "ar_" + HexFormat.of().formatHex(raw);
        String hash = sha256(plain);
        String prefix = plain.substring(0, 12) + "...";

        UserApiKey key = UserApiKey.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .name(name)
                .keyHash(hash)
                .keyPrefix(prefix)
                .createdAt(LocalDateTime.now())
                .revoked(false)
                .build();
        keyRepository.save(key);

        return UserApiKeyDto.builder()
                .id(key.getId())
                .name(key.getName())
                .keyPrefix(prefix)
                .createdAt(key.getCreatedAt())
                .plainKey(plain)
                .build();
    }

    public List<UserApiKeyDto> list(String userId) {
        return keyRepository.findByUserIdAndRevokedFalseOrderByCreatedAtDesc(userId).stream()
                .map(k -> UserApiKeyDto.builder()
                        .id(k.getId())
                        .name(k.getName())
                        .keyPrefix(k.getKeyPrefix())
                        .createdAt(k.getCreatedAt())
                        .lastUsedAt(k.getLastUsedAt())
                        .build())
                .toList();
    }

    @Transactional
    public void revoke(String keyId, String userId) {
        keyRepository.findById(keyId).ifPresent(k -> {
            if (!k.getUserId().equals(userId)) return;
            k.setRevoked(true);
            keyRepository.save(k);
        });
    }

    public java.util.Optional<UserApiKey> authenticate(String plain) {
        String hash = sha256(plain);
        return keyRepository.findByKeyHashAndRevokedFalse(hash);
    }

    @Transactional
    public void touch(UserApiKey key) {
        key.setLastUsedAt(LocalDateTime.now());
        keyRepository.save(key);
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 unavailable", e);
        }
    }
}
