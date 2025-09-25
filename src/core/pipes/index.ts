/**
 * Core pipes for NestJS application
 *
 * This module exports all common pipes used throughout the application.
 * Each pipe follows NestJS best practices and provides comprehensive
 * validation and transformation capabilities.
 */

// Base classes and utilities
export { BasePipe, BaseStringPipe } from './base/base.pipe';
export * from './utils/pipe.utils';

// Concrete pipe implementations
export { ValidationPipe } from './validation.pipe';
export { ParseIntPipe } from './parse-int.pipe';
export { ParseUuidPipe } from './parse-uuid.pipe';
export { TrimPipe } from './trim.pipe';
export { LowerCasePipe } from './lowercase.pipe';
export { DefaultValuePipe } from './default-value.pipe';
export { SanitizePipe } from './sanitize.pipe';
export { FileValidationPipe } from './file-validation.pipe';
