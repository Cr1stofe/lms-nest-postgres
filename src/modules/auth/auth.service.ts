import {
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PasswordService } from '../../common/security/password.service.js';
import { MailService } from '../../common/mail/mail.service.js';
import { SessionService } from './services/session.service.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
  ) {}

  async register(data: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: data.email, mode: 'insensitive' } },
          { username: { equals: data.username, mode: 'insensitive' } },
        ],
      },
      select: { email: true, username: true },
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === data.email.toLowerCase()) {
        throw new HttpException({ title: 'email existe' }, HttpStatus.CONFLICT);
      }
      if (existingUser.username.toLowerCase() === data.username.toLowerCase()) {
        throw new HttpException({ title: 'username existe' }, HttpStatus.CONFLICT);
      }
    }

    const passwordHash = await this.passwordService.hash(data.password);

    await this.prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        passwordHash,
        role: 'USER',
      },
    });

    return { title: 'usuário criado' };
  }

  async login(
    { email, password }: LoginDto,
    ip: string,
    ua: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (!user) {
      throw new HttpException(
        { title: 'email ou senha incorretos' },
        HttpStatus.NOT_FOUND,
      );
    }

    const validPassword = await this.passwordService.verify(
      password,
      user.passwordHash,
    );
    if (!validPassword) {
      throw new HttpException(
        { title: 'email ou senha incorretos' },
        HttpStatus.NOT_FOUND,
      );
    }

    const { sid, maxAgeSec } = await this.sessionService.create({
      userId: user.id,
      ip,
      ua,
    });

    return { sid, maxAgeSec, title: 'autenticado' };
  }

  async updatePassword(
    userId: number,
    currentPass: string,
    newPass: string,
    ip: string,
    ua: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException(
        { title: 'usuário não encontrado' },
        HttpStatus.NOT_FOUND,
      );
    }

    const validPassword = await this.passwordService.verify(
      currentPass,
      user.passwordHash,
    );
    if (!validPassword) {
      throw new HttpException(
        { title: 'senha atual incorreta' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const newPasswordHash = await this.passwordService.hash(newPass);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    await this.sessionService.invalidateAll(user.id);

    const { sid, maxAgeSec } = await this.sessionService.create({
      userId: user.id,
      ip,
      ua,
    });

    return { sid, maxAgeSec, title: 'senha atualizada' };
  }

  async forgotPassword(
    email: string,
    ip: string,
    ua: string,
    baseUrl: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (!user) {
      return { title: 'verifique seu email' };
    }

    const { token } = await this.sessionService.resetToken({
      userId: user.id,
      ip,
      ua,
    });

    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const resetLink = `${cleanBaseUrl}/resetar-senha?token=${token}`;

    const mailContent = {
      to: user.email,
      subject: 'Resetar Senha',
      body: `
      <h1 style="font-size: 1.25rem; font-family: sans-serif;">
        Olá, ${user.name || user.email}
      </h1>
      <p style="font-size: 1rem; font-family: sans-serif;">
        você solicitou a redefinição da sua senha:
      </p>
      <a style="padding: .5rem 1rem; background: black; color: white; text-decoration: none; border-radius: 4px; font-family: sans-serif;" href="${resetLink}">
        Resetar Senha
      </a>
      <p style="color: #555; margin-top: 2rem; font-family: sans-serif;">
        Se você não solicitou a redefinição, ignore este e-mail.
      </p>`,
    };

    const { ok } = await this.mailService.send(mailContent);
    if (!ok) {
      throw new HttpException(
        { title: 'erro ao enviar email' },
        HttpStatus.BAD_REQUEST,
      );
    }

    return { title: 'verifique seu email' };
  }

  async resetPassword(token: string, newPass: string) {
    const reset = await this.sessionService.validateToken(token);
    if (!reset) {
      throw new HttpException(
        { title: 'token inválido' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const newPasswordHash = await this.passwordService.hash(newPass);

    await this.prisma.user.update({
      where: { id: reset.user_id },
      data: { passwordHash: newPasswordHash },
    });

    return { title: 'senha atualizada' };
  }

  async searchUsers(search?: string, page = 1) {
    const limit = 5;
    const offset = (page - 1) * limit;

    const searchTerm = search?.trim();

    const whereClause = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' as const } },
            { email: { contains: searchTerm, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          created: true,
        },
        orderBy: { created: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    return {
      users: users.map((u) => ({
        ...u,
        created: u.created.toISOString().replace('T', ' ').substring(0, 19),
        total,
      })),
      total,
    };
  }
}
