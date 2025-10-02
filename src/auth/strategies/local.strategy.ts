/**
 * Local Strategy for username/password authentication
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserRepository } from '../../database/repositories/user.repository';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly userRepository: UserRepository) {
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
        const user = await this.userRepository.findByEmail(email);

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
