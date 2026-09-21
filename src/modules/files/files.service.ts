import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { Request, Response } from 'express';
import { FILES_PATH } from '../../common/config/env.js';
import {
  checkETag,
  cropImage,
  LimitBytes,
  mimeType,
} from './utils/files.utils.js';

const MAX_BYTES = 150 * 1024 * 1024; // 150MB

@Injectable()
export class FilesService {
  async servePublicFile(
    name: string,
    reqIfNoneMatch: string | undefined,
    res: Response,
  ): Promise<void> {
    const filePath = path.join(FILES_PATH, 'public', name);
    const ext = path.extname(name);

    let st;
    try {
      st = await stat(filePath);
    } catch {
      throw new HttpException(
        { title: 'arquivo não encontrado' },
        HttpStatus.NOT_FOUND,
      );
    }

    const etag = `W/${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}`;

    res.setHeader('ETag', etag);
    res.setHeader('Content-Length', st.size);
    res.setHeader('Last-Modified', st.mtime.toUTCString());
    res.setHeader('Content-Type', mimeType[ext] || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

    if (checkETag(reqIfNoneMatch, etag)) {
      res.status(HttpStatus.NOT_MODIFIED).end();
      return;
    }

    res.status(HttpStatus.OK);
    const fileStream = createReadStream(filePath);
    await pipeline(fileStream, res);
  }

  async processUpload(
    req: Request,
    rawFilename: string,
    visibilityHeader?: string,
  ): Promise<{ path: string; name: string }> {
    const visibility = visibilityHeader === 'public' ? 'public' : 'private';
    const targetDir = path.join(FILES_PATH, visibility);
    await mkdir(targetDir, { recursive: true });

    const now = Date.now();
    const ext = path.extname(rawFilename);
    const finalName = `${rawFilename.replace(ext, '')}-${now}${ext}`;
    const tempPath = path.join(targetDir, `${randomUUID()}.temp`);
    const writePath = path.join(targetDir, finalName);
    const writeStream = createWriteStream(tempPath, { flags: 'wx' });

    try {
      await pipeline(req, LimitBytes(MAX_BYTES), writeStream);
      await rename(tempPath, writePath);

      if (ext === '.jpg' || ext === '.jpeg') {
        try {
          await cropImage(writePath, 320, 200);
        } catch {
          // Fallback gracioso se vipsthumbnail não estiver presente no sistema operacional
        }
      }

      return { path: writePath, name: finalName };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        { title: 'erro ao processar upload' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await rm(tempPath, { force: true }).catch(() => {});
    }
  }
}
