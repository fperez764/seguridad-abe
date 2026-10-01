import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { IamModule } from '../iam/iam.module.js'; // Necesario para inyectar UsuarioService
import { LdapService } from './ldap.service.js';
import { OtpService } from './otp.service.js';

@Module({
  imports: [IamModule], // Importamos IamModule para tener acceso a UsuarioService
  controllers: [AuthController],
  providers: [AuthService, LdapService, OtpService],
  exports: [AuthService],
})
export class AuthModule {}