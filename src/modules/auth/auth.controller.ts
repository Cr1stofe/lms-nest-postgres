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
import {
  MessageResponseDto,
  SessionUserResponseDto,
  UserListItemDto,
} from './dto/auth-response.dto.js';
import {
  BadRequestErrorDto,
  ConflictErrorDto,
  ForbiddenErrorDto,
  UnauthorizedErrorDto,
  ValidationErrorDto,
} from '../../common/dto/problem-details.dto.js';
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
  @ApiOperation({ summary: 'Register a new student account' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: MessageResponseDto })
  @ApiResponse({ status: 409, description: 'Email or username already in use', type: ConflictErrorDto })
  @ApiResponse({ status: 422, description: 'Validation failed on input payload', type: ValidationErrorDto })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and issue session cookie' })
  @ApiResponse({ status: 200, description: 'Authenticated successfully with __Secure-sid cookie', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid email or password', type: UnauthorizedErrorDto })
  @ApiResponse({ status: 422, description: 'Validation failed on input payload', type: ValidationErrorDto })
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
  @ApiOperation({ summary: 'Terminate active session and clear cookie' })
  @ApiResponse({ status: 204, description: 'Session destroyed and cookie cleared' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sid = req.cookies?.[COOKIE_SID_KEY] || req.cookies?.['sid'];
    await this.sessionService.invalidate(sid);
    clearSessionCookie(res);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Cookie');
  }

  @Get('session')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Get profile and role of authenticated user' })
  @ApiResponse({ status: 200, description: 'Current session user profile data', type: SessionUserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid session', type: UnauthorizedErrorDto })
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
  @ApiOperation({ summary: 'Update password for authenticated user' })
  @ApiResponse({ status: 200, description: 'Password updated and session renewed', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Current password is incorrect', type: BadRequestErrorDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiResponse({ status: 422, description: 'Validation failed on input payload', type: ValidationErrorDto })
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
  @ApiOperation({ summary: 'Request password reset link via email' })
  @ApiResponse({ status: 200, description: 'Password reset email dispatched if account exists', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Error sending email', type: BadRequestErrorDto })
  @ApiResponse({ status: 422, description: 'Validation failed on input payload', type: ValidationErrorDto })
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
  @ApiOperation({ summary: 'Reset account password using secure token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token', type: BadRequestErrorDto })
  @ApiResponse({ status: 422, description: 'Validation failed on input payload', type: ValidationErrorDto })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.new_password);
  }

  @Roles('admin')
  @Get('users/search')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Search users directory with pagination (Admin only)' })
  @ApiHeader({ name: 'X-Total-Count', description: 'Total matched records count header' })
  @ApiResponse({ status: 200, description: 'Paginated user list', type: [UserListItemDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiResponse({ status: 403, description: 'Forbidden: requires admin role', type: ForbiddenErrorDto })
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

