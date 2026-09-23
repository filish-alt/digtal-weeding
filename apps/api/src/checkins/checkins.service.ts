import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Injectable()
export class CheckinsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(user: any, dto: CreateCheckinDto) {
    let guest = await this.prisma.guest.findUnique({
      where: { guestQrToken: dto.guestQrToken },
      include: {
        checkin: true,
        invitation: {
          include: {
            event: true,
          },
        },
      },
    });

    // If not found by exact token, search by unique code, guest ID prefix, or name
    if (!guest) {
      const raw = dto.guestQrToken.trim();
      const cleanCode = raw.replace(/^INV-|^PASS-|^#/i, '').toLowerCase();
      
      guest = await this.prisma.guest.findFirst({
        where: {
          ...(user.role === 'checkin_staff' && { invitation: { eventId: user.eventId } }),
          OR: [
            { id: raw.toLowerCase() },
            { id: { startsWith: cleanCode } },
            { guestQrToken: { startsWith: cleanCode } },
            { invitation: { id: { startsWith: cleanCode } } },
            { invitation: { inviteLinkToken: raw } },
            { fullName: { equals: raw, mode: 'insensitive' } },
            { invitation: { primaryContactName: { equals: raw, mode: 'insensitive' } } },
          ],
        },
        include: {
          checkin: true,
          invitation: {
            include: {
              event: true,
            },
          },
        },
      });
    }

    if (!guest) {
      throw new NotFoundException('Invalid guest QR token or invitation passcode');
    }

    // Staff event-scoping check
    if (user.role === 'checkin_staff') {
      if (user.eventId !== guest.invitation.eventId) {
        throw new ForbiddenException('Staff token is not authorized for this event');
      }
    }

    // Duplicate check-in check
    if (guest.checkin) {
      const formattedTime = guest.checkin.checkedInAt.toISOString();
      const station = guest.checkin.stationId || guest.checkin.checkedInBy || 'station';
      throw new ConflictException(
        `Guest (${guest.fullName}) already checked in at ${formattedTime} by ${station}`,
      );
    }

    const stationId = dto.stationId || user.stationId || 'door-station';
    const checkedInBy = user.staffAccountId || user.userId || 'admin';

    const checkin = await this.prisma.checkin.create({
      data: {
        guestId: guest.id,
        stationId,
        checkedInBy,
      },
      include: {
        guest: {
          select: {
            id: true,
            fullName: true,
            relationshipGroup: true,
            tableNumber: true,
            isAttending: true,
          },
        },
      },
    });

    const wasRsvpd = guest.isAttending === true;
    const warning = !wasRsvpd
      ? 'Guest had not confirmed RSVP before check-in'
      : undefined;

    return {
      checkin,
      wasRsvpd,
      ...(warning && { warning }),
    };
  }

  async lookupGuests(user: any, query: string) {
    if (!query || !query.trim()) return [];

    const raw = query.trim();
    const cleanCode = raw.replace(/^INV-|^PASS-|^#/i, '').toLowerCase();
    const eventId = user.role === 'checkin_staff' ? user.eventId : undefined;

    const guests = await this.prisma.guest.findMany({
      where: {
        ...(eventId && {
          invitation: { eventId },
        }),
        OR: [
          { guestQrToken: raw },
          { id: raw.toLowerCase() },
          { id: { startsWith: cleanCode } },
          { guestQrToken: { startsWith: cleanCode } },
          { fullName: { contains: raw, mode: 'insensitive' } },
          { invitation: { id: { startsWith: cleanCode } } },
          { invitation: { inviteLinkToken: raw } },
          { invitation: { primaryContactName: { contains: raw, mode: 'insensitive' } } },
          { invitation: { phone: { contains: cleanCode } } },
        ],
      },
      include: {
        checkin: true,
        invitation: {
          select: {
            id: true,
            primaryContactName: true,
            phone: true,
            deliveryChannel: true,
            eventId: true,
          },
        },
      },
      take: 20,
    });

    return guests.map((g) => ({
      id: g.id,
      fullName: g.fullName,
      tableNumber: g.tableNumber,
      relationshipGroup: g.relationshipGroup,
      isAttending: g.isAttending,
      guestQrToken: g.guestQrToken,
      passcode: `PASS-${g.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`,
      invitationCode: `INV-${g.invitationId.replace(/-/g, '').slice(0, 6).toUpperCase()}`,
      invitation: g.invitation,
      isCheckedIn: !!g.checkin,
      checkedInAt: g.checkin?.checkedInAt ?? null,
      stationId: g.checkin?.stationId ?? null,
    }));
  }

  async getEventCheckins(tenantIdOrUser: any, eventId: string) {
    // Verify event access if tenant
    if (tenantIdOrUser.role === 'tenant_admin' || tenantIdOrUser.tenantId) {
      const event = await this.prisma.event.findFirst({
        where: { id: eventId, tenantId: tenantIdOrUser.tenantId },
      });
      if (!event) {
        throw new NotFoundException('Event not found');
      }
    }

    // Verify staff event scoping if staff
    if (tenantIdOrUser.role === 'checkin_staff') {
      if (tenantIdOrUser.eventId !== eventId) {
        throw new ForbiddenException('Staff token is not authorized for this event');
      }
    }

    const checkins = await this.prisma.checkin.findMany({
      where: {
        guest: {
          invitation: {
            eventId,
          },
        },
      },
      include: {
        guest: {
          select: {
            id: true,
            fullName: true,
            relationshipGroup: true,
            tableNumber: true,
            isAttending: true,
            invitation: {
              select: {
                id: true,
                primaryContactName: true,
              },
            },
          },
        },
      },
      orderBy: { checkedInAt: 'desc' },
    });

    const totalGuests = await this.prisma.guest.count({
      where: { invitation: { eventId } },
    });

    const totalConfirmedGuests = await this.prisma.guest.count({
      where: { invitation: { eventId }, isAttending: true },
    });

    const totalCheckedIn = checkins.length;
    const checkinRate =
      totalConfirmedGuests > 0
        ? Math.round((totalCheckedIn / totalConfirmedGuests) * 100)
        : 0;

    return {
      checkins,
      stats: {
        totalCheckedIn,
        totalConfirmedGuests,
        totalGuests,
        checkinRate: `${checkinRate}%`,
      },
    };
  }
}
