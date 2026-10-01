import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class IamProxyController {
  constructor(private readonly httpService: HttpService) {}

  @Get('user/menu')
  async getUserMenu(@Req() req: any) {
    const userId = req.user.sub; // Obtenido del JWT validado
    
    // El Gateway actúa como proxy seguro hacia el microservicio IAM interno
    // Usa una red interna (ej. http://iam-seguridad-abe.internal:3001)
    const iamUrl = `${process.env.IAM_SERVICE_URL}/api/v1/iam/users/${userId}/menu`;
    
    const response = await firstValueFrom(this.httpService.get(iamUrl));
    return response.data;
  }
}