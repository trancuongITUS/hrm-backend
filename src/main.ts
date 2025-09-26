import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { AppLogger } from './common/utils/logger.util';
import {
    DEFAULT,
    ENVIRONMENT,
    HTTP_STATUS,
    ERROR_CODE,
    REGEX_PATTERN,
} from './common/constants';

async function bootstrap(): Promise<void> {
    // Create NestJS application with custom logger
    const app = await NestFactory.create(AppModule, {
        logger: new AppLogger(),
    });

    // Global prefix for all routes
    app.setGlobalPrefix(DEFAULT.API_PREFIX);

    // Additional validation pipe (custom pipe is already registered in AppModule)
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Strip non-whitelisted properties
            forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
            transform: true, // Transform types automatically
            disableErrorMessages:
                process.env.NODE_ENV === ENVIRONMENT.PRODUCTION, // Hide detailed validation errors in production
        }),
    );

    // Global guards (Rate limiting is handled by ThrottlerModule automatically)
    // app.useGlobalGuards(new ThrottlerGuard()); // Not needed when using ThrottlerModule

    // Enable shutdown hooks
    app.enableShutdownHooks();

    // CORS configuration (handled by CorsMiddleware in AppModule)
    // Security headers (handled by SecurityMiddleware in AppModule)
    // Request size limiting
    app.use((req: Request, res: Response, next: NextFunction) => {
        const maxSize =
            process.env.MAX_REQUEST_SIZE || DEFAULT.MAX_REQUEST_SIZE;
        const contentLength = req.headers['content-length'];
        if (
            contentLength &&
            parseInt(contentLength) >
                parseInt(maxSize.replace(REGEX_PATTERN.NUMERIC_ONLY, ''))
        ) {
            return res.status(HTTP_STATUS.PAYLOAD_TOO_LARGE).json({
                success: false,
                statusCode: HTTP_STATUS.PAYLOAD_TOO_LARGE,
                message: 'Request entity too large',
                error: {
                    code: ERROR_CODE.PAYLOAD_TOO_LARGE,
                    details: `Request size exceeds the maximum allowed size of ${maxSize}`,
                },
                timestamp: new Date().toISOString(),
                path: req.url,
            });
        }
        next();
    });

    // Start the application
    const port = process.env.PORT ?? DEFAULT.PORT;
    await app.listen(port);

    // Log application startup
    const logger = new AppLogger('Bootstrap');
    logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
    logger.log(`📝 Environment: ${process.env.NODE_ENV || DEFAULT.NODE_ENV}`);
    logger.log(`🛡️  Security middlewares enabled`);
    logger.log(`📊 Logging and monitoring active`);
    logger.log(`✅ All middlewares configured successfully`);
}

bootstrap().catch((error: Error) => {
    const logger = new AppLogger('Bootstrap');
    logger.error(
        '❌ Failed to start the application',
        error.stack || 'No stack trace',
    );
    process.exit(1);
});
