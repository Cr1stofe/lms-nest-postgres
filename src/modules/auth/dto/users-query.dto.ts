import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UsersQueryDto {
  @ApiPropertyOptional({
    description: 'Search term filtering by name, username, or email',
    example: 'henrique',
  })
  @IsOptional()
  @IsString()
  s?: string;

  @ApiPropertyOptional({
    description: 'Page index for paginated results (default: 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
}

