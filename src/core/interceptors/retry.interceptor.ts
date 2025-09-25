import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, delay, retryWhen, scan, take } from 'rxjs/operators';

/**
 * Retry interceptor that handles transient failures with exponential backoff
 * Configurable retry attempts and delay strategies
 */
@Injectable()
export class RetryInterceptor implements NestInterceptor {
    private readonly logger = new Logger(RetryInterceptor.name);
    private readonly maxRetries: number;
    private readonly baseDelay: number;
    private readonly maxDelay: number;

    constructor(
        maxRetries: number = 3,
        baseDelay: number = 1000,
        maxDelay: number = 10000,
    ) {
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context
            .switchToHttp()
            .getRequest<{ method: string; url: string }>();
        const { method, url } = request;

        // Only retry safe HTTP methods
        if (!this.isSafeMethod(method)) {
            return next.handle();
        }

        return next.handle().pipe(
            retryWhen((errors) =>
                errors.pipe(
                    scan((retryCount, error) => {
                        // Don't retry client errors (4xx) except for specific cases
                        if (!this.shouldRetry(error, retryCount)) {
                            throw error;
                        }

                        const nextRetryCount = retryCount + 1;
                        const delayTime = this.calculateDelay(nextRetryCount);

                        this.logger.warn(
                            `Retry attempt ${nextRetryCount}/${this.maxRetries} for ${method} ${url} after ${delayTime}ms`,
                            {
                                error: (error as Error).message,
                                attempt: nextRetryCount,
                                delay: delayTime,
                            },
                        );

                        return nextRetryCount;
                    }, 0),
                    delay(this.calculateDelay(1)),
                    take(this.maxRetries),
                ),
            ),
            catchError((error) => {
                this.logger.error(
                    `All retry attempts exhausted for ${method} ${url}`,
                    (error as Error).stack,
                );
                return throwError(() => error);
            }),
        );
    }

    /**
     * Checks if the HTTP method is safe to retry
     */
    private isSafeMethod(method: string): boolean {
        const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
        return safeMethods.includes(method.toUpperCase());
    }

    /**
     * Determines if an error should trigger a retry
     */
    private shouldRetry(error: unknown, retryCount: number): boolean {
        // Don't exceed max retries
        if (retryCount >= this.maxRetries) {
            return false;
        }

        const err = error as { code?: string; name?: string; message?: string };

        // Retry on network errors
        if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND') {
            return true;
        }

        // Retry on specific HTTP status codes
        if (error instanceof HttpException) {
            const retryableStatuses = [
                HttpStatus.REQUEST_TIMEOUT,
                HttpStatus.TOO_MANY_REQUESTS,
                HttpStatus.INTERNAL_SERVER_ERROR,
                HttpStatus.BAD_GATEWAY,
                HttpStatus.SERVICE_UNAVAILABLE,
                HttpStatus.GATEWAY_TIMEOUT,
            ];
            return retryableStatuses.includes(error.getStatus());
        }

        // Retry on timeout errors
        if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
            return true;
        }

        return false;
    }

    /**
     * Calculates exponential backoff delay with jitter
     */
    private calculateDelay(attempt: number): number {
        const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
        const totalDelay = exponentialDelay + jitter;

        return Math.min(totalDelay, this.maxDelay);
    }

    /**
     * Creates a retry interceptor with custom configuration
     */
    static create(options: {
        maxRetries?: number;
        baseDelay?: number;
        maxDelay?: number;
    }): RetryInterceptor {
        return new RetryInterceptor(
            options.maxRetries,
            options.baseDelay,
            options.maxDelay,
        );
    }
}
