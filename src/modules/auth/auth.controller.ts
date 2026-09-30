import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiHeader,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  COOKIE_SID_KEY,
  SessionService,
  setSessionCookie,
  clearSessionCookie,
} from './services/session.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UpdatePasswordDto } from './dto/update-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { UsersQueryDto } from './dto/users-query.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { FRONTEND_URL } from '../../common/config/env.js';
import type { SessionData } from './services/session.service.js';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(AuthGuard, RolesGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Public()
  @Post('user')
  @ApiOperation({ summary: 'Cadastro de novos usuários/alunos' })
  @ApiResponse({ status: 201, description: 'Usuário cadastrado com sucesso' })
  @ApiResponse({ status: 409, description: 'Email ou username já cadastrado' })
  @ApiResponse({ status: 422, description: 'Erro de validação dos campos' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticação e emissão de cookie de sessão' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido com cookie __Secure-sid emitido' })
  @ApiResponse({ status: 401, description: 'Email ou senha incorretos' })
  @ApiResponse({ status: 422, description: 'Erro de validação dos campos' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket?.remoteAddress || '';
    const ua = (req.headers['user-agent'] as string) || '';

    const { sid, maxAgeSec, title } = await this.authService.login(dto, ip, ua);

    setSessionCookie(res, sid, maxAgeSec);
    return { title };
  }

  @Public()
  @Delete('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Encerramento e invalidação de sessão' })
  @ApiResponse({ status: 204, description: 'Sessão destruída e cookie limpo' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sid = req.cookies?.[COOKIE_SID_KEY] || req.cookies?.['sid'];
    await this.sessionService.invalidate(sid);
    clearSessionCookie(res);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Cookie');
  }

  @Get('session')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Consulta os dados da sessão do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do perfil e papel (role) do usuário' })
  @ApiResponse({ status: 401, description: 'Sessão inválida ou não autenticada' })
  getSession(@CurrentUser() session: SessionData) {
    return {
      title: 'valida',
      role: session.role,
      name: session.name,
      username: session.username,
      email: session.email,
    };
  }

  @Put('password/update')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Atualização de senha do usuário logado' })
  @ApiResponse({ status: 200, description: 'Senha atualizada com renovação de sessão' })
  @ApiResponse({ status: 400, description: 'Senha atual incorreta' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @CurrentUser('user_id') userId: number,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket?.remoteAddress || '';
    const ua = (req.headers['user-agent'] as string) || '';

    const { sid, maxAgeSec, title } = await this.authService.updatePassword(
      userId,
      dto.password,
      dto.new_password,
      ip,
      ua,
    );

    setSessionCookie(res, sid, maxAgeSec);
    return { title };
  }

  @Public()
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitação de recuperação de senha por email' })
  @ApiResponse({ status: 200, description: 'Email de recuperação enviado (se a conta existir)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress || '';
    const ua = (req.headers['user-agent'] as string) || '';
    const origin =
      (req.headers['origin'] as string) ||
      (req.headers['referer']
        ? new URL(req.headers['referer']).origin
        : undefined);
    const baseUrl = process.env.FRONTEND_URL || origin || FRONTEND_URL;

    return this.authService.forgotPassword(dto.email, ip, ua, baseUrl);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinição de senha utilizando token criptográfico' })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.new_password);
  }

  @Roles('admin')
  @Get('users/search')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Busca paginada de usuários (Exclusivo Admin)' })
  @ApiHeader({ name: 'X-Total-Count', description: 'Total de registros encontrados' })
  @ApiResponse({ status: 200, description: 'Lista de usuários encontrados' })
  @ApiResponse({ status: 403, description: 'Acesso negado (requer papel de admin)' })
  async searchUsers(
    @Query() query: UsersQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { users, total } = await this.authService.searchUsers(
      query.s,
      query.page,
    );

    res.setHeader('X-Total-Count', String(total));
    return users;
  }
}

