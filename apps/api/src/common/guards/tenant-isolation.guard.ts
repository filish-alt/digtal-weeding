import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_TENANT_CHECK_KEY } from '../decorators/skip-tenant-check.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Global guard that ensures the requesting tenant can only access their own resources.
 *
 * For every protected route that includes :eventId or :invitationId params,
 * this guard looks up the resource's owning tenant_id and compares it against
 * the JWT's tenantId. Mismatches result in an immediate 403.
 *
 * Runs AFTER JwtAuthGuard in the guard chain (registered second in APP_GUARD order).
 */
@Injectable()
export class TenantIsolationGuard implements CanActivate {
  private readonly logger = new Logger(TenantIsolationGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip for @Public() routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Skip for @SkipTenantCheck() routes
    const skipTenantCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipTenantCheck) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user is attached (unauthenticated), let the auth guard handle it
    if (!user?.tenantId) return true;

    const tenantId: string = user.tenantId;
    const params = request.params;

    // ── Check :invitationId → traverse Invitation → Event → tenantId ──
    if (params.invitationId) {
      const invitation = await this.prisma.invitation.findUnique({
        where: { id: params.invitationId },
        select: { event: { select: { tenantId: true } } },
      });

      if (!invitation) {
        // Let the service layer handle 404
        return true;
      }

      if (invitation.event.tenantId !== tenantId) {
        this.logger.warn(
          `Tenant ${tenantId} attempted to access invitation ${params.invitationId} belonging to tenant ${invitation.event.tenantId}`,
        );
        throw new ForbiddenException(
          'Access denied: resource belongs to a different tenant',
        );
      }
    }

    // ── Check :eventId → Event.tenantId ──
    if (params.eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: params.eventId },
        select: { tenantId: true },
      });

      if (!event) {
        // Let the service layer handle 404
        return true;
      }

      if (event.tenantId !== tenantId) {
        this.logger.warn(
          `Tenant ${tenantId} attempted to access event ${params.eventId} belonging to tenant ${event.tenantId}`,
        );
        throw new ForbiddenException(
          'Access denied: resource belongs to a different tenant',
        );
      }
    }

    // ── Check :guestId → Guest → Invitation → Event → tenantId ──
    if (params.guestId) {
      const guest = await this.prisma.guest.findUnique({
        where: { id: params.guestId },
        select: { invitation: { select: { event: { select: { tenantId: true } } } } },
      });

      if (!guest) {
        // Let the service layer handle 404
        return true;
      }

      if (guest.invitation.event.tenantId !== tenantId) {
        this.logger.warn(
          `Tenant ${tenantId} attempted to access guest ${params.guestId} belonging to tenant ${guest.invitation.event.tenantId}`,
        );
        throw new ForbiddenException(
          'Access denied: resource belongs to a different tenant',
        );
      }
    }

    return true;
  }
}
