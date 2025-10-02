/**
 * Authentication interfaces and types
 */

import type { UserRole } from '@prisma/client';

export interface JwtPayload {
    sub: string; // User ID
    email: string;
    username: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
    user: {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        emailVerified: boolean;
        lastLoginAt: Date | null;
    };
}

export interface RefreshTokenPayload {
    sub: string; // User ID
    tokenId: string; // Session ID
    iat?: number;
    exp?: number;
}

export interface RequestWithUser extends Request {
    user: JwtPayload;
}
