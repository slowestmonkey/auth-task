import { Customer, CustomerId } from 'src/customer/customer';

export type AuthPayload = { accessToken: string; refreshToken: string };

export type AuthUser = Pick<Customer, 'email' | 'id' | 'role'>;

export type AuthUserWithRefreshToken = AuthUser & { refreshToken: string };

export type RefreshTokenParams = { id: CustomerId; refreshToken: string };

export type LogoutParams = { id: CustomerId };
