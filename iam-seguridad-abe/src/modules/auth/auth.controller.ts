import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ipOrigen = req.ip || req.socket.remoteAddress;
    this.logger.log(`Petición de login recibida para usuario: ${loginDto.ldapUid} desde IP: ${ipOrigen}`);

    // El servicio ya registra los fallos en seg_log_autenticacion;
    // no hace falta un try/catch que solo re-lanza la excepción.
    return this.authService.loginStep1(loginDto.ldapUid, loginDto.password, ipOrigen);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyDto: VerifyOtpDto, @Req() req: Request) {
    const ipOrigen = req.ip || req.socket.remoteAddress;
    return this.authService.loginStep2(verifyDto.tempToken, verifyDto.otp, ipOrigen);
  }
}
