CREATE TABLE custom_rule_sets (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_user_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE custom_rules (
    id VARCHAR(36) PRIMARY KEY,
    rule_set_id VARCHAR(36) NOT NULL,
    rule_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    languages JSON NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    pattern_config JSON NOT NULL,
    message TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (rule_set_id) REFERENCES custom_rule_sets(id) ON DELETE CASCADE
);

CREATE TABLE built_in_rule_overrides (
    rule_id VARCHAR(100) PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    severity_override VARCHAR(20),
    config_json JSON
);
