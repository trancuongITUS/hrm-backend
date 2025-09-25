import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate limiting middleware using NestJS Throttler
 * Extends the default ThrottlerGuard with custom configuration
 */
@Injectable()
export class RateLimitMiddleware extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
        // Use IP address as the default tracker
        const ip = req.ip;
        const remoteAddress = req.connection?.remoteAddress;

        return Promise.resolve(ip || remoteAddress || 'unknown');
    }
}
