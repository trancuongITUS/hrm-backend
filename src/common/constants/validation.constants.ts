/**
 * Validation rules, limits, and patterns
 */

// =============================================================================
// VALIDATION LIMITS
// =============================================================================

export const VALIDATION = {
    // Pagination limits
    MIN_PAGE_NUMBER: 1,
    MAX_PAGINATION_LIMIT: 100,
    MIN_PAGINATION_LIMIT: 1,

    // Search query limits
    MIN_SEARCH_LENGTH: 2,
    MAX_SEARCH_LENGTH: 100,

    // General string limits
    MAX_CONTENT_TYPE_LENGTH: 255,

    // Numeric parsing
    DECIMAL_RADIX: 10,
} as const;

// =============================================================================
// FILE UPLOAD LIMITS
// =============================================================================

export const FILE_LIMITS = {
    // Size limits in bytes
    MAX_REQUEST_PAYLOAD: 10 * 1024 * 1024, // 10MB
    MAX_FILE_UPLOAD: 5 * 1024 * 1024, // 5MB
    MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB

    // File count limits
    MAX_FILES_PER_UPLOAD: 5,

    // Size units for display
    BYTES_PER_KB: 1024,
    BYTES_PER_MB: 1024 * 1024,
    BYTES_PER_GB: 1024 * 1024 * 1024,
} as const;

// =============================================================================
// REGEX PATTERNS
// =============================================================================

export const REGEX_PATTERN = {
    SORT_PARAMETER: /^[a-zA-Z_][a-zA-Z0-9_]*(:asc|:desc)?$/,
    NUMERIC_ONLY: /\D/g,
} as const;
