/**
 * Database module exports
 * Centralized exports for database-related functionality
 */

// Core services and modules
export { PrismaService } from './prisma.service';
export { PrismaModule } from './prisma.module';

// Base repository
export { BaseRepository } from './base.repository';

// Repository implementations
export { UserRepository } from './repositories/user.repository';
export { UserSessionRepository } from './repositories/user-session.repository';

// Exception handling
export {
    PrismaException,
    PrismaUniqueConstraintException,
    PrismaRecordNotFoundException,
    PrismaForeignKeyConstraintException,
    PrismaValidationException,
    handlePrismaError,
} from './exceptions/prisma.exception';
