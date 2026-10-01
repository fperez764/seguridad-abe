import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt, timingSafeEqual } from 'crypto';
import * as nodemailer from 'nodemailer';

interface OtpEntry {
  code: string;
  expiresAt: number;
  sentAt: number;
  attempts: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private transporter: nodemailer.Transporter;

  // Mapa temporal para almacenar OTPs (En producción se recomienda usar Redis)
  // Estructura: ldapUid -> OtpEntry
  private otpStore = new Map<string, OtpEntry>();

  private static readonly RESEND_INTERVAL_MS = 30 * 1000; // 30s entre envíos
  private static readonly MAX_ATTEMPTS = 5; // intentos de validación por código

  constructor(private configService: ConfigService) {
    // Configuramos el transporter de Nodemailer con las variables del .env
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true', // true para puerto 465, false para 587
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async generateAndSendOtp(ldapUid: string, emailDestino: string): Promise<string> {
    const entry = this.otpStore.get(ldapUid);
    const now = Date.now();

    // 0. Rate limiting básico: mínimo 30s entre envíos y máximo de intentos
    if (entry) {
      if (now - entry.sentAt < OtpService.RESEND_INTERVAL_MS) {
        throw new UnauthorizedException(
          'Ya se envió un código recientemente. Espera unos segundos antes de solicitar otro.',
        );
      }
      if (entry.attempts >= OtpService.MAX_ATTEMPTS) {
        this.otpStore.delete(ldapUid);
        throw new UnauthorizedException(
          'Demasiados intentos con códigos incorrectos. Inicia sesión nuevamente.',
        );
      }
    }

    // 1. Generar código aleatorio de 6 dígitos con criptografía fuerte
    // (Math.random no es adecuado para tokens de seguridad)
    const otpCode = randomInt(100000, 1000000).toString();

    // 2. Guardar en memoria con expiración de 5 minutos (300,000 ms)
    this.otpStore.set(ldapUid, {
      code: otpCode,
      expiresAt: now + 5 * 60 * 1000,
      sentAt: now,
      attempts: 0,
    });

    // 3. Configurar el correo
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 'Sistema ABE <no-reply@abe.bo>',
      to: emailDestino, // El correo real va aquí solo para el envío
      subject: 'Código de Verificación ABE - Sistema de Seguridad',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #0B2335; text-align: center;">Sistema de Seguridad ABE</h2>
          <p style="text-align: center; color: #555;">Hola <strong>${ldapUid}</strong>, se ha solicitado un código de verificación.</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #0B2335; letter-spacing: 8px; font-size: 36px; margin: 0;">${otpCode}</h1>
          </div>
          <p style="text-align: center; color: #777;">Este código expirará en <strong>5 minutos</strong>.</p>
        </div>
      `,
    };

    // 4. Enviar el correo
    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ OTP generado para [${ldapUid}] y enviado a ${emailDestino}`);
      return otpCode; // Retornamos el código solo para logs o pruebas
    } catch (error: any) {
      // Si el correo no se envió, no dejamos un OTP huérfano en memoria
      this.otpStore.delete(ldapUid);
      this.logger.error(`❌ Error al enviar OTP a ${ldapUid}: ${error.message}`);
      throw new Error('No se pudo enviar el código de verificación al correo');
    }
  }

  validateOtp(ldapUid: string, otpCode: string): boolean {
    const stored = this.otpStore.get(ldapUid);

    if (!stored) {
      this.logger.warn(`⚠️ No se encontró OTP guardado para el usuario: ${ldapUid}`);
      return false;
    }

    // Si el tiempo ya expiró
    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(ldapUid); // Limpieza
      return false;
    }

    // Comparación en tiempo constante para evitar timing attacks
    if (timingSafeEqualStr(stored.code, otpCode)) {
      // ¡Éxito! Eliminamos el OTP para que no pueda ser reutilizado (one-time use)
      this.otpStore.delete(ldapUid);
      return true;
    }

    // Código incorrecto: contabilizamos el intento (rate limiting)
    stored.attempts += 1;
    if (stored.attempts >= OtpService.MAX_ATTEMPTS) {
      this.otpStore.delete(ldapUid);
      this.logger.warn(`🚫 Múltiples intentos fallidos de OTP para [${ldapUid}]. Código invalidado.`);
    }
    return false;
  }
}

/** Comparación de cadenas en tiempo constante */
function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
