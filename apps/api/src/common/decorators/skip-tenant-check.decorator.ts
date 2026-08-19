import { SetMetadata } from '@nestjs/common';

export const SKIP_TENANT_CHECK_KEY = 'skipTenantCheck';

/**
 * Skips the tenant-isolation guard on a route while still requiring JWT auth.
 * Use for endpoints that don't operate on tenant-scoped resources (e.g. profile).
 */
export const SkipTenantCheck = () =>
  SetMetadata(SKIP_TENANT_CHECK_KEY, true);
