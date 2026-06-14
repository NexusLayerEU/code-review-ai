CREATE TABLE api_symbols (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    package_name VARCHAR(255) NOT NULL,
    package_version VARCHAR(50) NOT NULL,
    language VARCHAR(20) NOT NULL,
    symbol_path VARCHAR(500) NOT NULL,
    symbol_type VARCHAR(50),
    introduced_in VARCHAR(50),
    deprecated_in VARCHAR(50),
    removed_in VARCHAR(50),
    replacement VARCHAR(500),
    INDEX idx_pkg_version (package_name, package_version),
    INDEX idx_symbol (symbol_path(191)),
    INDEX idx_language (language)
);
