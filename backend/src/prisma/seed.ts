import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
const bcrypt = bcryptjs as typeof import('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      password: passwordHash,
      email: 'admin@example.com',
      fullName: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const userPassword = await bcrypt.hash('user123', 10);
  await prisma.user.create({
    data: {
      username: 'user',
      password: userPassword,
      email: 'user@example.com',
      fullName: 'Regular User',
      role: 'USER',
      isActive: true,
    },
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
