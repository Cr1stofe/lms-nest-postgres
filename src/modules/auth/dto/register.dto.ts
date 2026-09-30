import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Nome completo do aluno',
    example: 'Henrique Barros',
    minLength: 2,
    maxLength: 64,
  })
  @IsString({ message: 'nome deve ser um texto' })
  @IsNotEmpty({ message: 'nome é obrigatório' })
  @Length(2, 64, { message: 'nome deve ter entre 2 e 64 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Nome de usuário único no sistema',
    example: 'henriquebarros',
    minLength: 2,
    maxLength: 32,
  })
  @IsString({ message: 'username deve ser um texto' })
  @IsNotEmpty({ message: 'username é obrigatório' })
  @Length(2, 32, { message: 'username deve ter entre 2 e 32 caracteres' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'username deve conter apenas letras, números, ponto, hífen ou underline',
  })
  username: string;

  @ApiProperty({
    description: 'Email de acesso único',
    example: 'henrique.barros@exemplo.com',
  })
  @IsEmail({}, { message: 'email inválido' })
  @IsNotEmpty({ message: 'email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Senha de acesso (mínimo de 8 caracteres)',
    example: 'P@ssw0rd123',
    minLength: 8,
    maxLength: 72,
  })
  @IsString({ message: 'senha deve ser um texto' })
  @IsNotEmpty({ message: 'senha é obrigatória' })
  @Length(8, 72, { message: 'senha deve ter pelo menos 8 caracteres' })
  password: string;
}

