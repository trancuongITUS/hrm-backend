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

// =============================================================================
// AUTHENTICATION & PASSWORD SECURITY
// =============================================================================

export const AUTH = {
    // Password hashing
    BCRYPT_SALT_ROUNDS: 12,

    // Token expiry times (in milliseconds)
    REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
    REFRESH_TOKEN_EXPIRY_DAYS: 7,

    // Session configuration
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
} as const;

// =============================================================================
// AUTHENTICATION ERROR MESSAGES
// =============================================================================

export const AUTH_ERROR_MESSAGES = {
    // User existence errors
    EMAIL_EXISTS: 'User with this email already exists',
    USERNAME_TAKEN: 'Username is already taken',
    USER_NOT_FOUND: 'User not found',

    // Credential errors
    INVALID_CREDENTIALS: 'Invalid credentials',
    INCORRECT_PASSWORD: 'Current password is incorrect',

    // Token errors
    INVALID_REFRESH_TOKEN: 'Invalid refresh token',
    REFRESH_TOKEN_EXPIRED: 'Refresh token expired or revoked',

    // Account status errors
    ACCOUNT_INACTIVE: 'Account is inactive',
    ACCOUNT_LOCKED:
        'Account is temporarily locked due to too many failed login attempts',
} as const;
