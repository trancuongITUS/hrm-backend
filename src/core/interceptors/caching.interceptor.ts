import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { PERFORMANCE, HTTP_METHOD, VALIDATION } from '../../common/constants';
import { ConfigService } from '../../config';

interface CacheEntry {
    data: unknown;
    expiry: number;
}

/**
 * Caching interceptor that caches GET requests for improved performance
 * Uses in-memory cache with TTL support
 */
@Injectable()
export class CachingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(CachingInterceptor.name);
    private readonly cache = new Map<string, CacheEntry>();
    private readonly defaultTtl: number;

    constructor(private readonly configService: ConfigService) {
        this.defaultTtl = this.configService.performance.cacheTtl;
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const { method, url } = request;

        // Only cache GET requests
        if (method !== HTTP_METHOD.GET) {
            return next.handle();
        }

        // Check for cache-control headers
        const cacheControl = request.headers['cache-control'] as string;
        if (cacheControl && cacheControl.includes('no-cache')) {
            return next.handle();
        }

        const cacheKey = this.generateCacheKey(request);
        const cachedResponse = this.getCachedResponse(cacheKey);

        if (cachedResponse) {
            this.logger.debug(`Cache HIT for ${method} ${url}`);
            return of(cachedResponse);
        }

        this.logger.debug(`Cache MISS for ${method} ${url}`);

        return next.handle().pipe(
            tap((response) => {
                // Only cache successful responses
                if (response && !this.isErrorResponse(response)) {
                    const ttl =
                        this.getTtlFromHeaders(request) || this.defaultTtl;
                    this.setCachedResponse(cacheKey, response, ttl);
                    this.logger.debug(
                        `Cached response for ${method} ${url} with TTL ${ttl}ms`,
                    );
                }
            }),
        );
    }

    /**
     * Generates a unique cache key for the request
     */
    private generateCacheKey(request: Request): string {
        const { method, url, query } = request;
        const queryString = Object.keys(query)
            .sort()
            .map((key) => {
                const value = query[key];
                return `${key}=${typeof value === 'object' ? JSON.stringify(value) : String(value)}`;
            })
            .join('&');

        return `${method}:${url}${queryString ? `?${queryString}` : ''}`;
    }

    /**
     * Gets cached response if it exists and is not expired
     */
    private getCachedResponse(cacheKey: string): unknown {
        const cached = this.cache.get(cacheKey);

        if (!cached) {
            return null;
        }

        if (Date.now() > cached.expiry) {
            this.cache.delete(cacheKey);
            return null;
        }

        return cached.data;
    }

    /**
     * Sets cached response with expiry time
     */
    private setCachedResponse(
        cacheKey: string,
        data: unknown,
        ttl: number,
    ): void {
        const expiry = Date.now() + ttl;
        this.cache.set(cacheKey, { data, expiry });

        // Clean up expired entries periodically
        if (this.cache.size > PERFORMANCE.CACHE_CLEANUP_THRESHOLD) {
            this.cleanupExpiredEntries();
        }
    }

    /**
     * Gets TTL from request headers
     */
    private getTtlFromHeaders(request: Request): number | null {
        const cacheControl = request.headers['cache-control'] as string;
        if (!cacheControl) {
            return null;
        }

        const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
        if (maxAgeMatch) {
            return parseInt(maxAgeMatch[1], VALIDATION.DECIMAL_RADIX) * 1000; // Convert seconds to milliseconds
        }

        return null;
    }

    /**
     * Checks if response indicates an error
     */
    private isErrorResponse(response: unknown): boolean {
        return Boolean(
            response &&
                typeof response === 'object' &&
                response !== null &&
                'success' in response &&
                (response as { success: boolean }).success === false,
        );
    }

    /**
     * Cleans up expired cache entries
     */
    private cleanupExpiredEntries(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, value] of this.cache.entries()) {
            if (now > value.expiry) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.logger.debug(
                `Cleaned up ${cleanedCount} expired cache entries`,
            );
        }
    }

    /**
     * Clears all cached entries
     */
    clearCache(): void {
        this.cache.clear();
        this.logger.log('Cache cleared');
    }

    /**
     * Gets cache statistics
     */
    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}
