import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { PlatformLoginDto } from './dto/platform-login.dto';

export interface JwtPayload {
  sub: string;       // tenant id, platform admin id, or staff account id
  tenantId?: string;  // duplicated for clarity in tenant guards
  email?: string;
  name?: string;
  role: 'tenant_admin' | 'checkin_staff' | 'platform_admin';
  type?: 'tenant_admin' | 'checkin_staff' | 'platform_admin';
  staffAccountId?: string;
  eventId?: string;
  stationId?: string;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Tenant Signup: Creates a tenant with status: 'pending'.
   * Does NOT issue a JWT on signup.
   */
  async signup(dto: SignupDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { ownerEmail: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const tenant = await this.prisma.tenant.create({
      data: {
        ownerEmail: dto.email.toLowerCase().trim(),
        ownerName: dto.name.trim(),
        passwordHash,
        status: 'pending',
      },
    });

    return {
      message: 'Your registration has been received and is awaiting approval.',
      tenant: {
        id: tenant.id,
        ownerEmail: tenant.ownerEmail,
        ownerName: tenant.ownerName,
        status: tenant.status,
      },
    };
  }

  /**
   * Tenant Login: Verifies credentials and checks tenant.status.
   * If status is not 'active', rejects with a clear message.
   */
  async login(dto: LoginDto): Promise<{ access_token: string; tenant: any }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { ownerEmail: dto.email.toLowerCase().trim() },
    });
    if (!tenant) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, tenant.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check tenant approval status
    if (tenant.status === 'pending') {
      throw new ForbiddenException('Your account is awaiting approval');
    }
    if (tenant.status === 'suspended') {
      throw new ForbiddenException('Your account has been suspended');
    }
    if (tenant.status !== 'active') {
      throw new ForbiddenException('Your account is awaiting approval');
    }

    const token = this.generateTenantToken(tenant.id);
    return {
      access_token: token,
      tenant: {
        id: tenant.id,
        ownerEmail: tenant.ownerEmail,
        ownerName: tenant.ownerName,
        status: tenant.status,
      },
    };
  }

  /**
   * Platform Admin Login: Separate table, separate JWT payload.
   */
  async platformLogin(dto: PlatformLoginDto): Promise<{ access_token: string; admin: any }> {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'platform_admin',
      type: 'platform_admin',
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
  }

  private generateTenantToken(tenantId: string): string {
    const payload: JwtPayload = {
      sub: tenantId,
      tenantId,
      role: 'tenant_admin',
      type: 'tenant_admin',
    };
    return this.jwtService.sign(payload);
  }
}
