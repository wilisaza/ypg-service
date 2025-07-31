const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      fullName: 'Administrador',
      email: 'admin@ypg.com',
      role: 'ADMIN',
      isActive: true
    }
  });

  console.log('✅ Usuario admin creado:', admin.username);

  // Crear usuario de prueba
  const testPassword = await bcrypt.hash('test123', 10);
  
  const testUser = await prisma.user.upsert({
    where: { username: 'test_user' },
    update: {},
    create: {
      username: 'test_user',
      password: testPassword,
      fullName: 'Usuario de Prueba',
      email: 'test@ypg.com',
      role: 'USER',
      isActive: true
    }
  });

  console.log('✅ Usuario test creado:', testUser.username);

  // Crear producto de préstamo
  const loanProduct = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Préstamo Capital Variable',
      type: 'LOAN',
      loanType: 'VARIABLE_CAPITAL',
      description: 'Préstamo con interés mensual fijo',
      interestRate: 0.24,
      monthlyFee: 50000,
      penaltyRate: 0.02,
      graceDays: 5,
      isActive: true
    }
  });

  console.log('✅ Producto de préstamo creado:', loanProduct.name);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
