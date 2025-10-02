/**
 * Password Validation Service
 * Handles password validation and user credential verification
 * Provides centralized authentication logic used by both AuthService and LocalStrategy
 */

import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { UserRepository } from '../../database/repositories/user.repository';
import {
    comparePassword,
    stripPassword,
} from '../../common/utils/security.util';

@Injectable()
export class PasswordValidationService {
    constructor(private readonly userRepository: UserRepository) {}

    /**
     * Validate user credentials by email and password
     * Returns user without password if validation succeeds, null otherwise
     */
    async validateCredentials(
        email: string,
        password: string,
    ): Promise<Omit<User, 'password'> | null> {
        const user = await this.userRepository.findByEmail(email);

        if (!user || !user.isActive) {
            return null;
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        return stripPassword(user);
    }
}
