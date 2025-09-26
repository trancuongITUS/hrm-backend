/**
 * Application constants that are not environment-dependent
 * Note: Environment-dependent values are now managed by the ConfigService
 */

// =============================================================================
// ENVIRONMENT VALUES (for type checking and comparisons)
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
