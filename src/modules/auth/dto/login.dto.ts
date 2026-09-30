import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email cadastrado',
    example: 'admin@lms.com',
  })
  @IsEmail({}, { message: 'email inválido' })
  @IsNotEmpty({ message: 'email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Senha de acesso',
    example: 'P@ssw0rd123',
  })
  @IsString({ message: 'senha deve ser um texto' })
  @IsNotEmpty({ message: 'senha é obrigatória' })
  password: string;
}

