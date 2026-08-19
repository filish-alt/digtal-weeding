import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * PlatformAdminGuard ensures that the request is authenticated with
 * a dedicated platform-admin JWT token (type === 'platform_admin').
 *
 * This guard is completely independent from TenantIsolationGuard
 * and does not extend or reuse tenant guards.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Bearer token not provided');
    }

    try {
      const secret = this.configService.getOrThrow<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      if (payload.type !== 'platform_admin') {
        throw new ForbiddenException('Platform administrator privileges required');
      }

      request.user = {
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
        role: 'platform_admin',
        type: 'platform_admin',
      };

      return true;
    } catch (err: any) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new UnauthorizedException(err.message || 'Invalid or expired platform-admin token');
    }
  }
}
