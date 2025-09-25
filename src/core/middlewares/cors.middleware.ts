import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * CORS middleware that handles Cross-Origin Resource Sharing
 * Configurable for different environments and use cases
 */
@Injectable()
export class CorsMiddleware implements NestMiddleware {
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
        if (req.method === 'OPTIONS') {
            res.status(204).send();
            return;
        }

        next();
    }

    /**
     * Gets allowed origins based on environment
     */
    private getAllowedOrigins(): string[] {
        const env = process.env.NODE_ENV || 'development';

        switch (env) {
            case 'production':
                return (process.env.ALLOWED_ORIGINS || '')
                    .split(',')
                    .filter(Boolean);
            case 'staging':
                return [
                    'https://staging.yourdomain.com',
                    'https://admin-staging.yourdomain.com',
                ];
            case 'development':
            default:
                return [
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'http://localhost:4200',
                    'http://127.0.0.1:3000',
                    'http://127.0.0.1:3001',
                    'http://127.0.0.1:4200',
                ];
        }
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
        if (process.env.NODE_ENV === 'development') {
            return true;
        }

        return allowedOrigins.includes(origin);
    }
}
