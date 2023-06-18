import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { config } from 'src/config/config.test';
import { Customer, Role } from 'src/customer/customer';
import { CustomerModule } from 'src/customer/customer.module';
import { CustomerService } from 'src/customer/customer.service';
import * as request from 'supertest';
import { AuthModule } from '../auth.module';
import { AuthService } from '../auth.service';
import { JwtStrategy } from '../jwt/jwt.strategy';
import { LocalStrategy } from '../local/local.strategy';
import { RefreshStrategy } from '../refresh/refresh.strategy';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let customerService: CustomerService;

  const customerPassword = 'test1234';
  const customer: Customer = {
    id: '1234',
    email: 'test@test.com',
    password: '$2a$10$UAGutHBbJbI1LLoh91GO7.tj1RBk24CwfVBd/mHMSYGcPdri5CTYC',
    name: 'Test',
    createdAt: new Date('2023-06-18T19:20:11.177Z'),
    updatedAt: new Date('2023-06-18T19:20:11.177Z'),
    isActive: true,
    role: Role.User,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [AuthService, LocalStrategy, JwtStrategy, RefreshStrategy],
      imports: [
        AuthModule,
        ConfigModule.forRoot({ isGlobal: true, load: [config] }),
        JwtModule,
        PassportModule,
        CustomerModule,
        CacheModule.register({ isGlobal: true }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    customerService = moduleFixture.get(CustomerService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('auth', () => {
    it('should login as customer', async () => {
      jest.spyOn(customerService, 'find').mockResolvedValue(customer);

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: customer.email, password: customerPassword })
        .expect(201);

      expect(body).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('should not allow using customer operation only for authenticated customers', async () => {
      return request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('should allow using customer operation for only active customers', async () => {
      jest.spyOn(customerService, 'find').mockResolvedValue(customer);

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: customer.email, password: customerPassword })
        .expect(201);
      const { accessToken } = body;

      jest
        .spyOn(customerService, 'find')
        .mockResolvedValue({ ...customer, isActive: false });

      return await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('should refresh customers token', async () => {
      jest.spyOn(customerService, 'find').mockResolvedValue(customer);

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: customer.email, password: customerPassword })
        .expect(201);
      const { accessToken, refreshToken } = body;

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      const { body: refreshBody } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(201);

      expect(refreshBody).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('should logout customer removing refresh token', async () => {
      jest.spyOn(customerService, 'find').mockResolvedValue(customer);
      const keyValueStorage = app.get<Cache>(CACHE_MANAGER);

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: customer.email, password: customerPassword })
        .expect(201);

      await expect(keyValueStorage.get(customer.id)).resolves.toBeTruthy();

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(201);

      await expect(keyValueStorage.get(customer.id)).resolves.toBeUndefined();
    });
  });
});
