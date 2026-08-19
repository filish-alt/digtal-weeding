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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(tenantId, dto);
  }

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.eventsService.findAll(tenantId);
  }

  @Get(':eventId')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.eventsService.findOne(tenantId, eventId);
  }

  @Patch(':eventId')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(tenantId, eventId, dto);
  }

  @Delete(':eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('eventId') eventId: string,
  ) {
    await this.eventsService.remove(tenantId, eventId);
  }
}
