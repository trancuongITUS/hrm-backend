import { Injectable } from '@nestjs/common';
import { BaseStringPipe, BasePipeOptions } from './base/base.pipe';
import { trimString, TrimOptions as UtilTrimOptions } from './utils/pipe.utils';

/**
 * Configuration options for TrimPipe
 */
interface TrimPipeOptions extends BasePipeOptions, UtilTrimOptions {
    onlyStrings?: boolean;
}

/**
 * Enhanced TrimPipe for string whitespace handling
 * Trims whitespace and optionally removes extra spaces
 */
@Injectable()
export class TrimPipe extends BaseStringPipe<TrimPipeOptions> {
    constructor(options: Partial<TrimPipeOptions> = {}) {
        super(
            {
                skipNullAndUndefined: true,
                onlyStrings: true,
                trimStart: true,
                trimEnd: true,
                removeExtraSpaces: false,
                preserveNewlines: true,
            },
            options,
        );
    }

    /**
     * Transform value by trimming whitespace if it's a string
     */
    protected doTransform(value: unknown): unknown {
        const stringValue = this.ensureString(value);

        // If ensureString returned the original value (not a string), return it
        if (stringValue === value && typeof value !== 'string') {
            return value;
        }

        return trimString(stringValue, {
            trimStart: this.options.trimStart,
            trimEnd: this.options.trimEnd,
            removeExtraSpaces: this.options.removeExtraSpaces,
            preserveNewlines: this.options.preserveNewlines,
        });
    }
}
