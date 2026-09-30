import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CourseUpsertDto {
  @ApiProperty({
    description: 'Identificador único do curso em formato URL-friendly',
    example: 'html-e-css-para-iniciantes',
    minLength: 2,
    maxLength: 64,
  })
  @IsString({ message: 'slug deve ser um texto' })
  @IsNotEmpty({ message: 'slug é obrigatório' })
  @Length(2, 64, { message: 'slug deve ter entre 2 e 64 caracteres' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífen',
  })
  slug: string;

  @ApiProperty({
    description: 'Título do curso',
    example: 'HTML e CSS para Iniciantes',
    minLength: 2,
    maxLength: 128,
  })
  @IsString({ message: 'título deve ser um texto' })
  @IsNotEmpty({ message: 'título é obrigatório' })
  @Length(2, 128, { message: 'título deve ter entre 2 e 128 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do conteúdo e objetivos do curso',
    example: 'Aprenda os fundamentos da web: marcação semântica, estilização moderna e acessibilidade.',
  })
  @IsString({ message: 'descrição deve ser um texto' })
  @IsNotEmpty({ message: 'descrição é obrigatória' })
  description: string;

  @ApiProperty({
    description: 'Carga horária estimada em horas',
    example: 8,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'carga horária deve ser um número inteiro' })
  @Min(0, { message: 'carga horária não pode ser negativa' })
  hours: number;
}

