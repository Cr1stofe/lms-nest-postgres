import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { SessionData, UserRole } from '../../modules/auth/services/session.service.js';

const roleHierarchy: Record<UserRole, number> = {
  admin: 3,
  editor: 2,
  user: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const session = request.session as SessionData | undefined;

    if (!session) {
      throw new HttpException({ title: 'não autorizado' }, HttpStatus.UNAUTHORIZED);
    }

    const userLevel = roleHierarchy[session.role] ?? 0;
    const hasPermission = requiredRoles.some((requiredRole) => {
      const requiredLevel = roleHierarchy[requiredRole.toLowerCase() as UserRole] ?? 0;
      return userLevel >= requiredLevel;
    });

    if (!hasPermission) {
      throw new HttpException({ title: 'sem permissão' }, HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
