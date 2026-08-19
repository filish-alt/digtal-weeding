import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Tenant Isolation Guard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tenantAToken: string;
  let tenantBToken: string;

  let tenantAEventId: string;
  let tenantAInvitationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();
    prisma = app.get(PrismaService);

    // Clean DB before test
    await prisma.checkin.deleteMany();
    await prisma.guest.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.staffAccount.deleteMany();
    await prisma.event.deleteMany();
    await prisma.tenant.deleteMany();

    // 1. Signup Tenant A
    const signupARes = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'tenant.a@example.com',
        name: 'Couple A',
        password: 'Password123!',
      })
      .expect(201);
    tenantAToken = signupARes.body.access_token;

    // 2. Signup Tenant B
    const signupBRes = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'tenant.b@example.com',
        name: 'Couple B',
        password: 'Password123!',
      })
      .expect(201);
    tenantBToken = signupBRes.body.access_token;

    // 3. Tenant A creates Event A
    const eventARes = await request(app.getHttpServer())
      .post('/api/events')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({
        slug: 'alice-bob-2026',
        coupleNames: 'Alice & Bob',
        eventDate: '2026-09-20T18:00:00.000Z',
        venue: 'Grand Ballroom',
        timezone: 'America/New_York',
      })
      .expect(201);
    tenantAEventId = eventARes.body.id;

    // 4. Tenant A creates Invitation A under Event A
    const inviteARes = await request(app.getHttpServer())
      .post(`/api/events/${tenantAEventId}/invitations`)
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({
        primaryContactName: 'John Doe Family',
        phone: '+1234567890',
        deliveryChannel: 'whatsapp',
        partySizeAllowed: 4,
      })
      .expect(201);
    tenantAInvitationId = inviteARes.body.id;
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      await prisma.checkin.deleteMany();
      await prisma.guest.deleteMany();
      await prisma.invitation.deleteMany();
      await prisma.staffAccount.deleteMany();
      await prisma.event.deleteMany();
      await prisma.tenant.deleteMany();
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  describe('Event Isolation', () => {
    it('Tenant A can read their own event', async () => {
      await request(app.getHttpServer())
        .get(`/api/events/${tenantAEventId}`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .expect(200);
    });

    it('Tenant B CANNOT read Tenant A event (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/events/${tenantAEventId}`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .expect(403);

      expect(res.body.message).toContain('different tenant');
    });

    it('Tenant B CANNOT update Tenant A event (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/events/${tenantAEventId}`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .send({ venue: 'Hacked Venue' })
        .expect(403);

      expect(res.body.message).toContain('different tenant');
    });

    it('Tenant B CANNOT delete Tenant A event (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/events/${tenantAEventId}`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .expect(403);
    });
  });

  describe('Invitation Isolation', () => {
    it('Tenant A can read their own invitation', async () => {
      await request(app.getHttpServer())
        .get(`/api/events/${tenantAEventId}/invitations/${tenantAInvitationId}`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .expect(200);
    });

    it('Tenant B CANNOT list invitations for Tenant A event (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/api/events/${tenantAEventId}/invitations`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .expect(403);
    });

    it('Tenant B CANNOT read Tenant A invitation (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/api/events/${tenantAEventId}/invitations/${tenantAInvitationId}`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .expect(403);
    });

    it('Tenant B CANNOT create invitation on Tenant A event (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post(`/api/events/${tenantAEventId}/invitations`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .send({
          primaryContactName: 'Malicious Guest',
        })
        .expect(403);
    });

    it('Tenant B CANNOT update Tenant A invitation (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/events/${tenantAEventId}/invitations/${tenantAInvitationId}`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .send({ primaryContactName: 'Changed Name' })
        .expect(403);
    });

    it('Tenant B CANNOT delete Tenant A invitation (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/events/${tenantAEventId}/invitations/${tenantAInvitationId}`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .expect(403);
    });
  });
});
