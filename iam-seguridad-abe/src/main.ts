import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Habilita CORS para todas las rutas y orígenes
  
  // ✅ Cambiamos al puerto 3001 y escuchamos en todas las IPs
  await app.listen(3001, '0.0.0.0'); 
  
  console.log(`🚀 Aplicación corriendo en: http://192.168.238.60:3001`);
}
bootstrap();
