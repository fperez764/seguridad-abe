// access-control.decorator.ts
import { SetMetadata } from '@nestjs/common';

// 1. Definimos la constante con un nombre único para evitar conflictos
export const ABE_ACCESS_CONTROL_KEY = 'abe_access_control';

// 2. Creamos el decorador que usaremos en los controladores
export const RequireAccess = (areaCode: string, scopeCode: string, roleCode: string) =>
  SetMetadata(ABE_ACCESS_CONTROL_KEY, { areaCode, scopeCode, roleCode });