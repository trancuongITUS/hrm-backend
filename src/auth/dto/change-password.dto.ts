/**
 * Change Password Data Transfer Object
 */

import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({
        description: 'Current password of the user',
        example: 'OldSecurePass123!',
        format: 'password',
    })
    @IsString({ message: 'Current password must be a string' })
    @IsNotEmpty({ message: 'Current password is required' })
    currentPassword: string;

    @ApiProperty({
        description:
            'New password. Must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        example: 'NewSecurePass123!',
        minLength: 8,
        format: 'password',
    })
    @IsString({ message: 'New password must be a string' })
    @IsNotEmpty({ message: 'New password is required' })
    @MinLength(8, {
        message: 'New password must be at least 8 characters long',
    })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
            message:
                'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        },
    )
    newPassword: string;
}

