import { CustomerId, Role } from 'src/customer/customer';

export type JwtPayload = {
  email: string;
  sub: CustomerId;
  role: Role;
  iat: number;
  exp: number;
};
