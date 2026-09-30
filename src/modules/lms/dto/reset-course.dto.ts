import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetCourseDto {
  @ApiProperty({
    description: 'ID numérico do curso a ser resetado para o aluno',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'courseId deve ser um número inteiro' })
  @Min(1, { message: 'courseId inválido' })
  courseId: number;
}

