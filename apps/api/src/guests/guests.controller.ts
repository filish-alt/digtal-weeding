import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';

@Controller('events/:eventId')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post('invitations/:invitationId/guests')
  create(
    @Req() req: any,
    @Param('eventId') eventId: string,
    @Param('invitationId') invitationId: string,
    @Body() dto: CreateGuestDto,
  ) {
    return this.guestsService.create(
      req.user.tenantId,
      eventId,
      invitationId,
      dto,
    );
  }

  @Get('invitations/:invitationId/guests')
  findAllByInvitation(
    @Req() req: any,
    @Param('eventId') eventId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.guestsService.findAllByInvitation(
      req.user.tenantId,
      eventId,
      invitationId,
    );
  }

  @Get('guests')
  findAllByEvent(@Req() req: any, @Param('eventId') eventId: string) {
    return this.guestsService.findAllByEvent(req.user.tenantId, eventId);
  }

  @Patch('invitations/:invitationId/guests/:guestId')
  update(
    @Req() req: any,
    @Param('eventId') eventId: string,
    @Param('invitationId') invitationId: string,
    @Param('guestId') guestId: string,
    @Body() dto: UpdateGuestDto,
  ) {
    return this.guestsService.update(
      req.user.tenantId,
      eventId,
      invitationId,
      guestId,
      dto,
    );
  }

  @Delete('invitations/:invitationId/guests/:guestId')
  remove(
    @Req() req: any,
    @Param('eventId') eventId: string,
    @Param('invitationId') invitationId: string,
    @Param('guestId') guestId: string,
  ) {
    return this.guestsService.remove(
      req.user.tenantId,
      eventId,
      invitationId,
      guestId,
    );
  }
}
