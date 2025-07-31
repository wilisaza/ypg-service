import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateTestUser() {
  const hashedPassword = await bcrypt.hash('test123', 10);
  await prisma.user.upsert({
    where: { username: 'test_user' },
    update: { password: hashedPassword },
    create: {
      username: 'test_user',
      password: hashedPassword,
      fullName: 'Usuario Test API',
      email: 'test_api@example.com'
    }
  });
  console.log('✅ Usuario actualizado');
  await prisma.$disconnect();
}

updateTestUser();
