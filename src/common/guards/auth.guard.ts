import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import {
  COOKIE_SID_KEY,
  SessionService,
  setSessionCookie,
} from '../../modules/auth/services/session.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const sid =
      request.cookies?.[COOKIE_SID_KEY] ||
      request.cookies?.['sid'] ||
      (request.headers['authorization']?.startsWith('Bearer ')
        ? request.headers['authorization'].slice(7)
        : undefined);

    if (!sid) {
      if (isPublic) {
        return true;
      }
      throw new HttpException({ title: 'não autorizado' }, HttpStatus.UNAUTHORIZED);
    }

    const { valid, maxAgeSec, session } = await this.sessionService.validate(sid);

    if (!valid || !session) {
      if (isPublic) {
        return true;
      }
      throw new HttpException({ title: 'não autorizado' }, HttpStatus.UNAUTHORIZED);
    }

    // Se houve renovação de sessão, atualiza o cookie
    if (maxAgeSec) {
      setSessionCookie(response, sid, maxAgeSec);
    }

    // Injeta na request
    (request as any).session = session;
    (request as any).user = { id: session.user_id, role: session.role };

    return true;
  }
}
