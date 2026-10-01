// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { IamModule } from './modules/iam/iam.module.js';
import { MenuModule } from './modules/menu/menu.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { validateEnv } from './env.validation.js';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    // 1. Configuración global de variables de entorno (con validación estricta)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),

    // 2. Configuración de JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        // getOrThrow: si JWT_SECRET no existe, la app falla al arrancar
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' }, // token de sesión corto; renueva con re-login
      }),
      global: true,
    }),

    // 3. Configuración de TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        schema: 'abeseg',
        autoLoadEntities: true,
        synchronize: false, // nunca en producción; usa migraciones
      }),
    }),

    // 4. Tus módulos de negocio
    IamModule,
    MenuModule,
    AuthModule,
  ],
})
export class AppModule {}
