import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  ldapUid!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
