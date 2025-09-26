import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '../../config';
import { HTTP_METHOD } from '../../common/constants';

/**
 * CORS middleware that handles Cross-Origin Resource Sharing
 * Configurable for different environments and use cases
 */
@Injectable()
export class CorsMiddleware implements NestMiddleware {
    constructor(private readonly configService: ConfigService) {}

    use(req: Request, res: Response, next: NextFunction): void {
        const origin = req.headers.origin;
        const allowedOrigins = this.getAllowedOrigins();

        // Set CORS headers
        if (this.isOriginAllowed(origin, allowedOrigins)) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
        }

        res.setHeader(
            'Access-Control-Allow-Methods',
            'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        );

        res.setHeader(
            'Access-Control-Allow-Headers',
            [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
                'X-Request-ID',
                'X-API-Key',
            ].join(','),
        );

        res.setHeader('Access-Control-Allow-Credentials', 'true');

        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

        // Handle preflight requests
        if (req.method === HTTP_METHOD.OPTIONS) {
            res.status(204).send();
            return;
        }

        next();
    }

    /**
     * Gets allowed origins from configuration
     */
    private getAllowedOrigins(): string[] {
        return this.configService.security.allowedOrigins;
    }

    /**
     * Checks if the origin is allowed
     */
    private isOriginAllowed(
        origin: string | undefined,
        allowedOrigins: string[],
    ): boolean {
        if (!origin) return true; // Allow requests with no origin (mobile apps, etc.)

        // In development, allow all origins
        if (this.configService.app.isDevelopment) {
            return true;
        }

        return allowedOrigins.includes(origin);
    }
}
