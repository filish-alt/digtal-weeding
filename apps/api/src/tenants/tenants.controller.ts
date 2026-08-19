import { Controller, Get } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { SkipTenantCheck } from '../common/decorators/skip-tenant-check.decorator';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * GET /tenants/me — returns the authenticated tenant's profile.
   * Skips tenant isolation check because this endpoint only returns
   * the current tenant's own data.
   */
  @Get('me')
  @SkipTenantCheck()
  async getProfile(@CurrentTenant() tenantId: string) {
    return this.tenantsService.findById(tenantId);
  }
}
