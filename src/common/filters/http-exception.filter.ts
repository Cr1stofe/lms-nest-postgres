import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'error';
    let errors: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        title = body['title'] || body['message'] || 'error';
        if (body['errors']) {
          errors = body['errors'];
        }
      } else if (typeof res === 'string') {
        title = res;
      }
    } else if (exception instanceof Error) {
      console.error('Unhandled Error:', exception);
    }

    response.status(status);
    response.setHeader('content-type', 'application/problem+json');
    response.json({
      status,
      title,
      ...(errors ? { errors } : {}),
    });
  }
}
