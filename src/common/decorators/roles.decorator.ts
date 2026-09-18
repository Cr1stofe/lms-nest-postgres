import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../modules/auth/services/session.service.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (UserRole | string)[]) =>
  SetMetadata(
    ROLES_KEY,
    roles.map((r) => r.toLowerCase()),
  );
