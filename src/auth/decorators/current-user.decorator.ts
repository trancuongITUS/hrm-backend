/**
 * Current User decorator to extract user from request
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/auth.interface';

interface AuthenticatedRequest {
    user: JwtPayload;
}

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): JwtPayload => {
        const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        return request.user;
    },
);
