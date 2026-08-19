import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Phase 2 — Guests, RSVP & Day-of Check-in (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tenantAToken: string;
  let tenantBToken: string;

  let eventAId: string;
  let eventBId: string;

  let invitationA1Id: string; // partySizeAllowed: 2
  let invitationA1Token: string;
  let invitationA2Id: string; // partySizeAllowed: null (unlimited)

  let guest1Id: string;
  let guest1QrToken: string;
  let guest2Id: string;
  let guest2QrToken: string;

  let staffAToken: string;
  let staffBToken: string;

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

    // Clean DB before tests
    await prisma.checkin.deleteMany();
    await prisma.guest.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.staffAccount.deleteMany();
    await prisma.event.deleteMany();
    await prisma.tenant.deleteMany();

    // 1. Register Tenant A & Tenant B
    const signupARes = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'admin.a@wedding.com',
        name: 'Couple A',
        password: 'Password123!',
      })
      .expect(201);
    tenantAToken = signupARes.body.access_token;

    const signupBRes = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'admin.b@wedding.com',
        name: 'Couple B',
        password: 'Password123!',
      })
      .expect(201);
    tenantBToken = signupBRes.body.access_token;

    // 2. Tenant A creates Event A, Tenant B creates Event B
    const eventARes = await request(app.getHttpServer())
      .post('/api/events')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({
        slug: 'event-a-2026',
        coupleNames: 'Alice & Bob',
        eventDate: '2026-10-10T16:00:00.000Z',
        venue: 'Ocean Palm Resort',
        timezone: 'America/Los_Angeles',
      })
      .expect(201);
    eventAId = eventARes.body.id;

    const eventBRes = await request(app.getHttpServer())
      .post('/api/events')
      .set('Authorization', `Bearer ${tenantBToken}`)
      .send({
        slug: 'event-b-2026',
        coupleNames: 'Charlie & Diana',
        eventDate: '2026-11-15T17:00:00.000Z',
        venue: 'Mountain Lodge',
        timezone: 'UTC',
      })
      .expect(201);
    eventBId = eventBRes.body.id;

    // 3. Tenant A creates Invitation A1 (Fixed cap: 2) & Invitation A2 (Unlimited)
    const invA1Res = await request(app.getHttpServer())
      .post(`/api/events/${eventAId}/invitations`)
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({
        primaryContactName: 'Smith Family',
        partySizeAllowed: 2,
      })
      .expect(201);
    invitationA1Id = invA1Res.body.id;
    invitationA1Token = invA1Res.body.inviteLinkToken;

    const invA2Res = await request(app.getHttpServer())
      .post(`/api/events/${eventAId}/invitations`)
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({
        primaryContactName: 'Johnson Family',
        partySizeAllowed: null,
      })
      .expect(201);
    invitationA2Id = invA2Res.body.id;
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

  // ── 1. GUESTS MODULE & PARTY SIZE CAP ─────────────────────────────
  describe('1. Guests Module & Party Size Cap', () => {
    it('Tenant A adds 1st guest to Invitation A1 (Cap = 2)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/events/${eventAId}/invitations/${invitationA1Id}/guests`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          fullName: 'John Smith',
          relationshipGroup: 'Groom Family',
          needsPhysicalCard: true,
          tableNumber: 5,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.fullName).toBe('John Smith');
      expect(res.body).toHaveProperty('guestQrToken');
      expect(res.body.guestQrToken.length).toBeGreaterThan(20);

      guest1Id = res.body.id;
      guest1QrToken = res.body.guestQrToken;
    });

    it('Tenant A adds 2nd guest to Invitation A1 (Cap = 2)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/events/${eventAId}/invitations/${invitationA1Id}/guests`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          fullName: 'Jane Smith',
          relationshipGroup: 'Groom Family',
        })
        .expect(201);

      guest2Id = res.body.id;
      guest2QrToken = res.body.guestQrToken;
    });

    it('Tenant A adding 3rd guest exceeds party size cap (returns 400)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/events/${eventAId}/invitations/${invitationA1Id}/guests`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          fullName: 'Extra Smith',
        })
        .expect(400);

      expect(res.body.message).toContain('exceeds the maximum party size allowed');
    });

    it('Tenant A can add multiple guests to Invitation A2 with no cap (null)', async () => {
      await request(app.getHttpServer())
        .post(`/api/events/${eventAId}/invitations/${invitationA2Id}/guests`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({ fullName: 'Alice Johnson' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/events/${eventAId}/invitations/${invitationA2Id}/guests`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({ fullName: 'Bob Johnson' })
        .expect(201);
    });

    it('Tenant A can update guest details', async () => {
      const res = await request(app.getHttpServer())
        .patch(
          `/api/events/${eventAId}/invitations/${invitationA1Id}/guests/${guest1Id}`,
        )
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          tableNumber: 12,
        })
        .expect(200);

      expect(res.body.tableNumber).toBe(12);
    });

    it('Tenant A can list guests for an invitation', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/events/${eventAId}/invitations/${invitationA1Id}/guests`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('Tenant A can list all guests for an entire event', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/events/${eventAId}/guests`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(4);
    });
  });

  // ── 2. PUBLIC RSVP FLOW ───────────────────────────────────────────
  describe('2. Public RSVP Flow (Unauthenticated)', () => {
    it('Public client resolves invitation by inviteLinkToken', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/rsvp/${invitationA1Token}`)
        .expect(200);

      expect(res.body.event.coupleNames).toBe('Alice & Bob');
      expect(res.body.guests.length).toBe(2);
      expect(res.body.guests[0].fullName).toBe('John Smith');
    });

    it('Invalid token returns 404 Not Found (not 403)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/rsvp/non-existent-token-12345')
        .expect(404);

      expect(res.body.message).toContain('Invitation not found');
    });

    it('Public guest submits RSVP (John = true, Jane = false)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/rsvp/${invitationA1Token}`)
        .send({
          rsvp: [
            { guestId: guest1Id, isAttending: true },
            { guestId: guest2Id, isAttending: false },
          ],
        })
        .expect(200);

      expect(res.body.guests.find((g: any) => g.id === guest1Id).isAttending).toBe(
        true,
      );
      expect(res.body.guests.find((g: any) => g.id === guest2Id).isAttending).toBe(
        false,
      );
    });

    it('Tenant checking invitation sees updated partySizeConfirmed = 1', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/events/${eventAId}/invitations/${invitationA1Id}`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .expect(200);

      expect(res.body.partySizeConfirmed).toBe(1);
    });
  });

  // ── 3. STAFF AUTH & EVENT-SCOPING ────────────────────────────────
  describe('3. Staff Auth & Event Scoping', () => {
    it('Tenant A creates a Staff Account for Event A', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/events/${eventAId}/staff`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          name: 'Gatekeeper Dave',
          pinCode: '9999',
          stationId: 'station-a1',
        })
        .expect(201);

      expect(res.body.name).toBe('Gatekeeper Dave');
      expect(res.body).not.toHaveProperty('pinCode');
    });

    it('Staff A logs in with correct stationId & PIN', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/events/${eventAId}/staff/login`)
        .send({
          stationId: 'station-a1',
          pinCode: '9999',
        })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      staffAToken = res.body.access_token;
    });

    it('Staff login fails with wrong PIN (401)', async () => {
      await request(app.getHttpServer())
        .post(`/api/events/${eventAId}/staff/login`)
        .send({
          stationId: 'station-a1',
          pinCode: '0000',
        })
        .expect(401);
    });

    it('Tenant B creates Staff B for Event B', async () => {
      await request(app.getHttpServer())
        .post(`/api/events/${eventBId}/staff`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .send({
          name: 'Staff Event B',
          pinCode: '7777',
          stationId: 'station-b1',
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post(`/api/events/${eventBId}/staff/login`)
        .send({
          stationId: 'station-b1',
          pinCode: '7777',
        })
        .expect(201);

      staffBToken = loginRes.body.access_token;
    });
  });

  // ── 4. CHECK-IN MODULE ───────────────────────────────────────────
  describe('4. Check-in Module & Conflict Handling', () => {
    it('Staff A checks in Guest 1 using guestQrToken', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/checkins')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({
          guestQrToken: guest1QrToken,
        })
        .expect(201);

      expect(res.body.checkin.guestId).toBe(guest1Id);
      expect(res.body.wasRsvpd).toBe(true);
    });

    it('Duplicate check-in for Guest 1 returns 409 Conflict with detailed message', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/checkins')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({
          guestQrToken: guest1QrToken,
        })
        .expect(409);

      expect(res.body.message).toContain('already checked in at');
    });

    it('Staff B from Event B CANNOT check in Guest 1 from Event A (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/checkins')
        .set('Authorization', `Bearer ${staffBToken}`)
        .send({
          guestQrToken: guest1QrToken,
        })
        .expect(403);

      expect(res.body.message).toContain('not authorized for this event');
    });

    it('Checking in Guest 2 (who RSVPd false) returns checkin with wasRsvpd: false', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/checkins')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({
          guestQrToken: guest2QrToken,
        })
        .expect(201);

      expect(res.body.wasRsvpd).toBe(false);
      expect(res.body).toHaveProperty('warning');
    });

    it('Tenant A views live check-in dashboard for Event A', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/events/${eventAId}/checkins`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .expect(200);

      expect(res.body.checkins.length).toBe(2);
      expect(res.body.stats.totalCheckedIn).toBe(2);
      expect(res.body.stats.totalConfirmedGuests).toBe(1);
    });
  });

  // ── 5. CROSS-TENANT ISOLATION ON NEW ROUTES ───────────────────────
  describe('5. Cross-Tenant Isolation on Phase 2 Routes', () => {
    it('Tenant B CANNOT add guest to Tenant A invitation (403)', async () => {
      await request(app.getHttpServer())
        .post(`/api/events/${eventAId}/invitations/${invitationA1Id}/guests`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .send({ fullName: 'Malicious Guest' })
        .expect(403);
    });

    it('Tenant B CANNOT list guests for Tenant A event (403)', async () => {
      await request(app.getHttpServer())
        .get(`/api/events/${eventAId}/guests`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .expect(403);
    });

    it('Tenant B CANNOT list staff for Tenant A event (403)', async () => {
      await request(app.getHttpServer())
        .get(`/api/events/${eventAId}/staff`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .expect(403);
    });

    it('Tenant B CANNOT view check-in dashboard for Tenant A event (403)', async () => {
      await request(app.getHttpServer())
        .get(`/api/events/${eventAId}/checkins`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .expect(403);
    });
  });
});
