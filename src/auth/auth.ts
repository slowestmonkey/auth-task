import { Customer, CustomerId } from 'src/customer/customer';

export type AuthPayload = { accessToken: string; refreshToken: string };

export type LoginParams = Pick<Customer, 'email' | 'id' | 'role'>;

export type RefreshTokenParams = { id: CustomerId; refreshToken: string };

export type LogoutParams = { id: CustomerId };
