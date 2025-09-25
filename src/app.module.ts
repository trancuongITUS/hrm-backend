import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_PIPE, APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SecurityMiddleware } from './core/middlewares/security.middleware';
import { CorsMiddleware } from './core/middlewares/cors.middleware';
import { CompressionMiddleware } from './core/middlewares/compression.middleware';
import { RequestContextMiddleware } from './core/middlewares/request-context.middleware';
import { ValidationPipe } from './core/pipes/validation.pipe';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import {
    LoggingInterceptor,
    TransformInterceptor,
    TimeoutInterceptor,
    CachingInterceptor,
    MetricsInterceptor,
    ValidationInterceptor,
} from './core/interceptors';

@Module({
    imports: [
        // Rate limiting configuration
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 60000, // 1 minute
                limit: 10, // 10 requests per minute
            },
            {
                name: 'medium',
                ttl: 300000, // 5 minutes
                limit: 50, // 50 requests per 5 minutes
            },
            {
                name: 'long',
                ttl: 900000, // 15 minutes
                limit: 100, // 100 requests per 15 minutes
            },
        ]),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        // Global pipes
        {
            provide: APP_PIPE,
            useClass: ValidationPipe,
        },
        // Global filters
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
        // Global interceptors (order matters - they execute in reverse order)
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ValidationInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: CachingInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: MetricsInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TimeoutInterceptor,
        },
        // Global guards
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        // Middleware providers
        SecurityMiddleware,
        CorsMiddleware,
        CompressionMiddleware,
        RequestContextMiddleware,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(
                SecurityMiddleware, // Security headers (Helmet)
                CorsMiddleware, // CORS handling
                RequestContextMiddleware, // Request context and ID generation
                CompressionMiddleware, // Response compression
            )
            .forRoutes('*'); // Apply to all routes
    }
}
