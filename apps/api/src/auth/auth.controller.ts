import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { PlatformLoginDto } from './dto/platform-login.dto';
import { Public } from '../common/decorators/public.decorator';

import { StaffService } from '../staff/staff.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly staffService: StaffService,
  ) {}

  /**
   * Tenant Signup: POST /auth/tenant/signup (and alias POST /auth/signup)
   */
  @Public()
  @Post('tenant/signup')
  async tenantSignup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  /**
   * Tenant Login: POST /auth/tenant/login (and alias POST /auth/login)
   */
  @Public()
  @Post('tenant/login')
  @HttpCode(HttpStatus.OK)
  async tenantLogin(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Platform Admin Login: POST /auth/platform/login
   */
  @Public()
  @Post('platform/login')
  @HttpCode(HttpStatus.OK)
  async platformLogin(@Body() dto: PlatformLoginDto) {
    return this.authService.platformLogin(dto);
  }

  /**
   * Door Staff PIN exchange login: POST /auth/staff/login
   */
  @Public()
  @Post('staff/login')
  @HttpCode(HttpStatus.OK)
  async staffLogin(
    @Body() dto: { eventId: string; pinCode: string; stationId: string },
  ) {
    return this.staffService.login(dto.eventId, {
      pinCode: dto.pinCode,
      stationId: dto.stationId,
    });
  }
}


