/**
 * Prisma module for database integration
 * Provides PrismaService as a global module
 */

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [PrismaService],
    exports: [PrismaService],
})
export class PrismaModule {}
