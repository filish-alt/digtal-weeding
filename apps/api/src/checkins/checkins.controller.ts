import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Controller()
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Post('checkins')
  checkIn(@Req() req: any, @Body() dto: CreateCheckinDto) {
    return this.checkinsService.checkIn(req.user, dto);
  }

  @Get('checkins/lookup')
  lookup(@Req() req: any, @Query('q') q: string) {
    return this.checkinsService.lookupGuests(req.user, q);
  }

  @Get('events/:eventId/checkins')
  getEventCheckins(@Req() req: any, @Param('eventId') eventId: string) {
    return this.checkinsService.getEventCheckins(req.user, eventId);
  }
}
