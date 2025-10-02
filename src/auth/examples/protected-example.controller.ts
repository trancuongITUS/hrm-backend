/**
 * Example controller demonstrating authentication and authorization usage
 */

import { Controller, Get, UseGuards } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { JwtPayload } from '../interfaces/auth.interface';
import { UserRole } from '@prisma/client';

@ApiTags('examples')
@Controller('examples')
export class ProtectedExampleController {
    /**
     * Public endpoint - no authentication required
     */
    @ApiOperation({
        summary: 'Public endpoint example',
        description:
            'Example of a public endpoint that requires no authentication',
    })
    @ApiResponse({
        status: 200,
        description: 'Public data retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'This is a public endpoint',
                },
            },
        },
    })
    @Public()
    @Get('public')
    getPublicData(): { message: string } {
        return { message: 'This is a public endpoint' };
    }

    /**
     * Protected endpoint - authentication required
     * Uses global JWT guard automatically
     */
    @ApiOperation({
        summary: 'Protected endpoint example',
        description:
            'Example of a protected endpoint that requires authentication',
    })
    @ApiResponse({
        status: 200,
        description: 'Protected data retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'This is a protected endpoint',
                },
                user: {
                    type: 'object',
                    properties: {
                        sub: { type: 'string', example: 'cuid123' },
                        email: { type: 'string', example: 'user@example.com' },
                        username: { type: 'string', example: 'johndoe123' },
                        role: { type: 'string', example: 'USER' },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - authentication required',
    })
    @ApiBearerAuth('JWT-auth')
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
    @ApiOperation({
        summary: 'Admin-only endpoint example',
        description: 'Example of an endpoint that requires ADMIN role',
    })
    @ApiResponse({
        status: 200,
        description: 'Admin data retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'This is an admin-only endpoint',
                },
                user: {
                    type: 'object',
                    properties: {
                        sub: { type: 'string', example: 'cuid123' },
                        email: { type: 'string', example: 'admin@example.com' },
                        username: { type: 'string', example: 'admin' },
                        role: { type: 'string', example: 'ADMIN' },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - authentication required',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - ADMIN role required',
    })
    @ApiBearerAuth('JWT-auth')
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
    @ApiOperation({
        summary: 'User or Admin endpoint example',
        description: 'Example of an endpoint that requires USER or ADMIN role',
    })
    @ApiResponse({
        status: 200,
        description: 'User or admin data retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example:
                        'This endpoint is accessible by USER or ADMIN roles',
                },
                user: {
                    type: 'object',
                    properties: {
                        sub: { type: 'string', example: 'cuid123' },
                        email: { type: 'string', example: 'user@example.com' },
                        username: { type: 'string', example: 'johndoe123' },
                        role: { type: 'string', example: 'USER' },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - authentication required',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - USER or ADMIN role required',
    })
    @ApiBearerAuth('JWT-auth')
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
