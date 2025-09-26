/**
 * HTTP-related constants including status codes, methods, and content types
 */

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    PAYLOAD_TOO_LARGE: 413,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
} as const;

// =============================================================================
// HTTP METHODS
// =============================================================================

export const HTTP_METHOD = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
    OPTIONS: 'OPTIONS',
    HEAD: 'HEAD',
} as const;

export const METHODS_WITH_BODY = [
    HTTP_METHOD.POST,
    HTTP_METHOD.PUT,
    HTTP_METHOD.PATCH,
] as const;

// =============================================================================
// CONTENT TYPES
// =============================================================================

export const CONTENT_TYPE = {
    JSON: 'application/json',
    FORM_URLENCODED: 'application/x-www-form-urlencoded',
    MULTIPART_FORM_DATA: 'multipart/form-data',
    TEXT_PLAIN: 'text/plain',
    TEXT_HTML: 'text/html',
} as const;

export const ALLOWED_CONTENT_TYPES = [
    CONTENT_TYPE.JSON,
    CONTENT_TYPE.FORM_URLENCODED,
    CONTENT_TYPE.MULTIPART_FORM_DATA,
] as const;
