import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Customer } from 'src/customer/customer';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(email: string, password: string): Promise<Customer> {
    const customer = await this.authService.validateCustomer(email, password);

    if (!customer?.isActive) {
      throw new UnauthorizedException();
    }

    return customer;
  }
}
