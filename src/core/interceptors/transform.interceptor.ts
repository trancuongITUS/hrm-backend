import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { SuccessResponse } from '../../common/types/api-response.type';

/**
 * Transform interceptor that wraps all successful responses in a standard format
 * Ensures consistent API response structure across the application
 */
@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, SuccessResponse<T>>
{
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<SuccessResponse<T>> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response & { statusCode: number }>();

        return next.handle().pipe(
            map((data: unknown) => {
                // Don't transform if data is already in the correct format
                if (data && typeof data === 'object' && 'success' in data) {
                    return data as SuccessResponse<T>;
                }

                // Check if this is a paginated response
                const isPaginated =
                    data &&
                    typeof data === 'object' &&
                    'data' in data &&
                    'meta' in data;
                const dataObj = data as Record<string, unknown>;

                const transformedResponse: SuccessResponse<T> = {
                    success: true,

                    statusCode: response.statusCode,
                    message: this.getSuccessMessage(request.method),
                    data: isPaginated ? (dataObj.data as T) : (data as T),
                    timestamp: new Date().toISOString(),
                    path: request.url,
                };

                // Add pagination metadata if present
                if (isPaginated && dataObj.meta) {
                    transformedResponse.meta =
                        dataObj.meta as SuccessResponse<T>['meta'];
                }

                return transformedResponse;
            }),
        );
    }

    /**
     * Gets appropriate success message based on HTTP method
     */
    private getSuccessMessage(method: string): string {
        const messages: Record<string, string> = {
            GET: 'Data retrieved successfully',
            POST: 'Resource created successfully',
            PUT: 'Resource updated successfully',
            PATCH: 'Resource updated successfully',
            DELETE: 'Resource deleted successfully',
        };

        return (
            messages[method.toUpperCase()] || 'Operation completed successfully'
        );
    }
}
