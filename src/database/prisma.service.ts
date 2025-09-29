/**
 * Prisma service for database operations
 * Extends PrismaClient with NestJS lifecycle hooks and configuration
 */

import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { DatabaseConfig } from '../config/configuration';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(PrismaService.name);

    constructor(private readonly configService: ConfigService) {
        const databaseConfig = configService.get<DatabaseConfig>('database')!;

        super({
            datasources: {
                db: {
                    url: databaseConfig.url,
                },
            },
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'info' },
                { emit: 'event', level: 'warn' },
            ],
            errorFormat: 'colorless',
        });

        // Set up logging event handlers
        this.setupLogging();
    }

    /**
     * Initialize Prisma connection on module initialization
     */
    async onModuleInit(): Promise<void> {
        try {
            await this.$connect();
            this.logger.log('Successfully connected to database');
        } catch (error) {
            this.logger.error('Failed to connect to database', error);
            throw error;
        }
    }

    /**
     * Disconnect Prisma on module destruction
     */
    async onModuleDestroy(): Promise<void> {
        try {
            await this.$disconnect();
            this.logger.log('Disconnected from database');
        } catch (error) {
            this.logger.error('Error disconnecting from database', error);
        }
    }

    /**
     * Set up Prisma logging event handlers
     */
    private setupLogging(): void {
        // Type assertion needed due to Prisma client type limitations
        const prismaWithEvents = this as unknown as {
            $on: (
                event: string,
                callback: (data: Record<string, unknown>) => void,
            ) => void;
        };

        prismaWithEvents.$on('query', (event: Record<string, unknown>) => {
            this.logger.debug(`Query: ${String(event.query)}`);
            this.logger.debug(`Params: ${String(event.params)}`);
            this.logger.debug(`Duration: ${String(event.duration)}ms`);
        });

        prismaWithEvents.$on('error', (event: Record<string, unknown>) => {
            this.logger.error(
                `Database error: ${String(event.message)}`,
                String(event.target),
            );
        });

        prismaWithEvents.$on('info', (event: Record<string, unknown>) => {
            this.logger.log(`Database info: ${String(event.message)}`);
        });

        prismaWithEvents.$on('warn', (event: Record<string, unknown>) => {
            this.logger.warn(`Database warning: ${String(event.message)}`);
        });
    }

    /**
     * Execute a transaction with retry logic
     */
    async executeTransaction<T>(
        fn: (prisma: Prisma.TransactionClient) => Promise<T>,
        options?: {
            maxWait?: number;
            timeout?: number;
            isolationLevel?:
                | 'ReadUncommitted'
                | 'ReadCommitted'
                | 'RepeatableRead'
                | 'Serializable';
        },
    ): Promise<T> {
        const defaultOptions = {
            maxWait: 5000,
            timeout: 10000,
            ...options,
        };

        try {
            return await this.$transaction(fn, defaultOptions);
        } catch (error) {
            this.logger.error('Transaction failed', error);
            throw error;
        }
    }

    /**
     * Health check for database connection
     */
    async healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        message: string;
    }> {
        try {
            await this.$queryRaw`SELECT 1`;
            return {
                status: 'healthy',
                message: 'Database connection is healthy',
            };
        } catch (error) {
            this.logger.error('Database health check failed', error);
            return {
                status: 'unhealthy',
                message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Get database statistics
     */
    async getDatabaseStats(): Promise<{
        totalConnections: number;
        activeConnections: number;
        version: string;
    }> {
        try {
            const [connectionInfo, versionInfo] = await Promise.all([
                this
                    .$queryRaw`SELECT count(*) as total FROM pg_stat_activity WHERE datname = current_database()`,
                this.$queryRaw`SELECT version()`,
            ]);

            const connectionData = connectionInfo as Array<{ total: bigint }>;
            const versionData = versionInfo as Array<{ version: string }>;

            return {
                totalConnections: Number(connectionData[0]?.total || 0),
                activeConnections: Number(connectionData[0]?.total || 0),
                version: versionData[0]?.version || 'Unknown',
            };
        } catch (error) {
            this.logger.error('Failed to get database stats', error);
            throw error;
        }
    }
}
