/**
 * Pipe-specific utility functions
 * These utilities are specialized for pipe operations and transformations
 */

import {
    isNullOrUndefined,
    isString,
    isNumber,
    isBoolean,
} from '../../../common/utils/type.util';
import { mergeOptions } from '../../../common/utils/object.util';

/**
 * Safely convert value to string, avoiding [object Object] issues
 * Returns the original value if it's an object to prevent unwanted stringification
 * This is pipe-specific because it handles the special case of returning objects as-is
 */
export function safeStringConversion(
    value: unknown,
): string | object | null | undefined {
    if (isNullOrUndefined(value)) {
        return value;
    }

    if (isString(value)) {
        return value;
    }

    if (isNumber(value) || isBoolean(value)) {
        return String(value);
    }

    // Return objects as-is to avoid [object Object]
    return value;
}

// Re-export commonly used utilities for convenience in pipes
export {
    isNullOrUndefined,
    isString,
    isNumber,
    isBoolean,
} from '../../../common/utils/type.util';
export { mergeOptions } from '../../../common/utils/object.util';

/**
 * Trim string with various options
 */
export interface TrimOptions extends Record<string, unknown> {
    trimStart?: boolean;
    trimEnd?: boolean;
    removeExtraSpaces?: boolean;
    preserveNewlines?: boolean;
}

export function trimString(value: string, options: TrimOptions = {}): string {
    const opts = mergeOptions(
        {
            trimStart: true,
            trimEnd: true,
            removeExtraSpaces: false,
            preserveNewlines: true,
        } as Required<TrimOptions>,
        options,
    );

    let result = value;

    // Trim start
    if (opts.trimStart) {
        result = result.replace(/^\s+/, '');
    }

    // Trim end
    if (opts.trimEnd) {
        result = result.replace(/\s+$/, '');
    }

    // Remove extra spaces
    if (opts.removeExtraSpaces) {
        if (opts.preserveNewlines) {
            // Replace multiple spaces/tabs with single space, but keep newlines
            result = result.replace(/[^\S\n]+/g, ' ');
            // Remove spaces around newlines
            result = result.replace(/\s*\n\s*/g, '\n');
        } else {
            // Replace all multiple whitespace with single space
            result = result.replace(/\s+/g, ' ');
        }
    }

    return result;
}
