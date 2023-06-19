import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { config } from 'src/config/config.test';
import { CustomerModule } from 'src/customer/customer.module';
import { CustomerService } from 'src/customer/customer.service';
import * as request from 'supertest';
import { AuthModule } from '../auth.module';
import { AuthService } from '../auth.service';
import { JwtStrategy } from '../jwt/jwt.strategy';
import { LocalStrategy } from '../local/local.strategy';
import { RefreshStrategy } from '../refresh/refresh.strategy';
import { customerMock, customerMockPassword } from './auth.mock';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let customerService: CustomerService;

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
      jest.spyOn(customerService, 'find').mockResolvedValue(customerMock);

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: customerMock.email, password: customerMockPassword })
        .expect(201);

      expect(body).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('should not login as customer with wrong password', async () => {
      jest.spyOn(customerService, 'find').mockResolvedValue(customerMock);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: customerMock.email, password: 'wrongPassword' })
        .expect(401);
    });

    it('should not allow using customer operation only for authenticated customers', async () => {
      return request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('should allow using customer operation for only active customers', async () => {
      jest.spyOn(customerService, 'find').mockResolvedValue(customerMock);

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: customerMock.email, password: customerMockPassword })
        .expect(201);
      const { accessToken } = body;

      jest
        .spyOn(customerService, 'find')
        .mockResolvedValue({ ...customerMock, isActive: false });

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      jest.spyOn(customerService, 'find').mockResolvedValue(customerMock);

      return await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);
    });

    it('should refresh customers token', async () => {
      jest.spyOn(customerService, 'find').mockResolvedValue(customerMock);

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: customerMock.email, password: customerMockPassword })
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
      jest.spyOn(customerService, 'find').mockResolvedValue(customerMock);
      const keyValueStorage = app.get<Cache>(CACHE_MANAGER);

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: customerMock.email, password: customerMockPassword })
        .expect(201);

      await expect(keyValueStorage.get(customerMock.id)).resolves.toBeTruthy();

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(201);

      await expect(
        keyValueStorage.get(customerMock.id),
      ).resolves.toBeUndefined();
    });
  });
});
