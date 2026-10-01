import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity.js';
import { UsuarioService } from './services/usuario.service.js';
import { LogAutenticacion } from './entities/log-autenticacion.entity.js';
import { LogAutenticacionService } from './services/log-autenticacion.service.js';   
// ... otros imports (AuthModule, etc.)

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, LogAutenticacion]),  
  ],
  providers: [UsuarioService, LogAutenticacionService], 
  exports: [UsuarioService, LogAutenticacionService], 
})
export class IamModule {}