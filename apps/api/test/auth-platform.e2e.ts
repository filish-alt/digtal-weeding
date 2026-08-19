import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';

async function testAuthPlatform() {
  console.log('🧪 Starting Auth & Platform Admin Flow Verification...\n');

  const testEmail = `test.couple.${Date.now()}@wedding.com`;
  const testPassword = 'Password123!';
  const testName = 'Sarah & David';

  // 1. Test Tenant Signup
  console.log('1️⃣ Testing Tenant Signup (POST /api/auth/tenant/signup)...');
  const signupRes = await fetch(`${API_URL}/auth/tenant/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      name: testName,
      password: testPassword,
    }),
  });

  const signupData = await signupRes.json();
  console.log('Signup response:', signupData);
  if (signupRes.status !== 201 && signupRes.status !== 200) {
    throw new Error(`Signup failed with status ${signupRes.status}`);
  }
  if (signupData.access_token) {
    throw new Error('FAILED: Signup must NOT return an access_token!');
  }
  if (signupData.tenant?.status !== 'pending') {
    throw new Error(`FAILED: Tenant status must be pending, got ${signupData.tenant?.status}`);
  }
  console.log('✅ Tenant created with status: pending and NO JWT token issued.\n');

  const tenantId = signupData.tenant.id;

  // 2. Test Tenant Login before approval
  console.log('2️⃣ Testing Tenant Login before approval (POST /api/auth/tenant/login)...');
  const preApprovalLoginRes = await fetch(`${API_URL}/auth/tenant/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  const preApprovalLoginData = await preApprovalLoginRes.json();
  console.log(`Pre-approval login response status: ${preApprovalLoginRes.status}`, preApprovalLoginData);
  if (preApprovalLoginRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden, got ${preApprovalLoginRes.status}`);
  }
  if (!preApprovalLoginData.message?.includes('awaiting approval')) {
    throw new Error(`Expected message to contain "awaiting approval", got: ${preApprovalLoginData.message}`);
  }
  console.log('✅ Pending tenant login correctly rejected with "Your account is awaiting approval".\n');

  // 3. Test Platform Admin Login
  console.log('3️⃣ Testing Platform Admin Login (POST /api/auth/platform/login)...');
  const platformLoginRes = await fetch(`${API_URL}/auth/platform/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@platform.com',
      password: 'admin123456',
    }),
  });

  const platformLoginData = await platformLoginRes.json();
  if (!platformLoginRes.ok || !platformLoginData.access_token) {
    throw new Error(`Platform login failed: ${JSON.stringify(platformLoginData)}`);
  }
  const platformToken = platformLoginData.access_token;
  console.log('✅ Platform admin logged in successfully. Received platform admin JWT.\n');

  // 4. Test Platform Admin listing pending tenants
  console.log('4️⃣ Testing Platform Admin listing pending tenants (GET /api/platform/tenants?status=pending)...');
  const listTenantsRes = await fetch(`${API_URL}/platform/tenants?status=pending`, {
    headers: { Authorization: `Bearer ${platformToken}` },
  });
  const pendingTenants = await listTenantsRes.json();
  const foundPending = pendingTenants.find((t: any) => t.id === tenantId);
  if (!foundPending) {
    throw new Error(`Tenant ${tenantId} not found in pending tenants list!`);
  }
  console.log(`✅ Pending tenant ${tenantId} found in platform tenants list.\n`);

  // 5. Test Platform Admin Approving Tenant
  console.log(`5️⃣ Testing Platform Admin approving tenant (POST /api/platform/tenants/${tenantId}/approve)...`);
  const approveRes = await fetch(`${API_URL}/platform/tenants/${tenantId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${platformToken}` },
  });
  const approveData = await approveRes.json();
  console.log('Approve response:', approveData);
  if (approveData.tenant?.status !== 'active' || !approveData.tenant?.approvedAt) {
    throw new Error(`Tenant approval failed: ${JSON.stringify(approveData)}`);
  }
  console.log('✅ Tenant approved successfully and marked active.\n');

  // 6. Test Tenant Login after approval
  console.log('6️⃣ Testing Tenant Login after approval (POST /api/auth/tenant/login)...');
  const postApprovalLoginRes = await fetch(`${API_URL}/auth/tenant/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  const postApprovalLoginData = await postApprovalLoginRes.json();
  if (!postApprovalLoginRes.ok || !postApprovalLoginData.access_token) {
    throw new Error(`Tenant login failed after approval: ${JSON.stringify(postApprovalLoginData)}`);
  }
  const tenantToken = postApprovalLoginData.access_token;
  console.log('✅ Tenant logged in successfully and received tenant JWT.\n');

  // 7. Create an event for the tenant to test staff management
  console.log('7️⃣ Creating an event for tenant...');
  const createEventRes = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tenantToken}`,
    },
    body: JSON.stringify({
      slug: `event-${Date.now()}`,
      coupleNames: 'Sarah & David',
      eventDate: new Date(Date.now() + 86400000).toISOString(),
      venue: 'Grand Palace Hotel',
    }),
  });
  const eventData = await createEventRes.json();
  const eventId = eventData.id;
  console.log(`✅ Event created with ID: ${eventId}\n`);

  // 8. Platform Admin creates staff account for the event
  console.log('8️⃣ Platform Admin creates door staff account (POST /api/platform/events/:eventId/staff)...');
  const createStaffRes = await fetch(`${API_URL}/platform/events/${eventId}/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${platformToken}`,
    },
    body: JSON.stringify({
      name: 'Gate 1 Scanner Lead',
      stationId: 'gate-north',
      pinCode: '7890',
    }),
  });
  const staffData = await createStaffRes.json();
  console.log('Created staff:', staffData);
  if (!staffData.id || staffData.pinCode !== '7890') {
    throw new Error(`Staff creation failed: ${JSON.stringify(staffData)}`);
  }
  console.log('✅ Staff account created with PIN by platform admin.\n');

  // 9. Door Staff PIN Login
  console.log('9️⃣ Door Staff logs in with PIN (POST /api/events/:eventId/staff/login)...');
  const staffLoginRes = await fetch(`${API_URL}/events/${eventId}/staff/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stationId: 'gate-north',
      pinCode: '7890',
    }),
  });
  const staffLoginData = await staffLoginRes.json();
  if (!staffLoginRes.ok || !staffLoginData.access_token) {
    throw new Error(`Staff login failed: ${JSON.stringify(staffLoginData)}`);
  }
  console.log('✅ Door staff authenticated with PIN successfully.\n');

  // 10. Platform Admin revokes staff account
  console.log(`🔟 Platform Admin revokes staff account (DELETE /api/platform/events/${eventId}/staff/${staffData.id})...`);
  const revokeStaffRes = await fetch(`${API_URL}/platform/events/${eventId}/staff/${staffData.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${platformToken}` },
  });
  const revokeData = await revokeStaffRes.json();
  console.log('Revoke response:', revokeData);
  console.log('✅ Staff account soft-revoked.\n');

  // 11. Revoked staff login attempt
  console.log('1️⃣1️⃣ Testing revoked staff login attempt...');
  const revokedLoginRes = await fetch(`${API_URL}/events/${eventId}/staff/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stationId: 'gate-north',
      pinCode: '7890',
    }),
  });
  if (revokedLoginRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized for expired staff, got ${revokedLoginRes.status}`);
  }
  console.log('✅ Revoked staff login correctly rejected.\n');

  // 12. Cross-guard test: Tenant token against platform route
  console.log('1️⃣2️⃣ Testing Tenant Token against Platform Admin Route (GET /api/platform/tenants)...');
  const crossGuardRes = await fetch(`${API_URL}/platform/tenants`, {
    headers: { Authorization: `Bearer ${tenantToken}` },
  });
  if (crossGuardRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for tenant token on platform route, got ${crossGuardRes.status}`);
  }
  console.log('✅ PlatformAdminGuard successfully blocked tenant token from accessing platform routes.\n');

  console.log('🎉 ALL AUTH & PLATFORM ADMIN TESTS PASSED PERFECTLY! 🚀');
}

testAuthPlatform()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
