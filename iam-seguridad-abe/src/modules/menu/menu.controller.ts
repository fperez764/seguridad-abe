import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { MenuService } from './menu.service.js'; // El servicio adaptado a abeseg

@Controller('api/v1/iam')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('users/:userId/menu')
  async getUserDynamicMenu(@Param('userId') userId: string) {
    // Llama al nuevo servicio que hace el JOIN en abeseg y extrae el JSONB
    const menuItems = await this.menuService.getDynamicMenu(parseInt(userId));
    
    return {
      success: true,
      data: menuItems // Ya viene formateado con url, isExternal, permissions (JSONB)
    };
  }
}