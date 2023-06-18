import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcrypt';
import { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma.service';
import { Customer, CustomerId, HashedPassword } from './customer';
import {
  CreateCustomerInput,
  GetCustomerInput,
  UpdateCustomerInput,
  WhereCustomerInput,
} from './dto/customer.input';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly keyValueStorage: Cache,
  ) {}

  async findAll(params: GetCustomerInput): Promise<Customer[]> {
    return this.prisma.customer.findMany(params);
  }

  async find(params: WhereCustomerInput): Promise<Customer | null> {
    return this.prisma.customer.findFirst({ where: params });
  }

  async create(params: CreateCustomerInput): Promise<Customer> {
    const duplicate = await this.find({ email: params.email });

    if (duplicate) {
      throw new BadRequestException('Customer already exists');
    }

    const hashedPassword = await this.hashPassword(params.password);
    const customer = await this.prisma.customer.create({
      data: { ...params, password: hashedPassword },
    });

    await this.initiateActivation(customer.id);

    return customer;
  }

  private async hashPassword(password: string): Promise<HashedPassword> {
    const hashSalt = this.configService.get('hashSalt');
    const hashedPassword = await hash(password, hashSalt);

    return hashedPassword as HashedPassword;
  }

  private async initiateActivation(id: CustomerId): Promise<void> {
    const hashSalt = this.configService.get('hashSalt');
    const activationCode = await hash(id, hashSalt);

    console.log('Activation code to send in email: ', activationCode);

    const activationCodeTTL = this.configService.get('activationCodeTTL');

    await this.keyValueStorage.set(activationCode, id, activationCodeTTL);
  }

  async activate(activationCode: string): Promise<void> {
    const customerId = await this.keyValueStorage.get<CustomerId>(
      activationCode,
    );

    if (!customerId) {
      return;
    }

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { isActive: true, updatedAt: new Date() },
    });
    await this.keyValueStorage.del(activationCode);
  }

  async update({ id, ...params }: UpdateCustomerInput): Promise<Customer> {
    const customer = await this.find({ id });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customer.update({ where: { id }, data: params });
  }

  async delete(id: CustomerId): Promise<Customer> {
    const customer = await this.find({ id });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customer.delete({ where: { id } });
  }
}
