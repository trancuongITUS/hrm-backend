/**
 * Global object manipulation utilities
 * These functions can be used throughout the entire application
 */

/**
 * Merge options with defaults, ensuring all required fields are present
 * This is a generic utility that can be used for any configuration merging
 */
export function mergeOptions<T extends Record<string, unknown>>(
    defaults: Required<T>,
    options: Partial<T> = {},
): Required<T> {
    return { ...defaults, ...options } as Required<T>;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as T;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => deepClone(item)) as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }

    return cloned;
}

/**
 * Pick specific properties from an object
 */
export function pick<T extends object, K extends keyof T>(
    obj: T,
    keys: K[],
): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach((key) => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}

/**
 * Omit specific properties from an object
 */
export function omit<T extends object, K extends keyof T>(
    obj: T,
    keys: K[],
): Omit<T, K> {
    const result = { ...obj };
    keys.forEach((key) => {
        delete result[key];
    });
    return result as Omit<T, K>;
}

/**
 * Check if an object has a specific property
 */
export function hasProperty<
    T extends Record<string, unknown>,
    K extends string,
>(obj: T, property: K): obj is T & Record<K, unknown> {
    return Object.prototype.hasOwnProperty.call(obj, property);
}
