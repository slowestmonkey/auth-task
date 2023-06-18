import { Environment } from './environment';

export const config = () => ({
  nodeEnv: process.env.NODE_ENV ?? Environment.Development,
  port: parseInt(process.env.PORT ?? '8080'),
  database: {
    url: process.env.DATABASE_URL,
    shadowUrl: process.env.SHADOW_DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
    refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN ?? '86400'),
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379'),
  },
  activationCodeTTL: parseInt(process.env.ACTIVATION_CODE_TTL ?? '86400'),
  hashSalt: parseInt(process.env.HASH_SALT ?? '10'),
});
