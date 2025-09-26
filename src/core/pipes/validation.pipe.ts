import {
    PipeTransform,
    Injectable,
    ArgumentMetadata,
    BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ERROR_CODE } from '../../common/constants';

/**
 * Properly typed validation error response
 */
interface ValidationErrorResponse {
    property: string;
    value: unknown;
    constraints: Record<string, string>;
}

/**
 * Custom validation pipe with proper type safety
 * Eliminates the need for eslint-disable comments
 */
@Injectable()
export class ValidationPipe implements PipeTransform<unknown, unknown> {
    async transform(
        value: unknown,
        { metatype }: ArgumentMetadata,
    ): Promise<unknown> {
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }

        // Transform plain object to class instance
        const object = plainToInstance(
            metatype,
            value as Record<string, unknown>,
        );

        // Validate with proper typing
        const errors = await validate(object as object, {
            whitelist: true,
            forbidNonWhitelisted: true,
        });

        if (errors.length > 0) {
            throw new BadRequestException({
                message: this.formatErrors(errors),
                error: ERROR_CODE.VALIDATION_FAILED,
                details:
                    'Request validation failed. Please check your input data.',
            });
        }

        return object;
    }

    /**
     * Type-safe validation check
     */
    private toValidate(metatype: new (...args: unknown[]) => unknown): boolean {
        const types: Array<new (...args: unknown[]) => unknown> = [
            String,
            Boolean,
            Number,
            Array,
            Object,
        ];
        return !types.includes(metatype);
    }

    /**
     * Properly typed error formatting
     */
    private formatErrors(errors: ValidationError[]): ValidationErrorResponse[] {
        return errors
            .map((error) => this.mapChildrenToValidationErrors(error))
            .flat();
    }

    /**
     * Type-safe validation error mapping
     */
    private mapChildrenToValidationErrors(
        error: ValidationError,
        parentPath?: string,
    ): ValidationErrorResponse | ValidationErrorResponse[] {
        const currentPath = parentPath
            ? `${parentPath}.${error.property}`
            : error.property;

        if (!(error.children && error.children.length)) {
            return {
                property: currentPath,
                value: error.value,
                constraints: error.constraints || {},
            };
        }

        const validationErrors: ValidationErrorResponse[] = [];

        // Add current level constraints if they exist
        if (error.constraints) {
            validationErrors.push({
                property: currentPath,
                value: error.value,
                constraints: error.constraints,
            });
        }

        // Add children errors with proper typing
        error.children.forEach((child) => {
            const childErrors = this.mapChildrenToValidationErrors(
                child,
                currentPath,
            );
            if (Array.isArray(childErrors)) {
                validationErrors.push(...childErrors);
            } else {
                validationErrors.push(childErrors);
            }
        });

        return validationErrors;
    }
}
