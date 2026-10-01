import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { ldapUid: string; password: string }, @Req() req: Request) {
    const ipOrigen = req.ip || req.socket.remoteAddress;
    this.logger.log(` Petición de login recibida para usuario: ${loginDto.ldapUid} desde IP: ${ipOrigen}`);
    
    try {
      const result = await this.authService.loginStep1(loginDto.ldapUid, loginDto.password, ipOrigen);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyDto: { tempToken: string; otp: string }, @Req() req: Request) {
    const ipOrigen = req.ip || req.socket.remoteAddress;
    return this.authService.loginStep2(verifyDto.tempToken, verifyDto.otp, ipOrigen);
  }
}