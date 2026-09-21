import { Transform } from 'node:stream';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { rename } from 'node:fs/promises';
import { HttpException, HttpStatus } from '@nestjs/common';

export const mimeType: Record<string, string> = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
};

export function checkETag(match: string | undefined, etag: string): boolean {
  if (!match) return false;
  const tags = match.split(',').map((s) => s.trim());
  return tags.includes(etag);
}

export function LimitBytes(max: number): Transform {
  let size = 0;
  return new Transform({
    transform(chunk: Buffer, _enc, next) {
      size += chunk.length;
      if (size > max) {
        return next(
          new HttpException(
            { title: 'corpo grande' },
            HttpStatus.PAYLOAD_TOO_LARGE,
          ),
        );
      }
      next(null, chunk);
    },
  });
}

export async function cropImage(
  input: string,
  width: number,
  height: number,
): Promise<void> {
  try {
    const ext = path.extname(input);
    const output = input.replace(ext, `.temp${ext}`);
    const command = 'vipsthumbnail';
    const args = [input, '-s', `${width}x${height}`, '--crop', '-o', output];
    const child = spawn(command, args);
    await once(child, 'close');
    await rename(output, input);
  } catch {
    throw new HttpException(
      { title: 'erro ao cortar imagem' },
      HttpStatus.BAD_REQUEST,
    );
  }
}
