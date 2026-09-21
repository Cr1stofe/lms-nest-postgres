import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FilesService } from './files.service.js';
import { FileParamDto } from './dto/file-param.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

const MAX_BYTES = 150 * 1024 * 1024; // 150MB
const FILENAME_REGEX = /^(?!\.)[A-Za-z0-9._-]+$/;

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Public()
  @Get('public/:name')
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
  servePrivate(@Param() params: FileParamDto, @Res() res: Response) {
    res.setHeader('X-Accel-Redirect', params.name);
    res.status(HttpStatus.OK).end();
  }

  @Roles('admin')
  @Post('upload')
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
