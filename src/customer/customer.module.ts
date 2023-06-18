import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CustomerResolver } from './customer.resolver';
import { CustomerService } from './customer.service';

@Module({
  providers: [CustomerService, PrismaService, CustomerResolver],
  exports: [CustomerService],
})
export class CustomerModule {}
