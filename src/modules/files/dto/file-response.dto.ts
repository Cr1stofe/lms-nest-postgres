import { ApiProperty } from '@nestjs/swagger';

export class FileUploadResponseDto {
  @ApiProperty({
    description: 'Internal server path where file was saved',
    example: '/files/public/lesson-01-intro-1790775335606.mp4',
  })
  path: string;

  @ApiProperty({
    description: 'Unique generated filename on disk with timestamp',
    example: 'lesson-01-intro-1790775335606.mp4',
  })
  name: string;
}
