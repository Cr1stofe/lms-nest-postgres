import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ResetCourseDto {
  @Type(() => Number)
  @IsInt({ message: 'courseId deve ser um número inteiro' })
  @Min(1, { message: 'courseId inválido' })
  courseId: number;
}
