/**
 * Security-related constants including rate limiting, timeouts, and sensitive data
 */

// =============================================================================
// RATE LIMITING
// =============================================================================

export const RATE_LIMIT = {
    // Time windows (in milliseconds)
    SHORT_TTL: 60000, // 1 minute
    MEDIUM_TTL: 300000, // 5 minutes
    LONG_TTL: 900000, // 15 minutes

    // Request limits per time window
    SHORT_LIMIT: 10, // 10 requests per minute
    MEDIUM_LIMIT: 50, // 50 requests per 5 minutes
    LONG_LIMIT: 100, // 100 requests per 15 minutes

    // Rate limit names
    NAMES: {
        SHORT: 'short',
        MEDIUM: 'medium',
        LONG: 'long',
    },
} as const;

// =============================================================================
// TIMEOUTS & DELAYS
// =============================================================================

export const TIMEOUT = {
    // Default timeouts (in milliseconds)
    DEFAULT_REQUEST_TIMEOUT: 30000, // 30 seconds

    // Circuit breaker timeouts
    CIRCUIT_BREAKER_RECOVERY: 60000, // 1 minute
    CIRCUIT_BREAKER_MONITORING: 300000, // 5 minutes
    CIRCUIT_BREAKER_MAX_CALLS: 3,
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: 5,

    // Retry configuration
    DEFAULT_MAX_RETRIES: 3,
    BASE_RETRY_DELAY: 1000, // 1 second
    MAX_RETRY_DELAY: 10000, // 10 seconds
    RETRY_JITTER_PERCENT: 0.1, // 10% jitter
} as const;

// =============================================================================
// SENSITIVE DATA FIELDS
// =============================================================================

export const SENSITIVE_FIELDS = [
    'password',
    'token',
    'secret',
    'apiKey',
    'privateKey',
    'ssn',
    'creditCard',
] as const;

// =============================================================================
// REQUIRED HEADERS
// =============================================================================

export const REQUIRED_HEADERS = ['user-agent'] as const;

// =============================================================================
// CIRCUIT BREAKER STATES
// =============================================================================

export const CIRCUIT_STATE = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN',
} as const;

// =============================================================================
// NETWORK ERROR CODES
// =============================================================================

export const NETWORK_ERROR = {
    ECONNRESET: 'ECONNRESET',
    ENOTFOUND: 'ENOTFOUND',
    ECONNREFUSED: 'ECONNREFUSED',
} as const;

// =============================================================================
// TIMEOUT CONSTANTS
// =============================================================================

export const TIMEOUT_MS = 'TIMEOUT_MS';

export const TIMEOUT_ERROR = {
    TIMEOUT_ERROR: 'TimeoutError',
} as const;

// =============================================================================
// SECURITY HEADERS
// =============================================================================

export const SECURITY_HEADERS = {
    X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
    X_FRAME_OPTIONS: 'X-Frame-Options',
    X_XSS_PROTECTION: 'X-XSS-Protection',
} as const;

export const SECURITY_HEADER_VALUES = {
    NOSNIFF: 'nosniff',
    DENY: 'DENY',
    XSS_BLOCK: '1; mode=block',
} as const;

// =============================================================================
// HTTP SAFE METHODS
// =============================================================================

export const SAFE_HTTP_METHODS = ['GET', 'HEAD', 'OPTIONS'] as const;
