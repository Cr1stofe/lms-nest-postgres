import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Current password of the authenticated user',
    example: 'P@ssw0rd123',
  })
  @IsString({ message: 'senha atual deve ser um texto' })
  @IsNotEmpty({ message: 'senha atual é obrigatória' })
  password: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'NovaSenhaSegura@2026',
    minLength: 8,
    maxLength: 72,
  })
  @IsString({ message: 'nova senha deve ser um texto' })
  @IsNotEmpty({ message: 'nova senha é obrigatória' })
  @Length(8, 72, { message: 'nova senha deve ter pelo menos 8 caracteres' })
  new_password: string;
}

