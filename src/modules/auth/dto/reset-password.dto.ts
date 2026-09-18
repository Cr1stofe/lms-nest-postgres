import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'token deve ser um texto' })
  @IsNotEmpty({ message: 'token é obrigatório' })
  @Length(32, 128, { message: 'token inválido' })
  token: string;

  @IsString({ message: 'nova senha deve ser um texto' })
  @IsNotEmpty({ message: 'nova senha é obrigatória' })
  @Length(8, 72, { message: 'nova senha deve ter pelo menos 8 caracteres' })
  new_password: string;
}
