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

interface RequestMetrics {
    count: number;
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    successCount: number;
    errorCount: number;
    statusCodes: Record<number, number>;
}

interface EndpointMetrics {
    [endpoint: string]: RequestMetrics;
}

/**
 * Performance metrics interceptor for monitoring API performance
 * Tracks request counts, response times, and error rates
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    private readonly logger = new Logger(MetricsInterceptor.name);
    private readonly metrics: EndpointMetrics = {};
    private readonly globalMetrics: RequestMetrics = {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Number.MAX_SAFE_INTEGER,
        maxDuration: 0,
        successCount: 0,
        errorCount: 0,
        statusCodes: {},
    };

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const startTime = Date.now();
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const endpoint = this.getEndpointKey(request);

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - startTime;
                this.recordMetrics(
                    endpoint,
                    duration,
                    response.statusCode,
                    false,
                );
            }),
            catchError((error) => {
                const duration = Date.now() - startTime;
                const statusCode = (error as { status?: number }).status || 500;
                this.recordMetrics(endpoint, duration, statusCode, true);
                throw error;
            }),
        );
    }

    /**
     * Records metrics for a request
     */
    private recordMetrics(
        endpoint: string,
        duration: number,
        statusCode: number,
        isError: boolean,
    ): void {
        // Update endpoint-specific metrics
        if (!this.metrics[endpoint]) {
            this.metrics[endpoint] = {
                count: 0,
                totalDuration: 0,
                averageDuration: 0,
                minDuration: Number.MAX_SAFE_INTEGER,
                maxDuration: 0,
                successCount: 0,
                errorCount: 0,
                statusCodes: {},
            };
        }

        const endpointMetrics = this.metrics[endpoint];
        this.updateMetrics(endpointMetrics, duration, statusCode, isError);

        // Update global metrics
        this.updateMetrics(this.globalMetrics, duration, statusCode, isError);

        // Log slow requests
        if (duration > 5000) {
            // 5 seconds
            this.logger.warn(
                `Slow request detected: ${endpoint} took ${duration}ms`,
            );
        }

        // Log metrics periodically
        if (this.globalMetrics.count % 100 === 0) {
            this.logPerformanceMetrics();
        }
    }

    /**
     * Updates metrics object with new request data
     */
    private updateMetrics(
        metrics: RequestMetrics,
        duration: number,
        statusCode: number,
        isError: boolean,
    ): void {
        metrics.count++;
        metrics.totalDuration += duration;
        metrics.averageDuration = metrics.totalDuration / metrics.count;
        metrics.minDuration = Math.min(metrics.minDuration, duration);
        metrics.maxDuration = Math.max(metrics.maxDuration, duration);

        if (isError) {
            metrics.errorCount++;
        } else {
            metrics.successCount++;
        }

        // Track status codes
        metrics.statusCodes[statusCode] =
            (metrics.statusCodes[statusCode] || 0) + 1;
    }

    /**
     * Generates endpoint key for metrics tracking
     */
    private getEndpointKey(request: Request): string {
        const { method } = request;
        const route = (request as Request & { route?: { path: string } }).route;
        const path = route?.path || request.url.split('?')[0];
        return `${method.toUpperCase()} ${path}`;
    }

    /**
     * Logs performance metrics summary
     */
    private logPerformanceMetrics(): void {
        const errorRate =
            (this.globalMetrics.errorCount / this.globalMetrics.count) * 100;

        this.logger.log('Performance Metrics Summary', {
            totalRequests: this.globalMetrics.count,
            averageResponseTime: `${this.globalMetrics.averageDuration.toFixed(2)}ms`,
            minResponseTime: `${this.globalMetrics.minDuration}ms`,
            maxResponseTime: `${this.globalMetrics.maxDuration}ms`,
            successRate: `${((this.globalMetrics.successCount / this.globalMetrics.count) * 100).toFixed(2)}%`,
            errorRate: `${errorRate.toFixed(2)}%`,
            topStatusCodes: this.getTopStatusCodes(
                this.globalMetrics.statusCodes,
            ),
        });
    }

    /**
     * Gets top status codes by frequency
     */
    private getTopStatusCodes(
        statusCodes: Record<number, number>,
    ): Record<number, number> {
        return Object.entries(statusCodes)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .reduce(
                (acc, [code, count]) => {
                    acc[parseInt(code, 10)] = count;
                    return acc;
                },
                {} as Record<number, number>,
            );
    }

    /**
     * Gets current metrics for all endpoints
     */
    getMetrics(): { global: RequestMetrics; endpoints: EndpointMetrics } {
        return {
            global: { ...this.globalMetrics },
            endpoints: { ...this.metrics },
        };
    }

    /**
     * Gets metrics for a specific endpoint
     */
    getEndpointMetrics(endpoint: string): RequestMetrics | null {
        return this.metrics[endpoint] ? { ...this.metrics[endpoint] } : null;
    }

    /**
     * Resets all metrics
     */
    resetMetrics(): void {
        Object.keys(this.metrics).forEach((key) => delete this.metrics[key]);

        this.globalMetrics.count = 0;
        this.globalMetrics.totalDuration = 0;
        this.globalMetrics.averageDuration = 0;
        this.globalMetrics.minDuration = Number.MAX_SAFE_INTEGER;
        this.globalMetrics.maxDuration = 0;
        this.globalMetrics.successCount = 0;
        this.globalMetrics.errorCount = 0;
        this.globalMetrics.statusCodes = {};

        this.logger.log('Metrics reset');
    }

    /**
     * Gets health check based on metrics
     */
    getHealthStatus(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        metrics: {
            errorRate: number;
            averageResponseTime: number;
            totalRequests: number;
        };
    } {
        const errorRate =
            (this.globalMetrics.errorCount / this.globalMetrics.count) * 100;
        const avgResponseTime = this.globalMetrics.averageDuration;

        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

        if (errorRate > 10 || avgResponseTime > 5000) {
            status = 'unhealthy';
        } else if (errorRate > 5 || avgResponseTime > 2000) {
            status = 'degraded';
        }

        return {
            status,
            metrics: {
                errorRate,
                averageResponseTime: avgResponseTime,
                totalRequests: this.globalMetrics.count,
            },
        };
    }
}
