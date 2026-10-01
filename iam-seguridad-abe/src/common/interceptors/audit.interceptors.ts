import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    
    // El usuario autenticado (o 'SYSTEM' en el login) se extrae del request
    const currentUser = request.user?.ldapUid || 'SYSTEM_LOGIN'; 
    const now = new Date();

    // Inyectamos los campos de auditoría si vienen en el body (para POST/PUT)
    if (request.method === 'POST' && body) {
      body.usu_cre = currentUser;
      body.fec_cre = now;
    }
    if (request.method === 'PUT' && body) {
      body.usu_mod = currentUser;
      body.fec_mod = now;
    }

    return next.handle();
  }
}