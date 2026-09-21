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

export class LessonUpsertDto {
  @IsString({ message: 'courseSlug deve ser um texto' })
  @IsNotEmpty({ message: 'courseSlug é obrigatório' })
  @Length(2, 64, { message: 'courseSlug deve ter entre 2 e 64 caracteres' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'courseSlug deve conter apenas letras minúsculas, números e hífen',
  })
  courseSlug: string;

  @IsString({ message: 'slug deve ser um texto' })
  @IsNotEmpty({ message: 'slug é obrigatório' })
  @Length(2, 64, { message: 'slug deve ter entre 2 e 64 caracteres' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífen',
  })
  slug: string;

  @IsString({ message: 'título deve ser um texto' })
  @IsNotEmpty({ message: 'título é obrigatório' })
  @Length(2, 128, { message: 'título deve ter entre 2 e 128 caracteres' })
  title: string;

  @Type(() => Number)
  @IsInt({ message: 'duração em segundos deve ser um número inteiro' })
  @Min(0, { message: 'duração não pode ser negativa' })
  seconds: number;

  @IsString({ message: 'vídeo deve ser um texto' })
  @IsNotEmpty({ message: 'vídeo é obrigatório' })
  video: string;

  @IsString({ message: 'descrição deve ser um texto' })
  @IsNotEmpty({ message: 'descrição é obrigatória' })
  description: string;

  @Type(() => Number)
  @IsInt({ message: 'ordem deve ser um número inteiro' })
  @Min(1, { message: 'ordem deve ser pelo menos 1' })
  order: number;

  @Type(() => Number)
  @IsIn([0, 1], { message: 'free deve ser 0 ou 1' })
  free: number;
}
