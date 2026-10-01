import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  tempToken!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'El OTP debe ser un código de 6 dígitos' })
  otp!: string;
}
