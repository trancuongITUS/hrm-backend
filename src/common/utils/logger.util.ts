import { Logger } from '@nestjs/common';

/**
 * Enhanced logger utility with structured logging capabilities
 * Provides consistent logging format across the application
 */
export class AppLogger extends Logger {
    /**
     * Logs structured data with context
     */
    logWithContext(
        level: 'log' | 'error' | 'warn' | 'debug' | 'verbose',
        message: string,
        context?: string,
        data?: Record<string, any>,
    ): void {
        const formattedMessage = `${message} ${data ? JSON.stringify(data) : ''}`;

        switch (level) {
            case 'error':
                super.error(formattedMessage, context);
                break;
            case 'warn':
                super.warn(formattedMessage, context);
                break;
            case 'debug':
                super.debug(formattedMessage, context);
                break;
            case 'verbose':
                super.verbose(formattedMessage, context);
                break;
            default:
                super.log(formattedMessage, context);
        }
    }

    /**
     * Logs HTTP requests with structured format
     */
    logHttpRequest(
        method: string,
        url: string,
        statusCode: number,
        duration: number,
        context?: Record<string, any>,
    ): void {
        this.logWithContext(
            'log',
            `${method} ${url} - ${statusCode} [${duration}ms]`,
            'HTTP',
            {
                method,
                url,
                statusCode,
                duration,
                ...context,
            },
        );
    }

    /**
     * Logs errors with stack trace and context
     */
    logError(
        error: Error,
        context?: string,
        additionalData?: Record<string, any>,
    ): void {
        this.logWithContext('error', error.message, context, {
            stack: error.stack,
            name: error.name,
            ...additionalData,
        });
    }
}
