import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Operation outcome message',
    example: 'usuário criado',
  })
  title: string;
}

export class SessionUserResponseDto {
  @ApiProperty({
    description: 'Unique numeric user ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'Henrique Barros',
  })
  name: string;

  @ApiProperty({
    description: 'Unique username handle',
    example: 'henrique',
  })
  username: string;

  @ApiProperty({
    description: 'User email address',
    example: 'student@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Access role assigned to the user',
    example: 'USER',
    enum: ['USER', 'ADMIN'],
  })
  role: string;

  @ApiProperty({
    description: 'Account creation timestamp (YYYY-MM-DD HH:mm:ss)',
    example: '2026-09-29 14:00:00',
  })
  created: string;
}

export class UserListItemDto {
  @ApiProperty({
    description: 'Unique numeric user ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'Henrique Barros',
  })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'student@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2026-09-29 14:00:00',
  })
  created: string;

  @ApiProperty({
    description: 'Total number of matched records in database',
    example: 25,
  })
  total: number;
}

export class UserSearchResponseDto {
  @ApiProperty({
    description: 'List of matched users for the current page',
    type: [UserListItemDto],
  })
  users: UserListItemDto[];

  @ApiProperty({
    description: 'Total matched records count across all pages',
    example: 25,
  })
  total: number;
}
