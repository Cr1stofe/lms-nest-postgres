import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CompleteLessonDto {
  @Type(() => Number)
  @IsInt({ message: 'courseId deve ser um número inteiro' })
  @Min(1, { message: 'courseId inválido' })
  courseId: number;

  @Type(() => Number)
  @IsInt({ message: 'lessonId deve ser um número inteiro' })
  @Min(1, { message: 'lessonId inválido' })
  lessonId: number;
}
