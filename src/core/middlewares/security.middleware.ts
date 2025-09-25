import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

/**
 * Security middleware that applies various security headers and protections
 * Uses Helmet.js for comprehensive security hardening
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
    private helmetHandler = helmet({
        // Content Security Policy
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },

        // Cross Origin Embedder Policy
        crossOriginEmbedderPolicy: false, // Disable if you need to embed resources

        // Cross Origin Opener Policy
        crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },

        // Cross Origin Resource Policy
        crossOriginResourcePolicy: { policy: 'cross-origin' },

        // DNS Prefetch Control
        dnsPrefetchControl: { allow: false },

        // Frame Options
        frameguard: { action: 'deny' },

        // Hide Powered By
        hidePoweredBy: true,

        // HTTP Strict Transport Security
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        },

        // IE No Open
        ieNoOpen: true,

        // No Sniff
        noSniff: true,

        // Origin Agent Cluster
        originAgentCluster: true,

        // Permitted Cross Domain Policies
        permittedCrossDomainPolicies: false,

        // Referrer Policy
        referrerPolicy: { policy: 'no-referrer' },

        // X-XSS-Protection
        xssFilter: true,
    });

    use(req: Request, res: Response, next: NextFunction): void {
        this.helmetHandler(req, res, next);
    }
}
