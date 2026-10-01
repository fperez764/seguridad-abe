// src/env.validation.ts
import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

/**
 * Validación centralizada de variables de entorno (12-factor).
 * Si falta una variable obligatoria o tiene un valor inseguro,
 * la aplicación NO arranca y falla con un mensaje claro.
 */
export class EnvironmentVariables {
  // --- Servidor ---
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  // --- Base de datos (PostgreSQL / schema abeseg) ---
  @IsString()
  DB_HOST!: string;

  @IsOptional()
  @IsInt()
  DB_PORT: number = 5432;

  @IsString()
  DB_USER!: string;

  @IsString()
  DB_PASS!: string;

  @IsString()
  DB_NAME!: string;

  // --- JWT ---
  @IsString()
  @MinLength(32, {
    message:
      'JWT_SECRET debe tener al menos 32 caracteres. Genera uno con: openssl rand -hex 32',
  })
  JWT_SECRET!: string;

  // --- LDAP (Active Directory) ---
  @IsString()
  LDAP_URL!: string;

  @IsString()
  LDAP_BIND_DN!: string;

  @IsString()
  LDAP_BIND_PASSWORD!: string;

  @IsString()
  LDAP_SEARCH_BASE!: string;

  @IsString()
  LDAP_SEARCH_FILTER!: string;

  // --- SMTP (envío de OTP) ---
  @IsString()
  SMTP_HOST!: string;

  @IsOptional()
  @IsInt()
  SMTP_PORT: number = 587;

  @IsOptional()
  @IsIn(['true', 'false'])
  SMTP_SECURE: string = 'false';

  @IsString()
  SMTP_USER!: string;

  @IsString()
  SMTP_PASS!: string;

  @IsOptional()
  @IsString()
  SMTP_FROM?: string;

  // --- CORS ---
  // Lista de orígenes permitidos separados por coma (ej: https://seguridad.abe.bo)
  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: false,
  });

  if (errors.length > 0) {
    const details = errors
      .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join('; ')}`)
      .join('\n');
    throw new Error(
      `❌ Variables de entorno inválidas o faltantes:\n${details}\n\n` +
        `Revisa tu archivo .env (puedes partir de .env.example).`,
    );
  }

  return validated;
}
