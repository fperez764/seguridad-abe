import { Injectable, BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class OtpService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async generateAndSendOtp(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // TODO: Guardar OTP en DB/Redis con expiración (ej. 5 min)
    // await this.otpRepository.save({ email, code: otp, expiresAt: new Date(Date.now() + 5*60*1000) });

    await this.transporter.sendMail({
      from: `"Seguridad ABE" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Código de Verificación (2FA)',
      text: `Tu código de verificación es: ${otp}. Válido por 5 minutos.`,
    });

    return otp; // Retornado solo para fines de testing/logging
  }
}