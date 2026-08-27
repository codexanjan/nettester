-- NetScope Speed Tester PostgreSQL Initial Schema

CREATE TABLE IF NOT EXISTS servers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    hostname VARCHAR(256) NOT NULL,
    port VARCHAR(16) DEFAULT '8000',
    protocol VARCHAR(16) DEFAULT 'http',
    region VARCHAR(64) NOT NULL,
    country VARCHAR(64) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status VARCHAR(32) DEFAULT 'active',
    capacity_gbps DOUBLE PRECISION DEFAULT 10.0,
    is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS test_results (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    client_ip_hash VARCHAR(64),
    server_id VARCHAR(64),
    server_name VARCHAR(128),
    download_mbps DOUBLE PRECISION NOT NULL,
    upload_mbps DOUBLE PRECISION NOT NULL,
    latency_ms DOUBLE PRECISION NOT NULL,
    latency_min_ms DOUBLE PRECISION,
    latency_max_ms DOUBLE PRECISION,
    latency_avg_ms DOUBLE PRECISION,
    jitter_ms DOUBLE PRECISION NOT NULL,
    http_failure_rate DOUBLE PRECISION DEFAULT 0.0,
    stability_score DOUBLE PRECISION NOT NULL,
    overall_score DOUBLE PRECISION NOT NULL,
    speed_score DOUBLE PRECISION,
    latency_score DOUBLE PRECISION,
    duration DOUBLE PRECISION NOT NULL,
    bytes_downloaded BIGINT DEFAULT 0,
    bytes_uploaded BIGINT DEFAULT 0,
    test_mode VARCHAR(32) DEFAULT 'full'
);

CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_client_hash ON test_results(client_ip_hash);
