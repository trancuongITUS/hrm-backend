/**
 * Authentication Controller
 * Handles authentication endpoints
 */

import {
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './interfaces/auth.interface';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * Register a new user
     */
    @Public()
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    /**
     * Login user
     */
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    /**
     * Refresh access token
     */
    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }

    /**
     * Logout user (revoke refresh token)
     */
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(@Body() refreshTokenDto: RefreshTokenDto) {
        await this.authService.logout(refreshTokenDto.refreshToken);
    }

    /**
     * Logout user from all devices
     */
    @UseGuards(JwtAuthGuard)
    @Post('logout-all')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logoutAll(@CurrentUser() user: JwtPayload) {
        await this.authService.logoutAllDevices(user.sub);
    }

    /**
     * Get current user profile
     */
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@CurrentUser() user: JwtPayload) {
        return this.authService.getProfile(user.sub);
    }

    /**
     * Change password
     */
    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    @HttpCode(HttpStatus.NO_CONTENT)
    async changePassword(
        @CurrentUser() user: JwtPayload,
        @Body()
        changePasswordDto: { currentPassword: string; newPassword: string },
    ) {
        await this.authService.changePassword(
            user.sub,
            changePasswordDto.currentPassword,
            changePasswordDto.newPassword,
        );
    }
}
