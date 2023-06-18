import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { Cache } from 'cache-manager';
import { Customer, CustomerId } from 'src/customer/customer';
import { CustomerService } from 'src/customer/customer.service';
import {
  AuthPayload,
  LoginParams,
  LogoutParams,
  RefreshTokenParams,
} from './auth';

@Injectable()
export class AuthService {
  constructor(
    private readonly customerService: CustomerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly keyValueStorage: Cache,
  ) {}

  async validateUser(email: string, password: string): Promise<Customer> {
    const customer = await this.customerService.find({ email });

    if (!customer) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await compare(password, customer.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    return customer;
  }

  async login(params: LoginParams): Promise<AuthPayload> {
    const tokens = this.generateTokens(params);

    await this.storeRefreshToken(params.id, tokens.refreshToken);

    return tokens;
  }

  async refreshToken(params: RefreshTokenParams): Promise<AuthPayload> {
    const { id, refreshToken } = params;
    const [storedRefreshToken, customer] = await Promise.all([
      this.keyValueStorage.get<string>(id),
      this.customerService.find({ id }),
    ]);

    if (!storedRefreshToken || !customer) {
      throw new UnauthorizedException();
    }

    const areTokensEqual = compare(refreshToken, storedRefreshToken);

    if (!areTokensEqual) {
      throw new UnauthorizedException();
    }

    const tokens = this.generateTokens(customer);

    await this.storeRefreshToken(params.id, tokens.refreshToken);

    return tokens;
  }

  private async storeRefreshToken(id: CustomerId, refreshToken: string) {
    const hashSalt = this.configService.get('hashSalt');
    const refreshTokenTTL = this.configService.get('jwt.refreshExpiresIn');
    const refreshTokenHash = await hash(refreshToken, hashSalt);

    await this.keyValueStorage.set(id, refreshTokenHash, refreshTokenTTL);
  }

  private generateTokens(
    params: Pick<Customer, 'id' | 'email' | 'role'>,
  ): AuthPayload {
    const payload = { email: params.email, sub: params.id, role: params.role };
    const { secret, expiresIn, refreshSecret, refreshExpiresIn } =
      this.configService.get('jwt');

    return {
      accessToken: this.jwtService.sign(payload, { secret, expiresIn }),
      refreshToken: this.jwtService.sign(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    };
  }

  async logout(params: LogoutParams): Promise<void> {
    await this.keyValueStorage.del(params.id);
  }
}
