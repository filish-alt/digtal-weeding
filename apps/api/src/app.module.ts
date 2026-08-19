import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

// Infrastructure
import { PrismaModule } from './prisma/prisma.module';

// Guards (order matters: JwtAuthGuard runs first, then TenantIsolationGuard)
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TenantIsolationGuard } from './common/guards/tenant-isolation.guard';
import { StaffEventGuard } from './common/guards/staff-event.guard';

// Filters
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { EventsModule } from './events/events.module';
import { InvitationsModule } from './invitations/invitations.module';
import { GuestsModule } from './guests/guests.module';
import { CheckinsModule } from './checkins/checkins.module';
import { StaffModule } from './staff/staff.module';
import { PlatformModule } from './platform/platform.module';

// Upload controller
import { UploadController } from './upload/upload.controller';

@Module({
  imports: [
    // Load .env and make ConfigService available globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Database
    PrismaModule,
    // Feature modules
    AuthModule,
    TenantsModule,
    InvitationsModule,
    GuestsModule,
    StaffModule,
    CheckinsModule,
    EventsModule,
    PlatformModule,
  ],
  controllers: [UploadController],
  providers: [
    // Global guards — order: JWT auth first, then tenant isolation
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantIsolationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: StaffEventGuard,
    },
    // Global exception filter for Prisma errors
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule {}
