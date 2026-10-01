import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Health check para balanceadores / monitoreo (Nginx, PM2, uptime checks)
  @Get('health')
  getHealth(): { status: string; service: string; timestamp: string } {
    return this.appService.getHealth();
  }
}
