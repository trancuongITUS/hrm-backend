/**
 * User repository implementation
 * Demonstrates usage of BaseRepository with User model
 */

import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { BaseRepository } from '../base.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UserRepository extends BaseRepository<
    User,
    Prisma.UserCreateInput,
    Prisma.UserUpdateInput,
    Prisma.UserWhereInput,
    Prisma.UserWhereUniqueInput,
    Prisma.UserOrderByWithRelationInput,
    Prisma.UserInclude,
    Prisma.UserSelect
> {
    protected readonly modelName = 'User';

    constructor(prisma: PrismaService) {
        super(prisma);
    }

    /**
     * Get the Prisma User model delegate
     */
    protected getModel() {
        return this.prisma.user;
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.findUnique({ email });
    }

    /**
     * Find user by username
     */
    async findByUsername(username: string): Promise<User | null> {
        return this.findUnique({ username });
    }

    /**
     * Find user with sessions
     */
    async findWithSessions(id: string): Promise<User | null> {
        return this.findUnique(
            { id },
            {
                include: {
                    sessions: {
                        where: {
                            revokedAt: null,
                            expiresAt: {
                                gt: new Date(),
                            },
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                    },
                },
            },
        );
    }

    /**
     * Find active users
     */
    async findActiveUsers(): Promise<User[]> {
        return this.findMany({ isActive: true });
    }

    /**
     * Search users by name or email
     */
    async searchUsers(query: string): Promise<User[]> {
        return this.findMany({
            OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { username: { contains: query, mode: 'insensitive' } },
            ],
            isActive: true,
        });
    }

    /**
     * Update user password
     */
    async updatePassword(id: string, hashedPassword: string): Promise<User> {
        return this.update({ id }, { password: hashedPassword });
    }

    /**
     * Deactivate user
     */
    async deactivateUser(id: string): Promise<User> {
        return this.update({ id }, { isActive: false });
    }

    /**
     * Find users by role
     */
    async findByRole(role: 'ADMIN' | 'USER'): Promise<User[]> {
        return this.findMany({ role });
    }

    /**
     * Get users with pagination and search
     */
    async getUsersWithPagination(
        page: number = 1,
        limit: number = 10,
        search?: string,
        isActive?: boolean,
        role?: 'ADMIN' | 'USER',
    ) {
        const where: Prisma.UserWhereInput = {
            ...(isActive !== undefined && { isActive }),
            ...(role && { role }),
            ...(search && {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        return this.paginate(where, {
            page,
            limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                isActive: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    /**
     * Update user role
     */
    async updateRole(id: string, role: 'ADMIN' | 'USER'): Promise<User> {
        return this.update({ id }, { role });
    }
}
