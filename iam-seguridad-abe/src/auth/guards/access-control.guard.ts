import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// CORRECCIÓN 1: Sin la extensión .js y con el nombre correcto
import { ABE_ACCESS_CONTROL_KEY } from '../decorators/access-control.decorator.js';

@Injectable()
export class AccessControlGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // CORRECCIÓN 2: Usar ABE_ACCESS_CONTROL_KEY aquí también (antes decía ACCESS_CONTROL_KEY)
    const required = this.reflector.get(ABE_ACCESS_CONTROL_KEY, context.getHandler());
    
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user; 

    if (!user) throw new ForbiddenException('Usuario no autenticado');

    // Lógica de validación (simulada por ahora)
    const hasAccess = true; 

    if (!hasAccess) {
      throw new ForbiddenException(`Acceso denegado para el contexto: Área=${required.areaCode}, Ámbito=${required.scopeCode}, Rol=${required.roleCode}`);
    }
    
    return true;
  }
}