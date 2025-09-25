import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Type-safe request context middleware
 * No eslint-disable comments needed with proper type extensions
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        // Generate request ID if not already present
        if (!req.headers['x-request-id']) {
            req.headers['x-request-id'] = this.generateRequestId();
        }

        // Type-safe request extension
        (req as Request & { startTime: number; requestId: string }).startTime =
            Date.now();
        (req as Request & { startTime: number; requestId: string }).requestId =
            req.headers['x-request-id'] as string;

        // Add request ID to response headers for client tracking
        res.setHeader(
            'X-Request-ID',
            String(
                (req as Request & { requestId: string }).requestId || 'unknown',
            ),
        );

        // Add security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');

        next();
    }

    /**
     * Generates a unique request ID
     */
    private generateRequestId(): string {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 9);
        return `req_${timestamp}_${randomPart}`;
    }
}
