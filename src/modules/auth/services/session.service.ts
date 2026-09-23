import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { generateToken, sha256 } from '../../../common/security/tokens.js';
import { NODE_ENV } from '../../../common/config/env.js';

export const COOKIE_SID_KEY = '__Secure-sid';
export const SESSION_TTL_SEC = 60 * 60 * 24 * 15; // 15 dias
const SESSION_REFRESH_THRESHOLD_SEC = 60 * 60 * 24 * 5; // 5 dias
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutos

export type UserRole = 'admin' | 'editor' | 'user';

export interface SessionData {
  user_id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  expires_ms: number;
}

export function setSessionCookie(
  res: Response,
  sid: string,
  maxAgeSec: number,
) {
  res.cookie(COOKIE_SID_KEY, sid, {
    maxAge: maxAgeSec * 1000,
    httpOnly: true,
    secure: NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_SID_KEY, {
    httpOnly: true,
    secure: NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
  });
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create({
    userId,
    ip,
    ua,
  }: {
    userId: number;
    ip: string;
    ua: string;
  }): Promise<{ sid: string; maxAgeSec: number }> {
    const sid = await generateToken(32);
    const sidHash = new Uint8Array(sha256(sid));
    const expiresDate = new Date(Date.now() + SESSION_TTL_SEC * 1000);

    await this.prisma.session.create({
      data: {
        sidHash,
        userId,
        expires: expiresDate,
        ip,
        ua,
      },
    });

    return { sid, maxAgeSec: SESSION_TTL_SEC };
  }

  async validate(sid: string): Promise<{
    valid: boolean;
    sid?: string;
    maxAgeSec?: number;
    session?: SessionData;
  }> {
    const now = new Date();
    const sidHash = new Uint8Array(sha256(sid));

    const session = await this.prisma.session.findUnique({
      where: { sidHash },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });

    if (!session || session.revoked || !session.user) {
      return { valid: false };
    }

    let expiresDate = session.expires;

    if (now >= expiresDate) {
      await this.prisma.session.update({
        where: { sidHash },
        data: { revoked: true },
      });
      return { valid: false };
    }

    // Se faltar menos de 5 dias para expirar, estende por mais 15 dias
    if (
      now.getTime() >=
      expiresDate.getTime() - SESSION_REFRESH_THRESHOLD_SEC * 1000
    ) {
      const newExpires = new Date(Date.now() + SESSION_TTL_SEC * 1000);
      await this.prisma.session.update({
        where: { sidHash },
        data: { expires: newExpires },
      });
      expiresDate = newExpires;
    }

    return {
      valid: true,
      sid,
      maxAgeSec: Math.floor((expiresDate.getTime() - now.getTime()) / 1000),
      session: {
        user_id: session.userId,
        name: session.user.name,
        username: session.user.username,
        email: session.user.email,
        role: session.user.role.toLowerCase() as UserRole,
        expires_ms: expiresDate.getTime(),
      },
    };
  }

  async invalidate(sid: string | undefined): Promise<void> {
    if (sid) {
      try {
        const sidHash = new Uint8Array(sha256(sid));
        await this.prisma.session.update({
          where: { sidHash },
          data: { revoked: true },
        });
      } catch {
        // Ignora caso a sessão já não exista
      }
    }
  }

  async invalidateAll(userId: number): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }

  async resetToken({
    userId,
    ip,
    ua,
  }: {
    userId: number;
    ip: string;
    ua: string;
  }): Promise<{ token: string }> {
    const token = await generateToken(32);
    const tokenHash = new Uint8Array(sha256(token));
    const expiresDate = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.prisma.passwordReset.create({
      data: {
        tokenHash,
        userId,
        expires: expiresDate,
        ip,
        ua,
      },
    });

    return { token };
  }

  async validateToken(token: string): Promise<{ user_id: number } | null> {
    const now = new Date();
    const tokenHash = new Uint8Array(sha256(token));

    const reset = await this.prisma.passwordReset.findUnique({
      where: { tokenHash },
    });

    if (!reset || now > reset.expires) {
      return null;
    }

    await this.invalidateAll(reset.userId);
    await this.prisma.passwordReset.delete({
      where: { tokenHash },
    });

    return { user_id: reset.userId };
  }
}
