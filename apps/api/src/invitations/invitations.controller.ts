import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('events/:eventId/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Param('eventId') eventId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(tenantId, eventId, dto);
  }

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.invitationsService.findAll(tenantId, eventId);
  }

  @Get(':invitationId')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('eventId') eventId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.invitationsService.findOne(tenantId, eventId, invitationId);
  }

  @Patch(':invitationId')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('eventId') eventId: string,
    @Param('invitationId') invitationId: string,
    @Body() dto: UpdateInvitationDto,
  ) {
    return this.invitationsService.update(tenantId, eventId, invitationId, dto);
  }

  @Delete(':invitationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('eventId') eventId: string,
    @Param('invitationId') invitationId: string,
  ) {
    await this.invitationsService.remove(tenantId, eventId, invitationId);
  }
}
