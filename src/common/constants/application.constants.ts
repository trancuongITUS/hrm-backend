/**
 * Application configuration and environment constants
 */

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const DEFAULT = {
    PORT: 3000,
    API_PREFIX: 'api/v1',
    NODE_ENV: 'development',
    LOG_LEVEL: 'log',
    MAX_REQUEST_SIZE: '10mb',
} as const;

// =============================================================================
// ENVIRONMENT VALUES
// =============================================================================

export const ENVIRONMENT = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test',
} as const;

// =============================================================================
// COMPRESSION SETTINGS
// =============================================================================

export const COMPRESSION = {
    THRESHOLD: 1024, // Only compress responses larger than 1KB
    LEVEL: 6, // Compression level (1-9)
} as const;

// =============================================================================
// LOGGING CONSTANTS
// =============================================================================

export const LOG_CONTEXT = {
    HTTP: 'HTTP',
} as const;
