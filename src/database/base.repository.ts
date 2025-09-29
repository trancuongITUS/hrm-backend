/**
 * Abstract base repository class for common database operations
 * Provides generic CRUD operations and common patterns
 */

import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

export abstract class BaseRepository<
    TModel,
    TCreateInput,
    TUpdateInput,
    TWhereInput,
    TWhereUniqueInput,
    TOrderByInput,
    TInclude = never,
    TSelect = never,
> {
    protected readonly logger: Logger;
    protected abstract readonly modelName: string;

    constructor(protected readonly prisma: PrismaService) {
        this.logger = new Logger(this.constructor.name);
    }

    /**
     * Get the Prisma model delegate
     */
    protected abstract getModel(): {
        create: (args: {
            data: TCreateInput;
            include?: TInclude;
            select?: TSelect;
        }) => Promise<TModel>;
        findUnique: (args: {
            where: TWhereUniqueInput;
            include?: TInclude;
            select?: TSelect;
        }) => Promise<TModel | null>;
        findFirst: (args: {
            where?: TWhereInput;
            include?: TInclude;
            select?: TSelect;
            orderBy?: TOrderByInput;
        }) => Promise<TModel | null>;
        findMany: (args: {
            where?: TWhereInput;
            include?: TInclude;
            select?: TSelect;
            orderBy?: TOrderByInput;
            skip?: number;
            take?: number;
            cursor?: TWhereUniqueInput;
        }) => Promise<TModel[]>;
        update: (args: {
            where: TWhereUniqueInput;
            data: TUpdateInput;
            include?: TInclude;
            select?: TSelect;
        }) => Promise<TModel>;
        updateMany: (args: {
            where: TWhereInput;
            data: TUpdateInput;
        }) => Promise<{ count: number }>;
        delete: (args: {
            where: TWhereUniqueInput;
            include?: TInclude;
            select?: TSelect;
        }) => Promise<TModel>;
        deleteMany: (args: {
            where: TWhereInput;
        }) => Promise<{ count: number }>;
        count: (args: { where?: TWhereInput }) => Promise<number>;
        upsert: (args: {
            where: TWhereUniqueInput;
            create: TCreateInput;
            update: TUpdateInput;
            include?: TInclude;
            select?: TSelect;
        }) => Promise<TModel>;
    };

    /**
     * Create a new record
     */
    async create(
        data: TCreateInput,
        options?: {
            include?: TInclude;
            select?: TSelect;
        },
    ): Promise<TModel> {
        try {
            this.logger.debug(`Creating ${this.modelName}`, { data });

            const result = await this.getModel().create({
                data,
                ...options,
            });

            this.logger.debug(`Created ${this.modelName}`, {
                id: (result as Record<string, unknown>).id,
            });
            return result;
        } catch (error) {
            this.logger.error(`Failed to create ${this.modelName}`, error);
            throw error;
        }
    }

    /**
     * Find a unique record
     */
    async findUnique(
        where: TWhereUniqueInput,
        options?: {
            include?: TInclude;
            select?: TSelect;
        },
    ): Promise<TModel | null> {
        try {
            this.logger.debug(`Finding unique ${this.modelName}`, { where });

            const result = await this.getModel().findUnique({
                where,
                ...options,
            });

            return result;
        } catch (error) {
            this.logger.error(`Failed to find unique ${this.modelName}`, error);
            throw error;
        }
    }

    /**
     * Find the first record matching criteria
     */
    async findFirst(
        where?: TWhereInput,
        options?: {
            include?: TInclude;
            select?: TSelect;
            orderBy?: TOrderByInput;
        },
    ): Promise<TModel | null> {
        try {
            this.logger.debug(`Finding first ${this.modelName}`, { where });

            const result = await this.getModel().findFirst({
                where,
                ...options,
            });

            return result;
        } catch (error) {
            this.logger.error(`Failed to find first ${this.modelName}`, error);
            throw error;
        }
    }

    /**
     * Find many records
     */
    async findMany(
        where?: TWhereInput,
        options?: {
            include?: TInclude;
            select?: TSelect;
            orderBy?: TOrderByInput;
            skip?: number;
            take?: number;
            cursor?: TWhereUniqueInput;
        },
    ): Promise<TModel[]> {
        try {
            this.logger.debug(`Finding many ${this.modelName}`, {
                where,
                options,
            });

            const result = await this.getModel().findMany({
                where,
                ...options,
            });

            this.logger.debug(
                `Found ${result.length} ${this.modelName} records`,
            );
            return result;
        } catch (error) {
            this.logger.error(`Failed to find many ${this.modelName}`, error);
            throw error;
        }
    }

    /**
     * Update a record
     */
    async update(
        where: TWhereUniqueInput,
        data: TUpdateInput,
        options?: {
            include?: TInclude;
            select?: TSelect;
        },
    ): Promise<TModel> {
        try {
            this.logger.debug(`Updating ${this.modelName}`, { where, data });

            const result = await this.getModel().update({
                where,
                data,
                ...options,
            });

            this.logger.debug(`Updated ${this.modelName}`, {
                id: (result as Record<string, unknown>).id,
            });
            return result;
        } catch (error) {
            this.logger.error(`Failed to update ${this.modelName}`, error);
            throw error;
        }
    }

    /**
     * Update many records
     */
    async updateMany(
        where: TWhereInput,
        data: TUpdateInput,
    ): Promise<{ count: number }> {
        try {
            this.logger.debug(`Updating many ${this.modelName}`, {
                where,
                data,
            });

            const result = await this.getModel().updateMany({
                where,
                data,
            });

            this.logger.debug(
                `Updated ${(result as { count: number }).count} ${this.modelName} records`,
            );
            return result;
        } catch (error) {
            this.logger.error(`Failed to update many ${this.modelName}`, error);
            throw error;
        }
    }

    /**
     * Delete a record
     */
    async delete(
        where: TWhereUniqueInput,
        options?: {
            include?: TInclude;
            select?: TSelect;
        },
    ): Promise<TModel> {
        try {
            this.logger.debug(`Deleting ${this.modelName}`, { where });

            const result = await this.getModel().delete({
                where,
                ...options,
            });

            this.logger.debug(`Deleted ${this.modelName}`, {
                id: (result as Record<string, unknown>).id,
            });
            return result;
        } catch (error) {
            this.logger.error(`Failed to delete ${this.modelName}`, error);
            throw error;
        }
    }

    /**
     * Delete many records
     */
    async deleteMany(where: TWhereInput): Promise<{ count: number }> {
        try {
            this.logger.debug(`Deleting many ${this.modelName}`, { where });

            const result = await this.getModel().deleteMany({
                where,
            });

            this.logger.debug(
                `Deleted ${(result as { count: number }).count} ${this.modelName} records`,
            );
            return result;
        } catch (error) {
            this.logger.error(`Failed to delete many ${this.modelName}`, error);
            throw error;
        }
    }

    /**
     * Count records
     */
    async count(where?: TWhereInput): Promise<number> {
        try {
            this.logger.debug(`Counting ${this.modelName}`, { where });

            const result = await this.getModel().count({
                where,
            });

            this.logger.debug(`Counted ${result} ${this.modelName} records`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to count ${this.modelName}`, error);
            throw error;
        }
    }

    /**
     * Check if record exists
     */
    async exists(where: TWhereInput): Promise<boolean> {
        try {
            const count = await this.count(where);
            return count > 0;
        } catch (error) {
            this.logger.error(
                `Failed to check if ${this.modelName} exists`,
                error,
            );
            throw error;
        }
    }

    /**
     * Upsert a record (create or update)
     */
    async upsert(
        where: TWhereUniqueInput,
        create: TCreateInput,
        update: TUpdateInput,
        options?: {
            include?: TInclude;
            select?: TSelect;
        },
    ): Promise<TModel> {
        try {
            this.logger.debug(`Upserting ${this.modelName}`, {
                where,
                create,
                update,
            });

            const result = await this.getModel().upsert({
                where,
                create,
                update,
                ...options,
            });

            this.logger.debug(`Upserted ${this.modelName}`, {
                id: (result as Record<string, unknown>).id,
            });
            return result;
        } catch (error) {
            this.logger.error(`Failed to upsert ${this.modelName}`, error);
            throw error;
        }
    }

    /**
     * Execute operations within a transaction
     */
    async transaction<T>(
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
        return this.prisma.executeTransaction(fn, options);
    }

    /**
     * Paginate results
     */
    async paginate(
        where?: TWhereInput,
        options?: {
            include?: TInclude;
            select?: TSelect;
            orderBy?: TOrderByInput;
            page?: number;
            limit?: number;
        },
    ): Promise<{
        data: TModel[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }> {
        const page = options?.page || 1;
        const limit = options?.limit || 10;
        const skip = (page - 1) * limit;

        try {
            const [data, total] = await Promise.all([
                this.findMany(where, {
                    ...options,
                    skip,
                    take: limit,
                }),
                this.count(where),
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            };
        } catch (error) {
            this.logger.error(`Failed to paginate ${this.modelName}`, error);
            throw error;
        }
    }
}
