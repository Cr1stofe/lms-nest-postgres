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
import type { SessionData } from './services/session.service.js';

@Controller('auth')
@UseGuards(AuthGuard, RolesGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Public()
  @Post('user')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
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
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sid = req.cookies?.[COOKIE_SID_KEY] || req.cookies?.['sid'];
    await this.sessionService.invalidate(sid);
    clearSessionCookie(res);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Cookie');
  }

  @Get('session')
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
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress || '';
    const ua = (req.headers['user-agent'] as string) || '';
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return this.authService.forgotPassword(dto.email, ip, ua, baseUrl);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.new_password);
  }

  @Roles('admin')
  @Get('users/search')
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
