import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { join } from 'path';
import { config } from 'src/config/config.test';
import { Role } from 'src/customer/customer';
import { CustomerModule } from 'src/customer/customer.module';
import { CustomerService } from 'src/customer/customer.service';
import * as request from 'supertest';
import { AuthPayload } from '../auth';
import { AuthModule } from '../auth.module';
import { AuthService } from '../auth.service';
import { JwtStrategy } from '../jwt/jwt.strategy';
import { LocalStrategy } from '../local/local.strategy';
import { RefreshStrategy } from '../refresh/refresh.strategy';
import { customerMock, customerMockPassword } from './auth.mock';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let customerService: CustomerService;

  const authenticate = async (
    email: string,
    password: string,
  ): Promise<AuthPayload> => {
    const { body } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: email, password })
      .expect(201);

    return body;
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
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        }),
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

      const { accessToken } = await authenticate(
        customerMock.email,
        customerMockPassword,
      );

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

      const { accessToken, refreshToken } = await authenticate(
        customerMock.email,
        customerMockPassword,
      );

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

      const { accessToken } = await authenticate(
        customerMock.email,
        customerMockPassword,
      );

      await expect(keyValueStorage.get(customerMock.id)).resolves.toBeTruthy();

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      await expect(
        keyValueStorage.get(customerMock.id),
      ).resolves.toBeUndefined();
    });

    describe('roles', () => {
      it('should allow query customer operations for customer with any role', async () => {
        jest.spyOn(customerService, 'find').mockResolvedValue(customerMock);

        const query = '{ customers(data: { skip: 0}) { email, name } }';
        const { accessToken } = await authenticate(
          customerMock.email,
          customerMockPassword,
        );

        await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ query })
          .expect(200);

        jest
          .spyOn(customerService, 'find')
          .mockResolvedValue({ ...customerMock, role: Role.Admin });

        const { body } = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ query })
          .expect(200);

        expect(body.errors).toBeUndefined();
      });

      it('should not allow mutate customer operations for customer with user role', async () => {
        jest.spyOn(customerService, 'find').mockResolvedValue(customerMock);

        const mutation = `mutation { customerDelete(data: { id: "1234" }) { name } }`;
        const { accessToken } = await authenticate(
          customerMock.email,
          customerMockPassword,
        );

        const { body } = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ query: mutation });
        const errorMessages = body.errors.map((error: Error) => error.message);

        expect(errorMessages).toHaveLength(1);
        expect(errorMessages).toContain('Forbidden resource');
      });

      it('should allow mutate customer operations for customer with admin role', async () => {
        jest
          .spyOn(customerService, 'find')
          .mockResolvedValue({ ...customerMock, role: Role.Admin });
        jest.spyOn(customerService, 'delete').mockResolvedValue(customerMock);

        const mutation =
          'mutation { customerDelete(data: { id: "1234" }) { name } }';
        const { accessToken } = await authenticate(
          customerMock.email,
          customerMockPassword,
        );

        const { body } = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ query: mutation })
          .expect(200);

        expect(body.errors).toBeUndefined();
      });
    });
  });
});
