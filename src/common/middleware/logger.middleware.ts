import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const url = req.originalUrl || req.url;
      console.log(`${req.method} ${url} ${res.statusCode} - ${duration}ms`);
    });
    next();
  }
}
