const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@platform.com';
  const password = 'admin123456';
  const name = 'Platform Administrator';

  console.log('Connecting to database...');
  const hash = await bcrypt.hash(password, 12);
  console.log('Generated hash for password admin123456');

  const admin = await prisma.platformAdmin.upsert({
    where: { email },
    update: {
      name,
      passwordHash: hash,
    },
    create: {
      email,
      name,
      passwordHash: hash,
    },
  });

  console.log(`✅ SUCCESS! Platform Admin seeded: ID=${admin.id}, Email=${admin.email}`);
  
  const allAdmins = await prisma.platformAdmin.findMany();
  console.log('Current Platform Admins in DB:', allAdmins);
}

main()
  .catch((err) => {
    console.error('❌ Database connection or seeding error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
