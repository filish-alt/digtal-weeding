import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { StaffLoginDto } from './dto/staff-login.dto';

@Injectable()
export class StaffService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async create(tenantId: string, eventId: string, dto: CreateStaffDto) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const pinCodeHash = await bcrypt.hash(dto.pinCode, this.SALT_ROUNDS);

    const staff = await this.prisma.staffAccount.create({
      data: {
        eventId,
        name: dto.name,
        pinCode: pinCodeHash,
        stationId: dto.stationId ?? null,
        tokenExpiresAt: dto.tokenExpiresAt ? new Date(dto.tokenExpiresAt) : null,
      },
    });

    const { pinCode, ...result } = staff;
    return result;
  }

  async findAllByEvent(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const staffAccounts = await this.prisma.staffAccount.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });

    return staffAccounts.map(({ pinCode, ...rest }) => rest);
  }

  async login(eventId: string, dto: StaffLoginDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const staffCandidates = await this.prisma.staffAccount.findMany({
      where: { eventId },
    });

    let matchedStaff = staffCandidates.find(
      (s) => s.stationId === dto.stationId,
    );

    if (!matchedStaff) {
      for (const candidate of staffCandidates) {
        const isValid = await bcrypt.compare(dto.pinCode, candidate.pinCode);
        if (isValid) {
          matchedStaff = candidate;
          break;
        }
      }
    } else {
      const isValid = await bcrypt.compare(dto.pinCode, matchedStaff.pinCode);
      if (!isValid) {
        throw new UnauthorizedException('Invalid PIN code');
      }
    }

    if (!matchedStaff) {
      throw new UnauthorizedException('Invalid station ID or PIN code');
    }

    if (
      matchedStaff.tokenExpiresAt &&
      new Date() > new Date(matchedStaff.tokenExpiresAt)
    ) {
      throw new UnauthorizedException('Staff account token has expired');
    }

    const stationId = dto.stationId || matchedStaff.stationId || 'default-station';

    const payload = {
      sub: matchedStaff.id,
      staffAccountId: matchedStaff.id,
      eventId: matchedStaff.eventId,
      stationId,
      role: 'checkin_staff',
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      staffAccount: {
        id: matchedStaff.id,
        name: matchedStaff.name,
        eventId: matchedStaff.eventId,
        stationId,
      },
    };
  }
}
