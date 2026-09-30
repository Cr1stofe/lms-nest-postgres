import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token criptográfico de recuperação enviado por email',
    example: 'dGhpcy1pcy1hLXNhbXBsZS10b2tlbi1mb3ItcGFzc3dvcmQtcmVzZXQ',
    minLength: 32,
    maxLength: 128,
  })
  @IsString({ message: 'token deve ser um texto' })
  @IsNotEmpty({ message: 'token é obrigatório' })
  @Length(32, 128, { message: 'token inválido' })
  token: string;

  @ApiProperty({
    description: 'Nova senha cadastrada para a conta (mínimo de 8 caracteres)',
    example: 'NovaSenhaSegura@2026',
    minLength: 8,
    maxLength: 72,
  })
  @IsString({ message: 'nova senha deve ser um texto' })
  @IsNotEmpty({ message: 'nova senha é obrigatória' })
  @Length(8, 72, { message: 'nova senha deve ter pelo menos 8 caracteres' })
  new_password: string;
}

