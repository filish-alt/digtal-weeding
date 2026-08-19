import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the tenantId from the authenticated user attached to the request.
 * Usage: @CurrentTenant() tenantId: string
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenantId;
  },
);
