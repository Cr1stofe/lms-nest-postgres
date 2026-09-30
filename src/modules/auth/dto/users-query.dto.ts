import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UsersQueryDto {
  @ApiPropertyOptional({
    description: 'Termo de busca por nome, username ou email',
    example: 'henrique',
  })
  @IsOptional()
  @IsString()
  s?: string;

  @ApiPropertyOptional({
    description: 'Número da página para paginação (padrão: 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
}

