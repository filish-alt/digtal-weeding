import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.PLATFORM_ADMIN_EMAIL || 'admin@platform.com';
  const password = process.env.PLATFORM_ADMIN_PASSWORD || 'admin123456';
  const name = process.env.PLATFORM_ADMIN_NAME || 'Platform Administrator';

  console.log(`Seeding platform admin: ${email}...`);

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.platformAdmin.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
    },
    create: {
      email,
      name,
      passwordHash,
    },
  });

  console.log(`✅ Platform admin seeded with ID: ${admin.id} (${admin.email})`);

  // Ensure any existing dev tenants are active
  const updatedTenants = await prisma.tenant.updateMany({
    where: {
      status: 'pending',
    },
    data: {
      status: 'active',
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  });

  if (updatedTenants.count > 0) {
    console.log(`Updated ${updatedTenants.count} existing tenant(s) to active status.`);
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
