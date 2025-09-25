import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './core/interceptors/timeout.interceptor';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';
import { ValidationPipe as CustomValidationPipe } from './core/pipes/validation.pipe';
import { AppLogger } from './common/utils/logger.util';

async function bootstrap(): Promise<void> {
    // Create NestJS application with custom logger
    const app = await NestFactory.create(AppModule, {
        logger: new AppLogger(),
    });

    // Global prefix for all routes
    app.setGlobalPrefix('api/v1');

    // Global pipes
    app.useGlobalPipes(
        new CustomValidationPipe(), // Custom validation pipe with enhanced error handling
        new ValidationPipe({
            whitelist: true, // Strip non-whitelisted properties
            forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
            transform: true, // Transform types automatically
            disableErrorMessages: process.env.NODE_ENV === 'production', // Hide detailed validation errors in production
        }),
    );

    // Global filters
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global interceptors
    app.useGlobalInterceptors(
        new LoggingInterceptor(), // Request/response logging
        new TimeoutInterceptor(30000), // 30-second timeout
        new TransformInterceptor(), // Response transformation
    );

    // Global guards (Rate limiting is handled by ThrottlerModule automatically)
    // app.useGlobalGuards(new ThrottlerGuard()); // Not needed when using ThrottlerModule

    // Enable shutdown hooks
    app.enableShutdownHooks();

    // CORS configuration (handled by CorsMiddleware in AppModule)
    // Security headers (handled by SecurityMiddleware in AppModule)
    // Request size limiting
    app.use((req: Request, res: Response, next: NextFunction) => {
        const maxSize = process.env.MAX_REQUEST_SIZE || '10mb';
        const contentLength = req.headers['content-length'];
        if (
            contentLength &&
            parseInt(contentLength) > parseInt(maxSize.replace(/\D/g, ''))
        ) {
            return res.status(413).json({
                success: false,
                statusCode: 413,
                message: 'Request entity too large',
                error: {
                    code: 'PAYLOAD_TOO_LARGE',
                    details: `Request size exceeds the maximum allowed size of ${maxSize}`,
                },
                timestamp: new Date().toISOString(),
                path: req.url,
            });
        }
        next();
    });

    // Start the application
    const port = process.env.PORT ?? 3000;
    await app.listen(port);

    // Log application startup
    const logger = new AppLogger('Bootstrap');
    logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
    logger.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
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
