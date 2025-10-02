/**
 * Authentication Service
 * Handles user authentication, JWT token generation, and session management
 */

import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { User } from '@prisma/client';
import { UserRepository } from '../database/repositories/user.repository';
import { UserSessionRepository } from '../database/repositories/user-session.repository';
import {
    JwtPayload,
    AuthTokens,
    LoginResponse,
    RefreshTokenPayload,
} from './interfaces/auth.interface';
import { RegisterDto, LoginDto } from './dto';
import { PasswordValidationService } from './services/password-validation.service';
import {
    hashPassword,
    comparePassword,
    getRefreshTokenExpiry,
} from '../common/utils/security.util';
import { AUTH_ERROR_MESSAGES } from '../common/constants/security.constants';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly userRepository: UserRepository,
        private readonly userSessionRepository: UserSessionRepository,
        private readonly passwordValidationService: PasswordValidationService,
    ) {}

    /**
     * Validate user credentials for local strategy
     */
    async validateUser(
        email: string,
        password: string,
    ): Promise<Omit<User, 'password'> | null> {
        return this.passwordValidationService.validateCredentials(
            email,
            password,
        );
    }

    /**
     * Register a new user
     */
    async register(registerDto: RegisterDto): Promise<LoginResponse> {
        // Check if user already exists
        const existingUserByEmail = await this.userRepository.findByEmail(
            registerDto.email,
        );
        if (existingUserByEmail) {
            throw new ConflictException(AUTH_ERROR_MESSAGES.EMAIL_EXISTS);
        }

        const existingUserByUsername = await this.userRepository.findByUsername(
            registerDto.username,
        );
        if (existingUserByUsername) {
            throw new ConflictException(AUTH_ERROR_MESSAGES.USERNAME_TAKEN);
        }

        // Hash password
        const hashedPassword = await hashPassword(registerDto.password);

        // Create user
        const user = await this.userRepository.create({
            email: registerDto.email,
            username: registerDto.username,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            password: hashedPassword,
        });

        // Generate tokens and create session
        const tokens = await this.generateTokens(user);
        const refreshTokenExpiry = getRefreshTokenExpiry();

        await this.userSessionRepository.createSession(
            user.id,
            tokens.refreshToken,
            refreshTokenExpiry,
        );

        // Update last login
        await this.userRepository.update(
            { id: user.id },
            { lastLoginAt: new Date() },
        );

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                emailVerified: user.emailVerified,
                lastLoginAt: new Date(),
            },
        };
    }

    /**
     * Login user and return tokens
     */
    async login(loginDto: LoginDto): Promise<LoginResponse> {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException(
                AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
            );
        }

        // Generate tokens and create session
        const tokens = await this.generateTokens(user);
        const refreshTokenExpiry = getRefreshTokenExpiry();

        await this.userSessionRepository.createSession(
            user.id,
            tokens.refreshToken,
            refreshTokenExpiry,
        );

        // Update last login
        await this.userRepository.update(
            { id: user.id },
            { lastLoginAt: new Date() },
        );

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                emailVerified: user.emailVerified,
                lastLoginAt: new Date(),
            },
        };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken: string): Promise<AuthTokens> {
        try {
            // Verify refresh token
            this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            // Find session and user
            const session =
                await this.userSessionRepository.findByRefreshTokenWithUser(
                    refreshToken,
                );

            if (!session || !session.user.isActive) {
                throw new UnauthorizedException(
                    AUTH_ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
                );
            }

            // Check if session is valid
            const isValid =
                await this.userSessionRepository.isSessionValid(refreshToken);
            if (!isValid) {
                throw new UnauthorizedException(
                    AUTH_ERROR_MESSAGES.REFRESH_TOKEN_EXPIRED,
                );
            }

            // Generate new tokens
            const tokens = await this.generateTokens(session.user);

            // Update session with new refresh token
            await this.userSessionRepository.revokeSession(refreshToken);
            const newRefreshTokenExpiry = getRefreshTokenExpiry();
            await this.userSessionRepository.createSession(
                session.user.id,
                tokens.refreshToken,
                newRefreshTokenExpiry,
            );

            return tokens;
        } catch {
            throw new UnauthorizedException(
                AUTH_ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
            );
        }
    }

    /**
     * Logout user by revoking refresh token
     */
    async logout(refreshToken: string): Promise<void> {
        try {
            await this.userSessionRepository.revokeSession(refreshToken);
        } catch {
            // Silent fail - token might already be revoked
        }
    }

    /**
     * Logout user from all devices
     */
    async logoutAllDevices(userId: string): Promise<void> {
        await this.userSessionRepository.revokeAllUserSessions(userId);
    }

    /**
     * Generate JWT access and refresh tokens
     */
    private async generateTokens(
        user: Pick<User, 'id' | 'email' | 'username' | 'role'>,
    ): Promise<AuthTokens> {
        const jwtPayload: JwtPayload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(jwtPayload, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.get<string>(
                    'JWT_ACCESS_EXPIRES_IN',
                    '15m',
                ),
            }),
            this.jwtService.signAsync(
                { sub: user.id },
                {
                    secret: this.configService.get<string>(
                        'JWT_REFRESH_SECRET',
                    ),
                    expiresIn: this.configService.get<string>(
                        'JWT_REFRESH_EXPIRES_IN',
                        '7d',
                    ),
                },
            ),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    /**
     * Change user password
     */
    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        const user = await this.userRepository.findUnique({ id: userId });
        if (!user) {
            throw new BadRequestException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
        }

        // Verify current password
        const isCurrentPasswordValid = await comparePassword(
            currentPassword,
            user.password,
        );
        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException(
                AUTH_ERROR_MESSAGES.INCORRECT_PASSWORD,
            );
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);

        // Update password and set password changed timestamp
        await this.userRepository.update(
            { id: userId },
            {
                password: hashedNewPassword,
                passwordChangedAt: new Date(),
            },
        );

        // Revoke all user sessions to force re-login
        await this.userSessionRepository.revokeAllUserSessions(userId);
    }

    /**
     * Get user profile
     */
    async getProfile(userId: string): Promise<Omit<User, 'password'>> {
        const user = await this.userRepository.findUnique({ id: userId });
        if (!user) {
            throw new BadRequestException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userProfile } = user;
        return userProfile;
    }
}
