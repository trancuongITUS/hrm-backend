import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

// Type definition for compression handler to improve type safety
type CompressionHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
) => void;

/**
 * Compression middleware that compresses response bodies
 * Improves performance by reducing response sizes
 */
@Injectable()
export class CompressionMiddleware implements NestMiddleware {
    // External library integration - types handled by relaxed ESLint config
    private compressionHandler: CompressionHandler = compression({
        // Only compress responses larger than 1KB
        threshold: 1024,

        // Compression level (1-9, where 9 is best compression but slowest)
        level: 6,

        // Only compress these MIME types
        filter: (req: Request, res: Response) => {
            // Don't compress if the request includes a Cache-Control no-transform directive
            if (
                req.headers['cache-control'] &&
                req.headers['cache-control'].includes('no-transform')
            ) {
                return false;
            }

            // Use the default filter function
            return compression.filter(req, res);
        },

        // Memory level (1-9, where 9 uses most memory but is fastest)
        memLevel: 8,

        // Window size (8-15, larger values use more memory but provide better compression)
        windowBits: 15,
    });

    use(req: Request, res: Response, next: NextFunction): void {
        this.compressionHandler(req, res, next);
    }
}
