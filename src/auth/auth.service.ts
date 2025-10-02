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
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../database/repositories/user.repository';
import { UserSessionRepository } from '../database/repositories/user-session.repository';
import {
    JwtPayload,
    AuthTokens,
    LoginResponse,
    RefreshTokenPayload,
} from './interfaces/auth.interface';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly userRepository: UserRepository,
        private readonly userSessionRepository: UserSessionRepository,
    ) {}

    /**
     * Validate user credentials for local strategy
     */
    async validateUser(
        email: string,
        password: string,
    ): Promise<Omit<User, 'password'> | null> {
        const user = await this.userRepository.findByEmail(email);

        if (!user || !user.isActive) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
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
            throw new ConflictException('User with this email already exists');
        }

        const existingUserByUsername = await this.userRepository.findByUsername(
            registerDto.username,
        );
        if (existingUserByUsername) {
            throw new ConflictException('Username is already taken');
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(
            registerDto.password,
            saltRounds,
        );

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
        const refreshTokenExpiry = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
        ); // 7 days

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
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate tokens and create session
        const tokens = await this.generateTokens(user);
        const refreshTokenExpiry = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
        ); // 7 days

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
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Check if session is valid
            const isValid =
                await this.userSessionRepository.isSessionValid(refreshToken);
            if (!isValid) {
                throw new UnauthorizedException(
                    'Refresh token expired or revoked',
                );
            }

            // Generate new tokens
            const tokens = await this.generateTokens(session.user);

            // Update session with new refresh token
            await this.userSessionRepository.revokeSession(refreshToken);
            const newRefreshTokenExpiry = new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
            );
            await this.userSessionRepository.createSession(
                session.user.id,
                tokens.refreshToken,
                newRefreshTokenExpiry,
            );

            return tokens;
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
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
            throw new BadRequestException('User not found');
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password,
        );
        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

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
            throw new BadRequestException('User not found');
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userProfile } = user;
        return userProfile;
    }
}
