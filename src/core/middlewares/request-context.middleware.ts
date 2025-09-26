import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
    SECURITY_HEADERS,
    SECURITY_HEADER_VALUES,
} from '../../common/constants';

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
        res.setHeader(
            SECURITY_HEADERS.X_CONTENT_TYPE_OPTIONS,
            SECURITY_HEADER_VALUES.NOSNIFF,
        );
        res.setHeader(
            SECURITY_HEADERS.X_FRAME_OPTIONS,
            SECURITY_HEADER_VALUES.DENY,
        );
        res.setHeader(
            SECURITY_HEADERS.X_XSS_PROTECTION,
            SECURITY_HEADER_VALUES.XSS_BLOCK,
        );

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
