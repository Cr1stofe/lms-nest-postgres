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
    description: 'Slug of the parent course',
    example: 'html-css-for-beginners',
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
    description: 'Unique lesson slug identifier within the course',
    example: 'basic-tags',
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
    description: 'Descriptive lesson title',
    example: 'Semantic HTML & Core Document Structure',
    minLength: 2,
    maxLength: 128,
  })
  @IsString({ message: 'título deve ser um texto' })
  @IsNotEmpty({ message: 'título é obrigatório' })
  @Length(2, 128, { message: 'título deve ter entre 2 e 128 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Video playback duration in seconds',
    example: 600,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'duração em segundos deve ser um número inteiro' })
  @Min(0, { message: 'duração não pode ser negativa' })
  seconds: number;

  @ApiProperty({
    description: 'Video file asset path or URL',
    example: '/html/basic-tags.mp4',
  })
  @IsString({ message: 'vídeo deve ser um texto' })
  @IsNotEmpty({ message: 'vídeo é obrigatório' })
  video: string;

  @ApiProperty({
    description: 'Lesson textual content, notes, and summary',
    example: 'Deep-dive into html, head, body, headings, links, and accessible media tags.',
  })
  @IsString({ message: 'descrição deve ser um texto' })
  @IsNotEmpty({ message: 'descrição é obrigatória' })
  description: string;

  @ApiProperty({
    description: 'Display sort order index of the lesson within the course',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'ordem deve ser um número inteiro' })
  @Min(1, { message: 'ordem deve ser pelo menos 1' })
  order: number;

  @ApiProperty({
    description: 'Public preview status: 1 for free/preview, 0 for enrolled students only',
    example: 1,
    enum: [0, 1],
  })
  @Type(() => Number)
  @IsIn([0, 1], { message: 'free deve ser 0 ou 1' })
  free: number;
}

