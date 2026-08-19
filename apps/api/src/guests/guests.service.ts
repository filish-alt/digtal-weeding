import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateGuestQrToken(): string {
    return randomBytes(32).toString('base64url');
  }

  async create(
    tenantId: string,
    eventId: string,
    invitationId: string,
    dto: CreateGuestDto,
  ) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, event: { id: eventId, tenantId } },
      include: {
        _count: {
          select: { guests: true },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (
      invitation.partySizeAllowed !== null &&
      invitation._count.guests >= invitation.partySizeAllowed
    ) {
      throw new BadRequestException(
        `Adding this guest exceeds the maximum party size allowed (${invitation.partySizeAllowed}) for this invitation`,
      );
    }

    return this.prisma.guest.create({
      data: {
        invitationId,
        fullName: dto.fullName,
        relationshipGroup: dto.relationshipGroup ?? null,
        needsPhysicalCard: dto.needsPhysicalCard ?? false,
        tableNumber: dto.tableNumber ?? null,
        guestQrToken: this.generateGuestQrToken(),
      },
    });
  }

  async findAllByInvitation(
    tenantId: string,
    eventId: string,
    invitationId: string,
  ) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, event: { id: eventId, tenantId } },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return this.prisma.guest.findMany({
      where: { invitationId },
      include: { checkin: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllByEvent(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.guest.findMany({
      where: {
        invitation: { eventId },
      },
      include: {
        invitation: {
          select: {
            id: true,
            primaryContactName: true,
          },
        },
        checkin: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    tenantId: string,
    eventId: string,
    invitationId: string,
    guestId: string,
    dto: UpdateGuestDto,
  ) {
    const guest = await this.prisma.guest.findFirst({
      where: {
        id: guestId,
        invitation: { id: invitationId, event: { id: eventId, tenantId } },
      },
    });

    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    return this.prisma.guest.update({
      where: { id: guestId },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.relationshipGroup !== undefined && {
          relationshipGroup: dto.relationshipGroup,
        }),
        ...(dto.needsPhysicalCard !== undefined && {
          needsPhysicalCard: dto.needsPhysicalCard,
        }),
        ...(dto.tableNumber !== undefined && { tableNumber: dto.tableNumber }),
      },
    });
  }

  async remove(
    tenantId: string,
    eventId: string,
    invitationId: string,
    guestId: string,
  ) {
    const guest = await this.prisma.guest.findFirst({
      where: {
        id: guestId,
        invitation: { id: invitationId, event: { id: eventId, tenantId } },
      },
    });

    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    return this.prisma.guest.delete({
      where: { id: guestId },
    });
  }
}
