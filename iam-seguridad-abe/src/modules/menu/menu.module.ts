import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuController } from './menu.controller.js';
import { MenuService } from './menu.service.js';
import { Usuario } from '../iam/entities/usuario.entity.js';

@Module({
  imports: [
    // Registramos la entidad Usuario para que MenuService pueda inyectar su repositorio
    TypeOrmModule.forFeature([Usuario]),
  ],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService], // Por si otros módulos necesitan usar este servicio
})
export class MenuModule {}