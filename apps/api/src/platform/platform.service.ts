import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventStaffDto } from './dto/create-event-staff.dto';

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all tenants, optionally filtered by status (e.g. ?status=pending)
   */
  async listTenants(status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const tenants = await this.prisma.tenant.findMany({
      where,
      select: {
        id: true,
        ownerEmail: true,
        ownerName: true,
        status: true,
        approvedAt: true,
        approvedBy: true,
        createdAt: true,
        _count: {
          select: {
            events: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants;
  }

  /**
   * Approve a tenant: sets status='active', approvedAt=now, approvedBy=adminId,
   * sends/logs approval email to the tenant.
   */
  async approveTenant(tenantId: string, approvedById: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'active',
        approvedAt: new Date(),
        approvedBy: approvedById,
      },
      select: {
        id: true,
        ownerEmail: true,
        ownerName: true,
        status: true,
        approvedAt: true,
        approvedBy: true,
        createdAt: true,
      },
    });

    // Send approval email (logged / simulated email notification)
    this.sendApprovalEmail(updated.ownerEmail, updated.ownerName);

    return {
      message: `Tenant ${updated.ownerName} has been approved and notified.`,
      tenant: updated,
    };
  }

  /**
   * Suspend a tenant: sets status='suspended'
   */
  async suspendTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'suspended',
      },
      select: {
        id: true,
        ownerEmail: true,
        ownerName: true,
        status: true,
        approvedAt: true,
        approvedBy: true,
        createdAt: true,
      },
    });

    this.logger.log(`Tenant ${tenant.id} (${tenant.ownerEmail}) suspended.`);

    return {
      message: `Tenant ${updated.ownerName} has been suspended.`,
      tenant: updated,
    };
  }

  /**
   * Platform Admin: Create door staff account for a specific event
   */
  async createEventStaff(eventId: string, dto: CreateEventStaffDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Generate random 6-digit PIN if none provided
    const plainPin = dto.pinCode || Math.floor(100000 + Math.random() * 900000).toString();
    const pinCodeHash = await bcrypt.hash(plainPin, this.SALT_ROUNDS);

    const staff = await this.prisma.staffAccount.create({
      data: {
        eventId,
        name: dto.name,
        pinCode: pinCodeHash,
        stationId: dto.stationId || `station-${Math.floor(1000 + Math.random() * 9000)}`,
        tokenExpiresAt: dto.tokenExpiresAt ? new Date(dto.tokenExpiresAt) : null,
      },
    });

    return {
      id: staff.id,
      name: staff.name,
      eventId: staff.eventId,
      stationId: staff.stationId,
      pinCode: plainPin, // returned in creation response so admin can distribute to staff
      tokenExpiresAt: staff.tokenExpiresAt,
      createdAt: staff.createdAt,
    };
  }

  /**
   * Platform Admin: List all staff accounts for a specific event
   */
  async listEventStaff(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const staffList = await this.prisma.staffAccount.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });

    return staffList.map(({ pinCode, ...rest }) => ({
      ...rest,
      isRevoked: rest.tokenExpiresAt ? new Date() > new Date(rest.tokenExpiresAt) : false,
    }));
  }

  /**
   * Platform Admin: Revoke a staff account (soft-revoke by expiring token)
   */
  async revokeEventStaff(eventId: string, staffId: string) {
    const staff = await this.prisma.staffAccount.findFirst({
      where: { id: staffId, eventId },
    });

    if (!staff) {
      throw new NotFoundException(`Staff account with ID ${staffId} not found for this event`);
    }

    const updated = await this.prisma.staffAccount.update({
      where: { id: staffId },
      data: {
        tokenExpiresAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        eventId: true,
        stationId: true,
        tokenExpiresAt: true,
      },
    });

    this.logger.log(`Staff account ${staffId} (${staff.name}) revoked.`);

    return {
      message: `Staff account ${staff.name} has been revoked.`,
      staff: updated,
    };
  }

  /**
   * Platform Admin: List all events across all tenants
   */
  async listAllEvents() {
    const events = await this.prisma.event.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            ownerName: true,
            ownerEmail: true,
            status: true,
          },
        },
        _count: {
          select: {
            staff: true,
            invitations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return events;
  }

  private sendApprovalEmail(email: string, name: string) {
    this.logger.log(
      `📧 [EMAIL NOTIFICATION] To: ${email} | Subject: "Your Wedding Portal Account has been Approved!" | Dear ${name}, your tenant account is now active. You may log in to manage your wedding events.`,
    );
  }
}
