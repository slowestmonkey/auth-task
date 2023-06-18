import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../jwt/jwt';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, { sub, email, role }: JwtPayload) {
    const authorization = request.get('authorization');

    if (!authorization) {
      throw new InternalServerErrorException('Invalid auth validation state');
    }

    const [_, refreshToken] = authorization.split(' ');

    return { id: sub, email, role, refreshToken };
  }
}
