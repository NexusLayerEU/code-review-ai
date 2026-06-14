CREATE TABLE user_api_keys (
    id          VARCHAR(36)  NOT NULL,
    user_id     VARCHAR(36)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    key_hash    VARCHAR(64)  NOT NULL,
    key_prefix  VARCHAR(16)  NOT NULL,
    created_at  DATETIME(6)  NOT NULL,
    last_used_at DATETIME(6),
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_key_hash (key_hash),
    CONSTRAINT fk_api_key_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
