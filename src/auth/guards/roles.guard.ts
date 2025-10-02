/**
 * Role-based Authorization Guard
 */

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles) {
            return true; // No roles required
        }

        const request = context.switchToHttp().getRequest<{
            user?: { role: UserRole };
        }>();
        const { user } = request;
        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied. Required roles: ${requiredRoles.join(', ')}`,
            );
        }

        return true;
    }
}
