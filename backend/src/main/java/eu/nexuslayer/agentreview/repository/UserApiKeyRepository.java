package eu.nexuslayer.agentreview.repository;

import eu.nexuslayer.agentreview.entity.UserApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserApiKeyRepository extends JpaRepository<UserApiKey, String> {
    List<UserApiKey> findByUserIdAndRevokedFalseOrderByCreatedAtDesc(String userId);
    Optional<UserApiKey> findByKeyHashAndRevokedFalse(String keyHash);
}
