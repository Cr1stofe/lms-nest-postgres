import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  Res,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
  ApiHeader,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { FilesService } from './files.service.js';
import { FileParamDto } from './dto/file-param.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

const MAX_BYTES = 150 * 1024 * 1024; // 150MB
const FILENAME_REGEX = /^(?!\.)[A-Za-z0-9._-]+$/;

@ApiTags('Files')
@Controller('files')
@UseGuards(AuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Public()
  @Get('public/:name')
  @ApiOperation({ summary: 'Serve public asset with ETag validation and HTTP 304 caching' })
  @ApiParam({ name: 'name', description: 'Public filename with extension', example: 'course-cover.jpg' })
  @ApiResponse({ status: 200, description: 'Binary asset stream with caching headers' })
  @ApiResponse({ status: 304, description: 'Not Modified (matches ETag conditional request)' })
  @ApiResponse({ status: 404, description: 'Public file not found' })
  async servePublic(
    @Param() params: FileParamDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.filesService.servePublicFile(
      params.name,
      req.headers['if-none-match'] as string | undefined,
      res,
    );
  }

  @Roles('user')
  @Get('private/:name')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Authorize and delegate private file streaming via X-Accel-Redirect (Caddy/Nginx)' })
  @ApiParam({ name: 'name', description: 'Private filename with extension', example: 'exclusive-guide.pdf' })
  @ApiResponse({ status: 200, description: 'Authorization granted with X-Accel-Redirect header' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  servePrivate(@Param() params: FileParamDto, @Res() res: Response) {
    res.setHeader('X-Accel-Redirect', params.name);
    res.status(HttpStatus.OK).end();
  }

  @Roles('admin')
  @Post('upload')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Stream binary file upload (Admin only, up to 150MB)' })
  @ApiConsumes('application/octet-stream')
  @ApiHeader({ name: 'x-filename', description: 'Original filename with extension', required: true, example: 'lesson-01-intro.mp4' })
  @ApiHeader({ name: 'x-visibility', description: 'File visibility target (public or private)', required: false, example: 'public' })
  @ApiBody({ description: 'Binary payload stream (application/octet-stream)', required: true })
  @ApiResponse({ status: 201, description: 'File uploaded and processed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)' })
  @ApiResponse({ status: 413, description: 'Payload too large (maximum 150MB exceeded)' })
  @ApiResponse({ status: 415, description: 'Unsupported Media Type (must be application/octet-stream)' })
  async upload(@Req() req: Request, @Res() res: Response) {
    const contentType = req.headers['content-type'];
    if (contentType !== 'application/octet-stream') {
      throw new HttpException(
        { title: 'use octet-stream' },
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }

    const contentLength = Number(req.headers['content-length']);
    if (!Number.isInteger(contentLength)) {
      throw new HttpException(
        { title: 'content-length inválido' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (contentLength > MAX_BYTES) {
      throw new HttpException(
        { title: 'corpo grande' },
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    const rawFilename = (req.headers['x-filename'] as string)?.trim();
    if (!rawFilename || !FILENAME_REGEX.test(rawFilename)) {
      throw new HttpException(
        { title: 'nome de arquivo inválido' },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const visibility = req.headers['x-visibility'] as string | undefined;
    const result = await this.filesService.processUpload(
      req,
      rawFilename,
      visibility,
    );

    res.status(HttpStatus.CREATED).json(result);
  }
}

