/**
 * Centralized constants export
 * Import all constants from a single location for better maintainability
 *
 * Note: Environment-dependent configuration values (ports, timeouts, rate limits, etc.)
 * are now managed by the ConfigService. These constants contain only static values
 * that don't change based on environment.
 *
 * Organized by domain:
 * - application: Environment types, compression settings
 * - error: Error codes and error-related constants
 * - http: HTTP status codes, methods, content types
 * - performance: Monitoring thresholds and metrics constants
 * - security: Circuit breaker, retry logic, sensitive data patterns
 * - validation: Validation rules, limits, and regex patterns
 */

// Application constants (non-environment dependent)
export * from './application.constants';

// Error handling
export * from './error.constants';

// HTTP-related constants
export * from './http.constants';

// Performance monitoring
export * from './performance.constants';

// Security patterns and logic
export * from './security.constants';

// Validation and file handling
export * from './validation.constants';
