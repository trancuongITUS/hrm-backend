import {
    PipeTransform,
    Injectable,
    ArgumentMetadata,
    BadRequestException,
} from '@nestjs/common';
import { ERROR_CODE } from '../../common/constants';

/**
 * UUID version types
 */
type UuidVersion = '3' | '4' | '5' | 'all';

/**
 * Configuration options for ParseUUIDPipe
 */
interface ParseUuidOptions {
    version?: UuidVersion;
    errorMessage?: string;
}

/**
 * Enhanced ParseUUIDPipe with version validation
 * Validates and parses UUID strings with optional version checking
 */
@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
    private readonly options: ParseUuidOptions;

    // UUID regex patterns for different versions
    private readonly uuidPatterns = {
        '3': /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        '4': /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        '5': /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        all: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    };

    constructor(options: ParseUuidOptions = {}) {
        this.options = {
            version: 'all',
            ...options,
        };
    }

    /**
     * Transform and validate UUID string
     */
    transform(value: string, metadata: ArgumentMetadata): string {
        if (value === undefined || value === null) {
            throw new BadRequestException({
                message: `${metadata.data || 'UUID'} is required`,
                error: ERROR_CODE.MISSING_UUID,
                details: 'UUID value is required but was not provided.',
            });
        }

        const stringValue = String(value).trim();

        if (stringValue === '') {
            throw new BadRequestException({
                message: `${metadata.data || 'UUID'} cannot be empty`,
                error: ERROR_CODE.EMPTY_UUID,
                details: 'UUID value cannot be an empty string.',
            });
        }

        const pattern = this.uuidPatterns[this.options.version!];

        if (!pattern.test(stringValue)) {
            const versionMessage =
                this.options.version === 'all'
                    ? 'valid UUID'
                    : `UUID version ${this.options.version}`;

            throw new BadRequestException({
                message:
                    this.options.errorMessage ||
                    `${metadata.data || 'Value'} must be a ${versionMessage}`,
                error: ERROR_CODE.INVALID_UUID,
                details: `Provided value "${value}" is not a valid ${versionMessage}.`,
            });
        }

        return stringValue.toLowerCase();
    }
}
