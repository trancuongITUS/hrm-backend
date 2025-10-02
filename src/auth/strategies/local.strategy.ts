/**
 * Local Strategy for username/password authentication
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import type { User } from '@prisma/client';
import { PasswordValidationService } from '../services/password-validation.service';
import { AUTH_ERROR_MESSAGES } from '../../common/constants/security.constants';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly passwordValidationService: PasswordValidationService,
    ) {
        super({
            usernameField: 'email', // Use email instead of username
            passwordField: 'password',
        });
    }

    /**
     * Validate user credentials
     */
    async validate(
        email: string,
        password: string,
    ): Promise<Omit<User, 'password'>> {
        const user = await this.passwordValidationService.validateCredentials(
            email,
            password,
        );

        if (!user) {
            throw new UnauthorizedException(
                AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
            );
        }

        return user;
    }
}
