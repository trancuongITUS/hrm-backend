import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    ServiceUnavailableException,
    Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
    CIRCUIT_BREAKER,
    HTTP_STATUS,
    ERROR_CODE,
    NETWORK_ERROR,
    TIMEOUT_ERROR,
} from '../../common/constants';

enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
    halfOpenMaxCalls: number;
}

interface CircuitMetrics {
    failures: number;
    successes: number;
    totalCalls: number;
    lastFailureTime: number;
    consecutiveFailures: number;
    halfOpenCalls: number;
}

/**
 * Circuit Breaker interceptor that implements the circuit breaker pattern
 * Prevents cascading failures by temporarily blocking requests to failing services
 */
@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
    private readonly logger = new Logger(CircuitBreakerInterceptor.name);
    private state: CircuitState = CircuitState.CLOSED;
    private readonly config: CircuitBreakerConfig;
    private readonly metrics: CircuitMetrics = {
        failures: 0,
        successes: 0,
        totalCalls: 0,
        lastFailureTime: 0,
        consecutiveFailures: 0,
        halfOpenCalls: 0,
    };

    constructor(config?: Partial<CircuitBreakerConfig>) {
        this.config = {
            failureThreshold: CIRCUIT_BREAKER.FAILURE_THRESHOLD,
            recoveryTimeout: CIRCUIT_BREAKER.RECOVERY_TIME,
            monitoringPeriod: CIRCUIT_BREAKER.MONITORING_WINDOW,
            halfOpenMaxCalls: CIRCUIT_BREAKER.MAX_CALLS,
            ...config,
        };
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context
            .switchToHttp()
            .getRequest<{ method: string; url: string }>();
        const endpoint = `${request.method} ${request.url}`;

        // Check circuit state before proceeding
        if (this.shouldBlockRequest()) {
            this.logger.warn(
                `Circuit breaker OPEN - blocking request to ${endpoint}`,
            );
            throw new ServiceUnavailableException({
                message:
                    'Service temporarily unavailable due to circuit breaker',
                error: ERROR_CODE.CIRCUIT_BREAKER_OPEN,
                state: this.state,
                retryAfter: this.getRetryAfter(),
            });
        }

        // Track call in half-open state
        if (this.state === CircuitState.HALF_OPEN) {
            this.metrics.halfOpenCalls++;
        }

        this.metrics.totalCalls++;

        return next.handle().pipe(
            tap(() => {
                this.onSuccess(endpoint);
            }),
            catchError((error) => {
                this.onFailure(error, endpoint);
                return throwError(() => error);
            }),
        );
    }

    /**
     * Determines if request should be blocked based on circuit state
     */
    private shouldBlockRequest(): boolean {
        const now = Date.now();

        switch (this.state) {
            case CircuitState.CLOSED:
                return false;

            case CircuitState.OPEN:
                // Check if enough time has passed to attempt recovery
                if (
                    now - this.metrics.lastFailureTime >=
                    this.config.recoveryTimeout
                ) {
                    this.transitionToHalfOpen();
                    return false;
                }
                return true;

            case CircuitState.HALF_OPEN:
                // Allow limited number of calls to test service recovery
                return (
                    this.metrics.halfOpenCalls >= this.config.halfOpenMaxCalls
                );

            default:
                return false;
        }
    }

    /**
     * Handles successful request
     */
    private onSuccess(endpoint: string): void {
        this.metrics.successes++;
        this.metrics.consecutiveFailures = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            // If we've had enough successful calls in half-open state, close the circuit
            if (this.metrics.halfOpenCalls >= this.config.halfOpenMaxCalls) {
                this.transitionToClosed();
                this.logger.log(
                    `Circuit breaker CLOSED - service recovered for ${endpoint}`,
                );
            }
        }
    }

    /**
     * Handles failed request
     */
    private onFailure(error: any, endpoint: string): void {
        this.metrics.failures++;
        this.metrics.consecutiveFailures++;
        this.metrics.lastFailureTime = Date.now();

        // Only count certain types of errors as circuit breaker failures
        if (!this.isCircuitBreakerError(error)) {
            return;
        }

        if (this.state === CircuitState.HALF_OPEN) {
            // Any failure in half-open state should open the circuit
            this.transitionToOpen();
            this.logger.warn(
                `Circuit breaker OPEN - service still failing for ${endpoint}`,
            );
        } else if (this.state === CircuitState.CLOSED) {
            // Check if we've exceeded failure threshold
            if (
                this.metrics.consecutiveFailures >= this.config.failureThreshold
            ) {
                this.transitionToOpen();
                this.logger.warn(
                    `Circuit breaker OPEN - failure threshold exceeded for ${endpoint}`,
                    {
                        consecutiveFailures: this.metrics.consecutiveFailures,
                        threshold: this.config.failureThreshold,
                    },
                );
            }
        }
    }

    /**
     * Determines if error should trigger circuit breaker
     */
    private isCircuitBreakerError(error: unknown): boolean {
        const err = error as { status?: number; name?: string; code?: string };

        // Don't trigger circuit breaker for client errors (4xx)
        if (
            err.status &&
            err.status >= HTTP_STATUS.BAD_REQUEST &&
            err.status < HTTP_STATUS.INTERNAL_SERVER_ERROR
        ) {
            return false;
        }

        // Trigger for server errors, timeouts, and network errors
        return (
            (err.status && err.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) ||
            err.name === TIMEOUT_ERROR.TIMEOUT_ERROR ||
            err.code === NETWORK_ERROR.ECONNRESET ||
            err.code === NETWORK_ERROR.ENOTFOUND ||
            err.code === NETWORK_ERROR.ECONNREFUSED
        );
    }

    /**
     * Transitions circuit to CLOSED state
     */
    private transitionToClosed(): void {
        this.state = CircuitState.CLOSED;
        this.metrics.consecutiveFailures = 0;
        this.metrics.halfOpenCalls = 0;
    }

    /**
     * Transitions circuit to OPEN state
     */
    private transitionToOpen(): void {
        this.state = CircuitState.OPEN;
        this.metrics.halfOpenCalls = 0;
    }

    /**
     * Transitions circuit to HALF_OPEN state
     */
    private transitionToHalfOpen(): void {
        this.state = CircuitState.HALF_OPEN;
        this.metrics.halfOpenCalls = 0;
        this.logger.log(
            'Circuit breaker HALF_OPEN - attempting service recovery',
        );
    }

    /**
     * Gets retry after time in seconds
     */
    private getRetryAfter(): number {
        const timeSinceLastFailure = Date.now() - this.metrics.lastFailureTime;
        const remainingTime =
            this.config.recoveryTimeout - timeSinceLastFailure;
        return Math.max(0, Math.ceil(remainingTime / 1000));
    }

    /**
     * Gets current circuit breaker status
     */
    getStatus(): {
        state: CircuitState;
        metrics: CircuitMetrics;
        config: CircuitBreakerConfig;
    } {
        return {
            state: this.state,
            metrics: { ...this.metrics },
            config: { ...this.config },
        };
    }

    /**
     * Resets circuit breaker to initial state
     */
    reset(): void {
        this.state = CircuitState.CLOSED;
        this.metrics.failures = 0;
        this.metrics.successes = 0;
        this.metrics.totalCalls = 0;
        this.metrics.lastFailureTime = 0;
        this.metrics.consecutiveFailures = 0;
        this.metrics.halfOpenCalls = 0;

        this.logger.log('Circuit breaker reset to initial state');
    }

    /**
     * Forces circuit breaker to open state
     */
    forceOpen(): void {
        this.transitionToOpen();
        this.logger.warn('Circuit breaker forced to OPEN state');
    }

    /**
     * Forces circuit breaker to closed state
     */
    forceClosed(): void {
        this.transitionToClosed();
        this.logger.log('Circuit breaker forced to CLOSED state');
    }
}
