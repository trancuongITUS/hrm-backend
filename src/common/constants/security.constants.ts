/**
 * Security-related constants including rate limiting, timeouts, and sensitive data
 */

// =============================================================================
// CIRCUIT BREAKER & RETRY CONFIGURATION
// Note: Basic timeouts and rate limits are now managed by ConfigService
// =============================================================================

export const CIRCUIT_BREAKER = {
    // Circuit breaker timeouts
    RECOVERY_TIME: 60000, // 1 minute
    MONITORING_WINDOW: 300000, // 5 minutes
    MAX_CALLS: 3,
    FAILURE_THRESHOLD: 5,
} as const;

export const RETRY = {
    // Retry configuration
    DEFAULT_MAX_RETRIES: 3,
    BASE_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
    JITTER_PERCENT: 0.1, // 10% jitter
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
