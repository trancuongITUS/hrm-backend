/**
 * Auth module barrel exports
 */

// Module
export { AuthModule } from './auth.module';

// Service
export { AuthService } from './auth.service';

// Controller
export { AuthController } from './auth.controller';

// DTOs
export * from './dto';

// Interfaces
export * from './interfaces/auth.interface';

// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { JwtRefreshGuard } from './guards/jwt-refresh.guard';
export { LocalAuthGuard } from './guards/local-auth.guard';
export { RolesGuard } from './guards/roles.guard';
export { GlobalJwtAuthGuard } from './guards/global-jwt-auth.guard';

// Decorators
export { Roles } from './decorators/roles.decorator';
export { CurrentUser } from './decorators/current-user.decorator';
export { Public } from './decorators/public.decorator';

// Strategies
export { JwtStrategy } from './strategies/jwt.strategy';
export { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
export { LocalStrategy } from './strategies/local.strategy';
