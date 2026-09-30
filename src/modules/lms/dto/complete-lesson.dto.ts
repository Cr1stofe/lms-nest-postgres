import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteLessonDto {
  @ApiProperty({
    description: 'ID numérico do curso',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'courseId deve ser um número inteiro' })
  @Min(1, { message: 'courseId inválido' })
  courseId: number;

  @ApiProperty({
    description: 'ID numérico da aula a ser concluída',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'lessonId deve ser um número inteiro' })
  @Min(1, { message: 'lessonId inválido' })
  lessonId: number;
}

