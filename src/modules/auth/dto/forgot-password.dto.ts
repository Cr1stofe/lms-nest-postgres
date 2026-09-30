import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email cadastrado para envio do link de recuperação',
    example: 'henrique.barros@exemplo.com',
  })
  @IsEmail({}, { message: 'email inválido' })
  @IsNotEmpty({ message: 'email é obrigatório' })
  email: string;
}

