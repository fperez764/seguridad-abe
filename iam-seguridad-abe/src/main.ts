import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Confía en el proxy inverso (Nginx) para obtener la IP real del cliente (req.ip)
  app.set('trust proxy', 1);

  // Validación global de DTOs en todos los endpoints
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // rechaza peticiones con campos extra
      transform: true, // convierte tipos (string -> number, etc.)
    }),
  );

  // CORS restringido a orígenes explícitos (configurables vía .env).
  // Nunca usar origin:true junto con credenciales en producción.
  const allowedOrigins = (configService.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Permite peticiones sin origen (curl, health checks, same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 86400,
  };
  app.enableCors(corsOptions);

  const port = configService.get<number>('PORT') ?? 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 IAM Seguridad ABE escuchando en el puerto ${port}`);
}

void bootstrap().catch((err) => {
  // Si la configuración es inválida, fail-fast con mensaje claro
  console.error('Fatal error al iniciar la aplicación:', err?.message ?? err);
  process.exitCode = 1;
});
