import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../iam/services/usuario.service.js';
import { LogAutenticacionService } from '../iam/services/log-autenticacion.service.js'; // ✅ Nuevo
import { LdapService } from './ldap.service.js';
import { OtpService } from './otp.service.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly logService: LogAutenticacionService, // ✅ Inyectado
    private readonly jwtService: JwtService,
    private readonly ldapService: LdapService,
    private readonly otpService: OtpService,
  ) {}

  async loginStep1(ldapUid: string, password: string, ipOrigen?: string) {
    try {
      // 1. Validar credenciales contra LDAP REAL
      const ldapUser = await this.ldapService.validateUser(ldapUid, password);

      // 2. Buscar o crear usuario en la BD
      const user = await this.usuarioService.findOrCreateByLdap({
        ldapUid: ldapUid,
        email: ldapUser.mail || `${ldapUid}@abe.bo`,
        nombreCompleto: ldapUser.cn || ldapUid,
      });

      if (user.estadoUsuario !== 'ACTIVO') {
        // ✅ Registrar fallo: Usuario inactivo
        await this.logService.registrarLog({
          usuarioId: user.usuarioId,
          ipOrigen: ipOrigen,
          metodoLogin: 'LDAP',
          resultado: 'FALLIDO',
          detalleError: 'Usuario inactivo o bloqueado en el sistema',
        });
        throw new UnauthorizedException('Usuario inactivo o bloqueado en el sistema');
      }

      // 3. Generar token temporal
      const tempToken = this.jwtService.sign(
        { sub: user.usuarioId, step: '2FA_PENDING', ldapUid: user.ldapUid, email: user.emailCorporativo },
        { expiresIn: '5m' }
      );

      // 4. Generar y enviar OTP
      await this.otpService.generateAndSendOtp(user.ldapUid, user.emailCorporativo);

      // ✅ Registrar éxito del Paso 1
      await this.logService.registrarLog({
        usuarioId: user.usuarioId,
        ipOrigen: ipOrigen,
        metodoLogin: 'LDAP',
        resultado: 'EXITOSO',
        detalleError: 'Credenciales LDAP válidas, OTP enviado',
        usuCre: user.ldapUid,
      });

      return {
        requires2FA: true,
        tempToken: tempToken,
        message: `Código OTP enviado a ${user.emailCorporativo}`,
      };

    } catch (error: any) {
      // ✅ Registrar fallo de LDAP
      await this.logService.registrarLog({
        ipOrigen: ipOrigen,
        metodoLogin: 'LDAP',
        resultado: 'FALLIDO',
        detalleError: error.message || 'Error en autenticación LDAP',
      });
      throw error;
    }
  }

  async loginStep2(tempToken: string, otp: string, ipOrigen?: string) {
    try {
      const payload = this.jwtService.verify(tempToken);

      if (payload.step !== '2FA_PENDING') {
        await this.logService.registrarLog({
          usuarioId: payload.sub,
          ipOrigen: ipOrigen,
          metodoLogin: 'OTP',
          resultado: 'FALLIDO',
          detalleError: 'Token de sesión inválido',
        });
        throw new UnauthorizedException('Token de sesión inválido');
      }

      const isValid = this.otpService.validateOtp(payload.ldapUid, otp);
      if (!isValid) {
        // ✅ Registrar fallo de OTP
        await this.logService.registrarLog({
          usuarioId: payload.sub,
          ipOrigen: ipOrigen,
          metodoLogin: 'OTP',
          resultado: 'FALLIDO',
          detalleError: 'Código OTP incorrecto o expirado',
        });
        throw new UnauthorizedException('Código OTP incorrecto o expirado');
      }

      const user = await this.usuarioService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      const access_token = this.jwtService.sign({
        sub: user.usuarioId,
        ldapUid: user.ldapUid,
        email: user.emailCorporativo,
      });

      // ✅ Registrar éxito final del login
      await this.logService.registrarLog({
        usuarioId: user.usuarioId,
        ipOrigen: ipOrigen,
        metodoLogin: 'JWT',
        resultado: 'EXITOSO',
        detalleError: 'Autenticación completada, token JWT generado',
        usuCre: user.ldapUid,
      });

      return {
        access_token: access_token,
        user: {
          usuarioId: user.usuarioId,
          ldapUid: user.ldapUid,
          email: user.emailCorporativo,
        }
      };

    } catch (error: any) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        await this.logService.registrarLog({
          ipOrigen: ipOrigen,
          metodoLogin: 'OTP',
          resultado: 'FALLIDO',
          detalleError: 'Token expirado o inválido',
        });
        throw new UnauthorizedException('La sesión de verificación ha expirado. Intente de nuevo.');
      }
      throw error;
    }
  }
}