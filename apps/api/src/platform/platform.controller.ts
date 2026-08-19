import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PlatformService } from './platform.service';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard';
import { CreateEventStaffDto } from './dto/create-event-staff.dto';
import { SkipTenantCheck } from '../common/decorators/skip-tenant-check.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('platform')
@Public() // Bypasses the default tenant JwtAuthGuard so PlatformAdminGuard exclusively handles auth
@UseGuards(PlatformAdminGuard)
@SkipTenantCheck()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  /**
   * GET /platform/tenants?status=pending — List all tenants or filter by status
   */
  @Get('tenants')
  async listTenants(@Query('status') status?: string) {
    return this.platformService.listTenants(status);
  }

  /**
   * POST /platform/tenants/:id/approve — Sets status='active', approved_at=now(), approved_by=adminId
   */
  @Post('tenants/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveTenant(@Param('id') id: string, @Req() req: any) {
    return this.platformService.approveTenant(id, req.user.userId);
  }

  /**
   * POST /platform/tenants/:id/suspend — Sets status='suspended'
   */
  @Post('tenants/:id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendTenant(@Param('id') id: string) {
    return this.platformService.suspendTenant(id);
  }

  /**
   * GET /platform/events — List all events across all tenants
   */
  @Get('events')
  async listEvents() {
    return this.platformService.listAllEvents();
  }

  /**
   * POST /platform/events/:eventId/staff — Create a staff account for an event
   */
  @Post('events/:eventId/staff')
  @HttpCode(HttpStatus.CREATED)
  async createEventStaff(
    @Param('eventId') eventId: string,
    @Body() dto: CreateEventStaffDto,
  ) {
    return this.platformService.createEventStaff(eventId, dto);
  }

  /**
   * GET /platform/events/:eventId/staff — List all staff accounts for an event
   */
  @Get('events/:eventId/staff')
  async listEventStaff(@Param('eventId') eventId: string) {
    return this.platformService.listEventStaff(eventId);
  }

  /**
   * DELETE /platform/events/:eventId/staff/:staffId — Revoke a staff account
   */
  @Delete('events/:eventId/staff/:staffId')
  @HttpCode(HttpStatus.OK)
  async revokeEventStaff(
    @Param('eventId') eventId: string,
    @Param('staffId') staffId: string,
  ) {
    return this.platformService.revokeEventStaff(eventId, staffId);
  }
}
