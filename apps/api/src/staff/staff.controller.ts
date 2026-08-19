import {
  Body,
  Controller,
  Param,
  Post,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffLoginDto } from './dto/staff-login.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('events/:eventId/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  /**
   * Door Staff PIN exchange login: POST /events/:eventId/staff/login
   * Public endpoint for scanner PWA door stations.
   * (Staff creation and management has been moved to PlatformAdmin /platform/events/:eventId/staff)
   */
  @Public()
  @Post('login')
  login(@Param('eventId') eventId: string, @Body() dto: StaffLoginDto) {
    return this.staffService.login(eventId, dto);
  }
}
