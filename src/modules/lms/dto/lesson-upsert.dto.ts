import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LessonUpsertDto {
  @ApiProperty({
    description: 'Slug do curso pai da aula',
    example: 'html-e-css-para-iniciantes',
    minLength: 2,
    maxLength: 64,
  })
  @IsString({ message: 'courseSlug deve ser um texto' })
  @IsNotEmpty({ message: 'courseSlug é obrigatório' })
  @Length(2, 64, { message: 'courseSlug deve ter entre 2 e 64 caracteres' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'courseSlug deve conter apenas letras minúsculas, números e hífen',
  })
  courseSlug: string;

  @ApiProperty({
    description: 'Slug identificador único da aula dentro do curso',
    example: 'tags-basicas',
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
    description: 'Título descritivo da aula',
    example: 'Tags Básicas e Estrutura Semântica',
    minLength: 2,
    maxLength: 128,
  })
  @IsString({ message: 'título deve ser um texto' })
  @IsNotEmpty({ message: 'título é obrigatório' })
  @Length(2, 128, { message: 'título deve ter entre 2 e 128 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Duração total do vídeo em segundos',
    example: 600,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'duração em segundos deve ser um número inteiro' })
  @Min(0, { message: 'duração não pode ser negativa' })
  seconds: number;

  @ApiProperty({
    description: 'Caminho ou URL do arquivo de vídeo',
    example: '/html/tags-basicas.mp4',
  })
  @IsString({ message: 'vídeo deve ser um texto' })
  @IsNotEmpty({ message: 'vídeo é obrigatório' })
  video: string;

  @ApiProperty({
    description: 'Conteúdo textual e resumo da aula',
    example: 'Aprenda sobre html, head, body, h1-h6, p, a e img.',
  })
  @IsString({ message: 'descrição deve ser um texto' })
  @IsNotEmpty({ message: 'descrição é obrigatória' })
  description: string;

  @ApiProperty({
    description: 'Posição ordinal de exibição da aula no curso',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'ordem deve ser um número inteiro' })
  @Min(1, { message: 'ordem deve ser pelo menos 1' })
  order: number;

  @ApiProperty({
    description: 'Define se a aula é pública/gratuita (1) ou restrita a alunos (0)',
    example: 1,
    enum: [0, 1],
  })
  @Type(() => Number)
  @IsIn([0, 1], { message: 'free deve ser 0 ou 1' })
  free: number;
}

