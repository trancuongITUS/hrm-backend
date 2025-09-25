/**
 * Global type checking utilities
 * These functions can be used throughout the entire application
 */

/**
 * Check if value is null or undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
    return value === null || value === undefined;
}

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
    return typeof value === 'number';
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

/**
 * Check if value is a primitive type (string, number, boolean)
 */
export function isPrimitive(
    value: unknown,
): value is string | number | boolean {
    return isString(value) || isNumber(value) || isBoolean(value);
}

/**
 * Check if value is an empty string
 */
export function isEmptyString(value: unknown): value is '' {
    return value === '';
}

/**
 * Check if value is an object (excluding null)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

/**
 * Check if value is a function
 */
export function isFunction(
    value: unknown,
): value is (...args: unknown[]) => unknown {
    return typeof value === 'function';
}

/**
 * Check if value is defined (not null and not undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
    return !isNullOrUndefined(value);
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, or empty object)
 */
export function isEmpty(value: unknown): boolean {
    if (isNullOrUndefined(value)) {
        return true;
    }

    if (isString(value)) {
        return value.length === 0;
    }

    if (isArray(value)) {
        return value.length === 0;
    }

    if (isObject(value)) {
        return Object.keys(value).length === 0;
    }

    return false;
}
