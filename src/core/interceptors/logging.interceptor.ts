import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Logging interceptor that logs all incoming requests and their responses
 * Provides detailed information for monitoring and debugging
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const startTime = Date.now();
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const { method, url, ip, headers } = request;
        const userAgent = headers['user-agent'] || 'Unknown';
        const contentLength = headers['content-length'] || '0';

        // Log incoming request
        this.logger.log(
            `Incoming Request: ${method} ${url}`,
            JSON.stringify({
                method,
                url,
                ip,
                userAgent,
                contentLength,
                timestamp: new Date().toISOString(),
                requestId: this.getRequestId(request),
            }),
        );

        return next.handle().pipe(
            tap((data) => {
                const duration = Date.now() - startTime;
                const { statusCode } = response;

                // Log successful response
                this.logger.log(
                    `Outgoing Response: ${method} ${url} - ${statusCode} [${duration}ms]`,
                    JSON.stringify({
                        method,
                        url,
                        statusCode,
                        duration,
                        responseSize: this.getResponseSize(data),
                        timestamp: new Date().toISOString(),
                        requestId: this.getRequestId(request),
                    }),
                );
            }),
            catchError((error: Error & { status?: number }) => {
                const duration = Date.now() - startTime;
                const statusCode = error.status || 500;

                // Log error response
                this.logger.error(
                    `Error Response: ${method} ${url} - ${statusCode} [${duration}ms]`,
                    error.stack || 'No stack trace available',
                    JSON.stringify({
                        method,
                        url,
                        statusCode,
                        duration,
                        error: error.message || 'Unknown error',
                        timestamp: new Date().toISOString(),
                        requestId: this.getRequestId(request),
                    }),
                );

                throw error;
            }),
        );
    }

    /**
     * Gets or generates a request ID for tracking
     */
    private getRequestId(request: Request): string {
        // Check if request ID is already set (by another middleware)
        const existingId = request.headers['x-request-id'] as string;
        if (existingId) {
            return existingId;
        }

        // Generate a new request ID
        const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        request.headers['x-request-id'] = requestId;
        return requestId;
    }

    /**
     * Estimates response size for logging
     */
    private getResponseSize(data: any): string {
        if (!data) return '0 bytes';

        try {
            const size = JSON.stringify(data).length;
            return this.formatBytes(size);
        } catch {
            return 'unknown';
        }
    }

    /**
     * Formats bytes to human readable format
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 bytes';

        const k = 1024;
        const sizes = ['bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
}
