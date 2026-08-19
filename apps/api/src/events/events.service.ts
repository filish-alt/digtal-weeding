import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        tenantId,
        slug: dto.slug,
        coupleNames: dto.coupleNames,
        eventDate: new Date(dto.eventDate),
        venue: dto.venue,
        timezone: dto.timezone ?? 'UTC',
        ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
        ...(dto.verse !== undefined && { verse: dto.verse }),
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.event.findMany({
      where: { tenantId },
      orderBy: { eventDate: 'asc' },
    });
  }

  async findOne(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
      include: {
        _count: {
          select: {
            invitations: true,
            staff: true,
          },
        },
      },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async update(tenantId: string, eventId: string, dto: UpdateEventDto) {
    // Belt-and-suspenders: verify ownership even though the guard already checked
    await this.findOne(tenantId, eventId);

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.coupleNames !== undefined && { coupleNames: dto.coupleNames }),
        ...(dto.eventDate !== undefined && { eventDate: new Date(dto.eventDate) }),
        ...(dto.venue !== undefined && { venue: dto.venue }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
        ...(dto.verse !== undefined && { verse: dto.verse }),
      },
    });
  }

  async remove(tenantId: string, eventId: string) {
    await this.findOne(tenantId, eventId);

    return this.prisma.event.delete({
      where: { id: eventId },
    });
  }
}
