import {
    PipeTransform,
    Injectable,
    ArgumentMetadata,
    BadRequestException,
} from '@nestjs/common';

/**
 * Configuration options for ParseIntPipe
 */
interface ParseIntOptions {
    min?: number;
    max?: number;
    allowNegative?: boolean;
    errorMessage?: string;
}

/**
 * Enhanced ParseIntPipe with validation options
 * Safely parses strings to integers with optional range validation
 */
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
    private readonly options: ParseIntOptions;

    constructor(options: ParseIntOptions = {}) {
        this.options = {
            allowNegative: true,
            ...options,
        };
    }

    /**
     * Transform string value to integer with validation
     */
    transform(value: string, metadata: ArgumentMetadata): number {
        if (value === undefined || value === null) {
            throw new BadRequestException({
                message: `${metadata.data || 'Value'} is required`,
                error: 'MISSING_VALUE',
                details: 'Integer value is required but was not provided.',
            });
        }

        const stringValue = String(value).trim();

        if (stringValue === '') {
            throw new BadRequestException({
                message: `${metadata.data || 'Value'} cannot be empty`,
                error: 'EMPTY_VALUE',
                details: 'Integer value cannot be an empty string.',
            });
        }

        const parsedValue = parseInt(stringValue, 10);

        if (isNaN(parsedValue)) {
            throw new BadRequestException({
                message:
                    this.options.errorMessage ||
                    `${metadata.data || 'Value'} must be a valid integer`,
                error: 'INVALID_INTEGER',
                details: `Provided value "${value}" is not a valid integer.`,
            });
        }

        // Check if negative values are allowed
        if (!this.options.allowNegative && parsedValue < 0) {
            throw new BadRequestException({
                message: `${metadata.data || 'Value'} must be a positive integer`,
                error: 'NEGATIVE_NOT_ALLOWED',
                details: 'Negative integers are not allowed for this field.',
            });
        }

        // Check minimum value
        if (this.options.min !== undefined && parsedValue < this.options.min) {
            throw new BadRequestException({
                message: `${metadata.data || 'Value'} must be at least ${this.options.min}`,
                error: 'VALUE_TOO_SMALL',
                details: `Minimum allowed value is ${this.options.min}.`,
            });
        }

        // Check maximum value
        if (this.options.max !== undefined && parsedValue > this.options.max) {
            throw new BadRequestException({
                message: `${metadata.data || 'Value'} must be at most ${this.options.max}`,
                error: 'VALUE_TOO_LARGE',
                details: `Maximum allowed value is ${this.options.max}.`,
            });
        }

        return parsedValue;
    }
}
