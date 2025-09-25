import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { Request } from 'express';

/**
 * Validation interceptor for request/response validation
 * Provides additional validation beyond standard NestJS pipes
 */
@Injectable()
export class ValidationInterceptor implements NestInterceptor {
    private readonly logger = new Logger(ValidationInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();

        // Validate request
        this.validateRequest(request);

        return next.handle().pipe(
            map((response) => {
                // Validate response if needed
                this.validateResponse(response, request);
                return response;
            }),
        );
    }

    /**
     * Validates incoming request data
     */
    private validateRequest(request: Request): void {
        // Validate request size
        this.validateRequestSize(request);

        // Validate content type for POST/PUT/PATCH requests
        this.validateContentType(request);

        // Validate required headers
        this.validateRequiredHeaders(request);

        // Validate query parameters
        this.validateQueryParameters(request);
    }

    /**
     * Validates request size to prevent oversized payloads
     */
    private validateRequestSize(request: Request): void {
        const contentLength = request.headers['content-length'];
        if (contentLength) {
            const size = parseInt(contentLength, 10);
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (size > maxSize) {
                throw new BadRequestException({
                    message: 'Request payload too large',
                    error: 'PAYLOAD_TOO_LARGE',
                    maxSize: `${maxSize} bytes`,
                    receivedSize: `${size} bytes`,
                });
            }
        }
    }

    /**
     * Validates content type for requests with body
     */
    private validateContentType(request: Request): void {
        const { method } = request;
        const hasBody = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());

        if (hasBody) {
            const contentType = request.headers['content-type'];
            if (!contentType) {
                throw new BadRequestException({
                    message: 'Content-Type header is required',
                    error: 'MISSING_CONTENT_TYPE',
                });
            }

            const allowedTypes = [
                'application/json',
                'application/x-www-form-urlencoded',
                'multipart/form-data',
            ];

            const isValidType = allowedTypes.some((type) =>
                contentType.toLowerCase().includes(type),
            );

            if (!isValidType) {
                throw new BadRequestException({
                    message: 'Invalid Content-Type',
                    error: 'INVALID_CONTENT_TYPE',
                    allowedTypes,
                    receivedType: contentType,
                });
            }
        }
    }

    /**
     * Validates required headers
     */
    private validateRequiredHeaders(request: Request): void {
        const requiredHeaders = ['user-agent'];

        for (const header of requiredHeaders) {
            if (!request.headers[header]) {
                this.logger.warn(`Missing required header: ${header}`, {
                    url: request.url,
                    method: request.method,
                    ip: request.ip,
                });
            }
        }
    }

    /**
     * Validates query parameters
     */
    private validateQueryParameters(request: Request): void {
        const { query } = request;

        // Validate pagination parameters
        if (query.page) {
            const page = parseInt(query.page as string, 10);
            if (isNaN(page) || page < 1) {
                throw new BadRequestException({
                    message: 'Invalid page parameter',
                    error: 'INVALID_PAGE',
                    details: 'Page must be a positive integer',
                });
            }
        }

        if (query.limit) {
            const limit = parseInt(query.limit as string, 10);
            if (isNaN(limit) || limit < 1 || limit > 100) {
                throw new BadRequestException({
                    message: 'Invalid limit parameter',
                    error: 'INVALID_LIMIT',
                    details: 'Limit must be between 1 and 100',
                });
            }
        }

        // Validate sort parameters
        if (query.sort) {
            const sort = query.sort as string;
            const validSortPattern = /^[a-zA-Z_][a-zA-Z0-9_]*(:asc|:desc)?$/;

            if (!validSortPattern.test(sort)) {
                throw new BadRequestException({
                    message: 'Invalid sort parameter format',
                    error: 'INVALID_SORT_FORMAT',
                    details: 'Sort must be in format: field or field:asc/desc',
                    example: 'createdAt:desc',
                });
            }
        }

        // Validate search parameters
        if (query.search) {
            const search = query.search as string;
            if (search.length < 2) {
                throw new BadRequestException({
                    message: 'Search query too short',
                    error: 'SEARCH_TOO_SHORT',
                    details: 'Search query must be at least 2 characters long',
                });
            }

            if (search.length > 100) {
                throw new BadRequestException({
                    message: 'Search query too long',
                    error: 'SEARCH_TOO_LONG',
                    details: 'Search query must be less than 100 characters',
                });
            }
        }
    }

    /**
     * Validates response data
     */
    private validateResponse(response: any, request: Request): void {
        // Skip validation for certain content types
        const contentType = request.headers['accept'];
        if (contentType && !contentType.includes('application/json')) {
            return;
        }

        // Validate response structure
        this.validateResponseStructure(response);

        // Check for sensitive data in response
        this.checkSensitiveData(response, request);
    }

    /**
     * Validates response structure
     */
    private validateResponseStructure(response: any): void {
        if (!response) {
            return;
        }

        // Check if response follows standard format
        if (
            typeof response === 'object' &&
            response !== null &&
            'success' in response
        ) {
            const requiredFields = ['success', 'statusCode', 'timestamp'];

            for (const field of requiredFields) {
                if (!(field in response)) {
                    this.logger.warn(
                        `Response missing required field: ${field}`,
                    );
                }
            }
        }
    }

    /**
     * Checks for sensitive data in response
     */
    private checkSensitiveData(response: unknown, request: Request): void {
        if (!response || typeof response !== 'object') {
            return;
        }

        const sensitiveFields = [
            'password',
            'token',
            'secret',
            'apiKey',
            'privateKey',
            'ssn',
            'creditCard',
        ];

        const responseStr = JSON.stringify(response).toLowerCase();

        for (const field of sensitiveFields) {
            if (responseStr.includes(`"${field}"`)) {
                this.logger.error(
                    `Potential sensitive data leak in response: ${field}`,
                    {
                        url: request.url,
                        method: request.method,
                        field,
                    },
                );
            }
        }
    }

    /**
     * Validates DTO using class-validator
     */
    async validateDto<T>(dto: unknown, dtoClass: new () => T): Promise<T> {
        if (!dto || !dtoClass) {
            throw new BadRequestException('Invalid DTO or DTO class');
        }

        const object = plainToClass(dtoClass, dto as Record<string, unknown>);
        const errors = await validate(object as object);

        if (errors.length > 0) {
            const formattedErrors = this.formatValidationErrors(errors);
            throw new BadRequestException({
                message: 'Validation failed',
                error: 'VALIDATION_ERROR',
                details: formattedErrors,
            });
        }

        return object;
    }

    /**
     * Formats validation errors for better readability
     */
    private formatValidationErrors(errors: ValidationError[]): any[] {
        return errors.map((error) => ({
            property: error.property,
            value: error.value,
            constraints: error.constraints,
            children:
                error.children && error.children.length > 0
                    ? this.formatValidationErrors(error.children)
                    : undefined,
        }));
    }
}
