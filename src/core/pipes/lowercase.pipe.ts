import { Injectable } from '@nestjs/common';
import { BaseStringPipe, BasePipeOptions } from './base/base.pipe';
import { safeStringConversion } from './utils/pipe.utils';

/**
 * Configuration options for LowerCasePipe
 */
interface LowerCaseOptions extends BasePipeOptions {
    trim?: boolean;
    onlyStrings?: boolean;
}

/**
 * LowerCasePipe for consistent string formatting
 * Converts string values to lowercase with optional trimming
 */
@Injectable()
export class LowerCasePipe extends BaseStringPipe<LowerCaseOptions> {
    constructor(options: Partial<LowerCaseOptions> = {}) {
        super(
            {
                skipNullAndUndefined: true,
                trim: true,
                onlyStrings: true,
            },
            options,
        );
    }

    /**
     * Transform value to lowercase if it's a string
     */
    protected doTransform(value: unknown): unknown {
        // Use safe string conversion from utilities
        const converted = safeStringConversion(value);

        // If conversion returned the original value (not a string), return it
        if (converted === value && typeof value !== 'string') {
            return value;
        }

        let stringValue = converted as string;

        if (this.options.trim) {
            stringValue = stringValue.trim();
        }

        return stringValue.toLowerCase();
    }
}
