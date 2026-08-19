import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a 256-bit cryptographically random, URL-safe token.
   */
  private generateInviteLinkToken(): string {
    return randomBytes(32).toString('base64url');
  }

  async create(tenantId: string, eventId: string, dto: CreateInvitationDto) {
    // Verify event belongs to tenant (defense-in-depth, guard already checked)
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.invitation.create({
      data: {
        eventId,
        primaryContactName: dto.primaryContactName,
        phone: dto.phone,
        deliveryChannel: dto.deliveryChannel,
        inviteLinkToken: this.generateInviteLinkToken(),
        partySizeAllowed: dto.partySizeAllowed ?? null,
      },
    });
  }

  async findAll(tenantId: string, eventId: string) {
    // Verify event ownership
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const invitations = await this.prisma.invitation.findMany({
      where: { eventId },
      include: {
        _count: {
          select: { guests: true },
        },
        guests: {
          where: { isAttending: true },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to include the computed partySizeConfirmed
    return invitations.map((inv) => {
      const { guests, ...rest } = inv;
      return {
        ...rest,
        partySizeConfirmed: guests.length,
      };
    });
  }

  async findOne(tenantId: string, eventId: string, invitationId: string) {
    // Verify event ownership
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, eventId },
      include: {
        guests: true,
        _count: {
          select: { guests: true },
        },
      },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Compute partySizeConfirmed
    const partySizeConfirmed = invitation.guests.filter(
      (g) => g.isAttending === true,
    ).length;

    return {
      ...invitation,
      partySizeConfirmed,
    };
  }

  async update(
    tenantId: string,
    eventId: string,
    invitationId: string,
    dto: UpdateInvitationDto,
  ) {
    // Verify event + invitation ownership
    await this.findOne(tenantId, eventId, invitationId);

    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: {
        ...(dto.primaryContactName !== undefined && {
          primaryContactName: dto.primaryContactName,
        }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.deliveryChannel !== undefined && {
          deliveryChannel: dto.deliveryChannel,
        }),
        ...(dto.partySizeAllowed !== undefined && {
          partySizeAllowed: dto.partySizeAllowed,
        }),
      },
    });
  }

  async remove(tenantId: string, eventId: string, invitationId: string) {
    await this.findOne(tenantId, eventId, invitationId);

    return this.prisma.invitation.delete({
      where: { id: invitationId },
    });
  }

  async getByToken(inviteLinkToken: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { inviteLinkToken },
      include: {
        event: {
          select: {
            coupleNames: true,
            eventDate: true,
            venue: true,
            timezone: true,
            photoUrl: true,
            verse: true,
          },
        },
        guests: {
          select: {
            id: true,
            fullName: true,
            relationshipGroup: true,
            needsPhysicalCard: true,
            isAttending: true,
            respondedAt: true,
            tableNumber: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }

  async submitRsvp(
    inviteLinkToken: string,
    rsvpItems: { guestId: string; isAttending: boolean }[],
  ) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { inviteLinkToken },
      include: { guests: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const validGuestIds = new Set(invitation.guests.map((g) => g.id));
    const now = new Date();

    for (const item of rsvpItems) {
      if (!validGuestIds.has(item.guestId)) {
        throw new NotFoundException(
          `Guest ${item.guestId} does not belong to this invitation`,
        );
      }
    }

    await this.prisma.$transaction(
      rsvpItems.map((item) =>
        this.prisma.guest.update({
          where: { id: item.guestId },
          data: {
            isAttending: item.isAttending,
            respondedAt: now,
          },
        }),
      ),
    );

    return this.getByToken(inviteLinkToken);
  }
}
