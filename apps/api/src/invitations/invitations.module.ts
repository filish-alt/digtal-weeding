import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { RsvpController } from './rsvp.controller';

@Module({
  controllers: [InvitationsController, RsvpController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
