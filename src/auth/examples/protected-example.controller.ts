/**
 * Example controller demonstrating authentication and authorization usage
 */

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { JwtPayload } from '../interfaces/auth.interface';
import { UserRole } from '@prisma/client';

@Controller('examples')
export class ProtectedExampleController {
    /**
     * Public endpoint - no authentication required
     */
    @Public()
    @Get('public')
    getPublicData(): { message: string } {
        return { message: 'This is a public endpoint' };
    }

    /**
     * Protected endpoint - authentication required
     * Uses global JWT guard automatically
     */
    @Get('protected')
    getProtectedData(@CurrentUser() user: JwtPayload): {
        message: string;
        user: JwtPayload;
    } {
        return {
            message: 'This is a protected endpoint',
            user,
        };
    }

    /**
     * Admin only endpoint - authentication and ADMIN role required
     */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('admin-only')
    getAdminData(@CurrentUser() user: JwtPayload): {
        message: string;
        user: JwtPayload;
    } {
        return {
            message: 'This is an admin-only endpoint',
            user,
        };
    }

    /**
     * User or Admin endpoint - authentication and USER or ADMIN role required
     */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.USER, UserRole.ADMIN)
    @Get('user-or-admin')
    getUserOrAdminData(@CurrentUser() user: JwtPayload): {
        message: string;
        user: JwtPayload;
    } {
        return {
            message: 'This endpoint is accessible by USER or ADMIN roles',
            user,
        };
    }
}
