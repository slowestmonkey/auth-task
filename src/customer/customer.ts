import { Customer as CustomerModel } from '@prisma/client';

// TODO: remove dependency on prisma in business layer
export type CustomerId = Customer['id'];

export type Customer = CustomerModel;

export type HashedPassword = string & { hashedPassword: true };

export enum Role {
  User = 'USER',
  Admin = 'ADMIN',
}
