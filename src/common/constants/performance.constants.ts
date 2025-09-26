/**
 * Performance monitoring and metrics constants
 */

// =============================================================================
// PERFORMANCE & MONITORING
// =============================================================================

export const PERFORMANCE = {
    // Response time thresholds (in milliseconds)
    SLOW_REQUEST_THRESHOLD: 5000, // 5 seconds
    DEGRADED_RESPONSE_TIME: 2000, // 2 seconds

    // Error rate thresholds (in percentage)
    UNHEALTHY_ERROR_RATE: 10, // 10%
    DEGRADED_ERROR_RATE: 5, // 5%

    // Metrics logging
    METRICS_LOG_INTERVAL: 100, // Log metrics every 100 requests
    TOP_STATUS_CODES_LIMIT: 5, // Show top 5 status codes

    // Cache management
    CACHE_CLEANUP_THRESHOLD: 1000, // Clean cache when > 1000 entries
    DEFAULT_CACHE_TTL: 300000, // 5 minutes in milliseconds
} as const;

// =============================================================================
// HEALTH STATUS
// =============================================================================

export const HEALTH_STATUS = {
    HEALTHY: 'healthy',
    DEGRADED: 'degraded',
    UNHEALTHY: 'unhealthy',
} as const;
