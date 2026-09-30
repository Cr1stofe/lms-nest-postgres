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
  @ApiOperation({ summary: 'Servir arquivo público com suporte a ETag e cache HTTP (304 Not Modified)' })
  @ApiParam({ name: 'name', description: 'Nome do arquivo público com extensão', example: 'thumbnail-curso.jpg' })
  @ApiResponse({ status: 200, description: 'Fluxo binário do arquivo com headers de cache' })
  @ApiResponse({ status: 304, description: 'Não modificado (se If-None-Match coincidir com ETag)' })
  @ApiResponse({ status: 404, description: 'Arquivo público não encontrado' })
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
  @ApiOperation({ summary: 'Acesso protegido a arquivos privados via X-Accel-Redirect (Caddy/Nginx)' })
  @ApiParam({ name: 'name', description: 'Nome do arquivo privado', example: 'apostila-exclusiva.pdf' })
  @ApiResponse({ status: 200, description: 'Autorização validada e header X-Accel-Redirect emitido' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  servePrivate(@Param() params: FileParamDto, @Res() res: Response) {
    res.setHeader('X-Accel-Redirect', params.name);
    res.status(HttpStatus.OK).end();
  }

  @Roles('admin')
  @Post('upload')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Upload de arquivo por streaming binário (Exclusivo Admin, até 150MB)' })
  @ApiConsumes('application/octet-stream')
  @ApiHeader({ name: 'x-filename', description: 'Nome original do arquivo com extensão', required: true, example: 'aula-01-intro.mp4' })
  @ApiHeader({ name: 'x-visibility', description: 'Visibilidade do arquivo (public ou private)', required: false, example: 'public' })
  @ApiBody({ description: 'Payload binário do arquivo (application/octet-stream)', required: true })
  @ApiResponse({ status: 201, description: 'Arquivo processado e salvo com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (requer papel de admin)' })
  @ApiResponse({ status: 413, description: 'Arquivo excede o limite máximo permitido de 150MB' })
  @ApiResponse({ status: 415, description: 'Content-Type inválido (deve ser application/octet-stream)' })
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

