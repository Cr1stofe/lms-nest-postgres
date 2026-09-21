import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class CourseUpsertDto {
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

  @IsString({ message: 'descrição deve ser um texto' })
  @IsNotEmpty({ message: 'descrição é obrigatória' })
  description: string;

  @Type(() => Number)
  @IsInt({ message: 'quantidade de aulas deve ser um número inteiro' })
  @Min(0, { message: 'quantidade de aulas não pode ser negativa' })
  lessons: number;

  @Type(() => Number)
  @IsInt({ message: 'carga horária deve ser um número inteiro' })
  @Min(0, { message: 'carga horária não pode ser negativa' })
  hours: number;
}
