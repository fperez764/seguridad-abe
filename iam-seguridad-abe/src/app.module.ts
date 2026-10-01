// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { IamModule } from './modules/iam/iam.module.js';
import { MenuModule } from './modules/menu/menu.module.js';
import { AuthModule } from './modules/auth/auth.module.js'; 

@Module({
  imports: [
    // 1. Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // 2. Configuración de JWT (CORREGIDA)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService], // <--- ¡ESTA LÍNEA FALTABA! Le dice a NestJS que pase el ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      global: true,
    }),

    // 3. Configuración de TypeORM (Aseguramos que también tenga el inject)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService], // <--- Aseguramos que esté aquí también
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS') || '',
        database: configService.get<string>('DB_NAME'),
        schema: 'abeseg',
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    
    // 4. Tus módulos de negocio
    IamModule,
    MenuModule,
    AuthModule,
  ],
})
export class AppModule {}