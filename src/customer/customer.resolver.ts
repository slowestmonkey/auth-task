import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Customer } from 'lib/entities/customer.entity';
import { ActiveGuard } from 'src/auth/active/active.guard';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { Public } from 'src/auth/public/public.decorator';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Role } from './customer';
import { CustomerService } from './customer.service';
import {
  ActivateCustomerInput,
  DeleteCustomerInput,
  GetCustomerInput,
  CreateCustomerInput as SignupCustomerInput,
  UpdateCustomerInput,
  WhereCustomerInput,
} from './dto/customer.input';

@Resolver(() => Customer)
@UseGuards(JwtAuthGuard, RolesGuard, ActiveGuard)
export class CustomerResolver {
  constructor(private readonly customerService: CustomerService) {}

  @Query(() => [Customer])
  async customers(@Args('data') params: GetCustomerInput) {
    return this.customerService.findAll(params);
  }

  @Query(() => Customer, { nullable: true })
  async customer(@Args('data') params: WhereCustomerInput) {
    return this.customerService.find(params);
  }

  @Public()
  @Mutation(() => Customer)
  async customerSignup(@Args('data') params: SignupCustomerInput) {
    return this.customerService.create(params);
  }

  @Roles(Role.Admin)
  @Mutation(() => Customer)
  async customerUpdate(@Args('data') params: UpdateCustomerInput) {
    return this.customerService.update(params);
  }

  @Roles(Role.Admin)
  @Mutation(() => Customer)
  async customerDelete(@Args('data') params: DeleteCustomerInput) {
    return this.customerService.delete(params.id);
  }

  @Public()
  @Mutation(() => Customer, { nullable: true })
  async customerActivate(@Args('data') params: ActivateCustomerInput) {
    await this.customerService.activate(params.activationCode);
  }
}
