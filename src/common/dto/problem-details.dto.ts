import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  status: number;

  @ApiProperty({
    description: 'Error title or reason returned by the server',
    example: 'Bad Request',
  })
  title: string;
}

export class BadRequestErrorDto extends ErrorResponseDto {
  @ApiProperty({ example: 400 })
  declare status: number;

  @ApiProperty({ example: 'Bad Request' })
  declare title: string;
}

export class UnauthorizedErrorDto extends ErrorResponseDto {
  @ApiProperty({ example: 401 })
  declare status: number;

  @ApiProperty({ example: 'Unauthorized' })
  declare title: string;
}

export class ForbiddenErrorDto extends ErrorResponseDto {
  @ApiProperty({ example: 403 })
  declare status: number;

  @ApiProperty({ example: 'Forbidden' })
  declare title: string;
}

export class NotFoundErrorDto extends ErrorResponseDto {
  @ApiProperty({ example: 404 })
  declare status: number;

  @ApiProperty({ example: 'Resource not found' })
  declare title: string;
}

export class ConflictErrorDto extends ErrorResponseDto {
  @ApiProperty({ example: 409 })
  declare status: number;

  @ApiProperty({ example: 'Resource already exists' })
  declare title: string;
}

export class PayloadTooLargeErrorDto extends ErrorResponseDto {
  @ApiProperty({ example: 413 })
  declare status: number;

  @ApiProperty({ example: 'Payload too large' })
  declare title: string;
}

export class UnsupportedMediaTypeErrorDto extends ErrorResponseDto {
  @ApiProperty({ example: 415 })
  declare status: number;

  @ApiProperty({ example: 'Unsupported media type' })
  declare title: string;
}

export class ValidationErrorDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code for validation errors (Unprocessable Entity)',
    example: 422,
  })
  declare status: number;

  @ApiProperty({
    description: 'Summary of the validation error',
    example: 'Validation error',
  })
  declare title: string;

  @ApiPropertyOptional({
    description: 'Validation error messages grouped by input field name',
    example: {
      email: ['email must be a valid email address'],
      password: ['password must be at least 8 characters long'],
    },
  })
  errors?: Record<string, string[]>;
}
