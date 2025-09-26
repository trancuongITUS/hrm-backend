/**
 * Configuration module
 * Configures and exports the NestJS ConfigModule with validation and typed services
 */

import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { validationSchema } from './env.validation';
import { ConfigService } from './config.service';

@Global()
@Module({
    imports: [
        NestConfigModule.forRoot({
            // Load configuration factory
            load: [configuration],

            // Environment file configuration
            envFilePath: [
                `.env.${process.env.NODE_ENV || 'development'}.local`,
                `.env.${process.env.NODE_ENV || 'development'}`,
                '.env.local',
                '.env',
            ],

            // Validation schema
            validationSchema,

            // Validation options
            validationOptions: {
                allowUnknown: true, // Allow unknown environment variables
                abortEarly: false, // Validate all variables, not just the first error
            },

            // Make configuration globally available
            isGlobal: true,

            // Cache configuration for performance
            cache: true,

            // Expand variables (e.g., ${PORT} in other env vars)
            expandVariables: true,
        }),
    ],
    providers: [ConfigService],
    exports: [ConfigService],
})
export class ConfigModule {}
