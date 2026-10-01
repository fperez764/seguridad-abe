import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private transporter: nodemailer.Transporter;
  
  // Mapa temporal para almacenar OTPs (En producción se recomienda usar Redis)
  // Estructura: email -> { code: string, expiresAt: number }
  private otpStore = new Map<string, { code: string; expiresAt: number }>();

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
    // 1. Generar código aleatorio de 6 dígitos
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 2. Guardar en memoria con expiración de 5 minutos (300,000 ms)
    this.otpStore.set(ldapUid, {
      code: otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
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
      this.logger.error(`❌ Error al enviar OTP a ${ldapUid}: ${error.message}`);
      throw new Error('No se pudo enviar el código de verificación al correo');
    }
  }

  validateOtp(ldapUid: string, otpCode: string): boolean { 
    // PARA VER QUÉ ESTÁ PASANDO EN LA TERMINAL
    //this.logger.log(`🔍 Espía: Buscando OTP para email [${ldapUid}] y código [${otpCode}]`);
    
    const stored = this.otpStore.get(ldapUid);
    
    if (!stored) {
      this.logger.warn(`⚠️ No se encontró OTP guardado para el email: ${ldapUid}`);
      return false;
    }

    // Si el tiempo ya expiró
    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(ldapUid); // Limpieza
      return false;
    }

    // Si el código no coincide
    if (stored.code !== otpCode) {
      return false;
    }

    // ¡Éxito! Eliminamos el OTP para que no pueda ser reutilizado (one-time use)
    this.otpStore.delete(ldapUid);
    return true;
  }
}