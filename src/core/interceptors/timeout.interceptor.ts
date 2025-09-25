import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/**
 * Timeout interceptor that prevents requests from running indefinitely
 * Configurable timeout duration with proper error handling
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
    constructor(private readonly timeoutMs: number = 30000) {} // Default 30 seconds

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            timeout(this.timeoutMs),
            catchError((error) => {
                if (error instanceof TimeoutError) {
                    return throwError(
                        () =>
                            new RequestTimeoutException({
                                message: `Request timed out after ${this.timeoutMs}ms`,
                                error: 'REQUEST_TIMEOUT',
                                details: `The request exceeded the maximum allowed time of ${this.timeoutMs}ms`,
                            }),
                    );
                }
                return throwError(() => error as Error);
            }),
        );
    }
}
