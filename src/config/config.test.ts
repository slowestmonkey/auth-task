import { Environment } from './environment';

export const config = () => ({
  nodeEnv: Environment.Test,
  database: {
    url: 'postgresql://$postgres:docker@localhost:5432/test?schema=task',
  },
  jwt: {
    secret: 'secret',
    expiresIn: '5m',
    refreshSecret: 'refresh-secret',
    refreshExpiresIn: 86400,
  },
  redis: {
    host: 'localhost',
    port: 6379,
  },
  activationCodeTTL: 86400,
  hashSalt: 10,
});
