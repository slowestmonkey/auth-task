export type JwtPayload = {
  email: string;
  sub: string;
  role: string;
  iat: number;
  exp: number;
};
