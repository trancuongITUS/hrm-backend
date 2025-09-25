import { PipeTransform, Injectable } from '@nestjs/common';
import { isNullOrUndefined, isString } from '../../../common/utils/type.util';
import { mergeOptions } from '../../../common/utils/object.util';

/**
 * Base options that all pipes can extend
 */
export interface BasePipeOptions {
    skipNullAndUndefined?: boolean;
}

/**
 * Abstract base pipe class that provides common functionality
 * Implements the Template Method pattern for pipe operations
 */
@Injectable()
export abstract class BasePipe<
    TOptions extends BasePipeOptions = BasePipeOptions,
> implements PipeTransform<unknown, unknown>
{
    protected readonly options: Required<TOptions>;

    constructor(
        defaultOptions: Required<TOptions>,
        userOptions: Partial<TOptions> = {},
    ) {
        this.options = mergeOptions(
            defaultOptions,
            userOptions,
        ) as Required<TOptions>;
    }

    /**
     * Main transform method - implements Template Method pattern
     */
    transform(value: unknown): unknown {
        // Early return for null/undefined if configured to skip
        if (this.options.skipNullAndUndefined && isNullOrUndefined(value)) {
            return value;
        }

        // Pre-processing hook
        const preprocessed = this.preProcess(value);
        if (preprocessed !== value) {
            return preprocessed;
        }

        // Main transformation logic (implemented by subclasses)
        const transformed = this.doTransform(value);

        // Post-processing hook
        return this.postProcess(transformed);
    }

    /**
     * Pre-processing hook - can be overridden by subclasses
     * Return the same value to continue processing, or a different value to short-circuit
     */
    protected preProcess(value: unknown): unknown {
        return value;
    }

    /**
     * Main transformation logic - must be implemented by subclasses
     */
    protected abstract doTransform(value: unknown): unknown;

    /**
     * Post-processing hook - can be overridden by subclasses
     */
    protected postProcess(value: unknown): unknown {
        return value;
    }
}

/**
 * Base pipe for string transformations
 * Provides common string-specific functionality
 */
@Injectable()
export abstract class BaseStringPipe<
    TOptions extends BasePipeOptions & { onlyStrings?: boolean },
> extends BasePipe<TOptions> {
    /**
     * Pre-processing for string pipes
     */
    protected preProcess(value: unknown): unknown {
        // Skip non-strings if onlyStrings option is enabled
        if (this.options.onlyStrings && !isString(value)) {
            return value;
        }

        // Handle null/undefined
        if (isNullOrUndefined(value)) {
            return this.options.skipNullAndUndefined
                ? value
                : this.handleNullOrUndefined(value);
        }

        return value;
    }

    /**
     * Handle null or undefined values - can be overridden by subclasses
     */
    protected handleNullOrUndefined(value: null | undefined): unknown {
        return value;
    }

    /**
     * Ensure value is a string before transformation
     */
    protected ensureString(value: unknown): string {
        if (isString(value)) {
            return value;
        }

        // Use safe string conversion utility
        const converted = this.convertToString(value);
        return isString(converted) ? converted : String(value);
    }

    /**
     * Convert value to string safely - can be overridden by subclasses
     */
    protected convertToString(
        value: unknown,
    ): string | object | null | undefined {
        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        // Return objects as-is to avoid [object Object]
        return value as string | object | null | undefined;
    }
}
