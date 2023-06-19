import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { CustomerService } from 'src/customer/customer.service';
import { IS_PUBLIC_KEY } from '../public/public.decorator';

@Injectable()
export class ActiveCustomerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly customerService: CustomerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const executionContext = GqlExecutionContext.create(context);
    const { user } = executionContext.getContext().req;
    const customer = await this.customerService.find({ id: user.id });

    return customer?.isActive ?? false;
  }
}
