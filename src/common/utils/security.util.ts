/**
 * Security utility functions
 * Provides pure functions for password hashing, comparison, and data sanitization
 */

import * as bcrypt from 'bcrypt';
import { AUTH } from '../constants/security.constants';

/**
 * Hash a password using bcrypt
 * Uses configured salt rounds from constants
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, AUTH.BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(
    plainPassword: string,
    hashedPassword: string,
): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Strip password field from user object
 * Returns a new object without the password field
 */
export function stripPassword<T extends { password: string }>(
    user: T,
): Omit<T, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

/**
 * Calculate refresh token expiry date
 */
export function getRefreshTokenExpiry(): Date {
    return new Date(Date.now() + AUTH.REFRESH_TOKEN_EXPIRY_MS);
}
