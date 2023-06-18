import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { redisStore } from 'cache-manager-redis-store';
import { join } from 'path';
import type { RedisClientOptions } from 'redis';
import { AuthModule } from './auth/auth.module';
import { config } from './config/config';
import { Environment } from './config/environment';
import { CustomerModule } from './customer/customer.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    AuthModule,
    CustomerModule,
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get('redis.host'),
        port: configService.get('redis.port'),
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        buildSchemaOptions: { dateScalarMode: 'timestamp' },
        playground: false,
        introspection: configService.get('nodeEnv') === Environment.Development,
        plugins: [ApolloServerPluginLandingPageLocalDefault],
      }),
    }),
  ],
  providers: [PrismaService],
})
export class AppModule {}
