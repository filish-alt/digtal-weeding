import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { InvitationsService } from './invitations.service';

@Public()
@Controller('rsvp')
export class RsvpController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get(':inviteLinkToken')
  getByToken(@Param('inviteLinkToken') inviteLinkToken: string) {
    return this.invitationsService.getByToken(inviteLinkToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':inviteLinkToken')
  submitRsvp(
    @Param('inviteLinkToken') inviteLinkToken: string,
    @Body() body: any,
  ) {
    const items = Array.isArray(body)
      ? body
      : Array.isArray(body?.rsvp)
      ? body.rsvp
      : [];
    return this.invitationsService.submitRsvp(inviteLinkToken, items);
  }
}
