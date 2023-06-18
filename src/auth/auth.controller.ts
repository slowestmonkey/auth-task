import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { Customer } from 'src/customer/customer';
import { AuthPayload } from './auth';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { LocalAuthGuard } from './local/local.guard';
import { RefreshAuthGuard } from './refresh/refresh.guards';
import { ActiveGuard } from './active/active.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() request: Request & { user: Customer },
  ): Promise<AuthPayload> {
    return this.authService.login(request.user);
  }

  @UseGuards(RefreshAuthGuard, ActiveGuard)
  @Post('refresh')
  async refreshToken(
    @Request() request: Request & { user: Customer & { refreshToken: string } },
  ): Promise<AuthPayload> {
    return this.authService.refreshToken(request.user);
  }

  @UseGuards(JwtAuthGuard, ActiveGuard)
  @Post('logout')
  async logout(
    @Request() request: Request & { user: Customer },
  ): Promise<void> {
    await this.authService.logout(request.user);
  }
}
