import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FileParamDto {
  @ApiProperty({
    description: 'Stored filename with extension',
    example: 'avatar-user.png',
  })
  @IsString({ message: 'nome de arquivo deve ser um texto' })
  @IsNotEmpty({ message: 'nome de arquivo obrigatório' })
  @Matches(/^(?!\.)[A-Za-z0-9._-]+$/, {
    message: 'nome de arquivo inválido',
  })
  name: string;
}

