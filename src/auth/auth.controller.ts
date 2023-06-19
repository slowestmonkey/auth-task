import { Controller, Post, UseGuards } from '@nestjs/common';
import { ActiveCustomerGuard } from './active/active.guard';
import { AuthPayload, AuthUser, AuthUserWithRefreshToken } from './auth';
import { AuthService } from './auth.service';
import { CurrentUser } from './jwt/current-user.decorator';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { LocalAuthGuard } from './local/local.guard';
import { RefreshAuthGuard } from './refresh/refresh.guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@CurrentUser() user: AuthUser): Promise<AuthPayload> {
    return this.authService.login(user);
  }

  @UseGuards(RefreshAuthGuard, ActiveCustomerGuard)
  @Post('refresh')
  async refreshToken(
    @CurrentUser() user: AuthUserWithRefreshToken,
  ): Promise<AuthPayload> {
    return this.authService.refreshToken(user);
  }

  @UseGuards(JwtAuthGuard, ActiveCustomerGuard)
  @Post('logout')
  async logout(@CurrentUser() user: AuthUser): Promise<void> {
    await this.authService.logout(user);
  }
}
