import { PrismaClient, ProductType, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // NOTE: Cleaning is handled by `prisma migrate reset`
  // await prisma.transaction.deleteMany({});
  // await prisma.loanDetails.deleteMany({});
  // await prisma.account.deleteMany({});
  // await prisma.product.deleteMany({});
  // await prisma.user.deleteMany({});
  // console.log('Cleaned up existing data.');

  // 2. Create Users
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPasswordAdmin,
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const hashedPasswordUser = await bcrypt.hash('user123', 10);
  const regularUser = await prisma.user.create({
    data: {
      username: 'johndoe',
      password: hashedPasswordUser,
      fullName: 'John Doe',
      email: 'johndoe@example.com',
      role: Role.USER,
      isActive: true,
    },
  });
  console.log(`Created users: ${adminUser.username}, ${regularUser.username}`);

  // 3. Create Products (Templates)
  const savingsProduct = await prisma.product.create({
    data: {
      name: 'Ahorro Clásico',
      type: ProductType.SAVINGS,
      description: 'Cuenta de ahorros estándar con tasa de interés competitiva.',
      interestRate: 0.02, // 2% anual
      minBalance: 10.0,
      monthlyFee: 2.5,
      isActive: true,
    },
  });

  // Plan de ahorro navideño con los nuevos campos
  const christmasSavingsPlan = await prisma.product.create({
    data: {
      name: 'Plan Ahorro Navidad 2025',
      type: ProductType.SAVINGS,
      description: 'Plan de ahorro navideño con cuota mensual fija de $50,000',
      monthlyAmount: 50000, // Cuota mensual fija
      billingDay: 15, // Cobro el día 15 de cada mes
      penaltyAmount: 10000, // Multa fija de $10,000
      startMonth: 8, // Agosto
      endMonth: 12, // Diciembre
      planYear: 2025,
      graceDays: 5,
      isActive: true,
    },
  });

  // Plan de ahorro vacaciones
  const vacationSavingsPlan = await prisma.product.create({
    data: {
      name: 'Plan Ahorro Vacaciones 2025',
      type: ProductType.SAVINGS,
      description: 'Plan de ahorro para vacaciones con cuota mensual de $75,000',
      monthlyAmount: 75000,
      billingDay: 5, // Cobro el día 5 de cada mes
      penaltyAmount: 15000, // Multa fija de $15,000
      startMonth: 1, // Enero
      endMonth: 6, // Junio
      planYear: 2025,
      graceDays: 3,
      isActive: true,
    },
  });

  const loanProduct = await prisma.product.create({
    data: {
      name: 'Préstamo Personal',
      type: ProductType.LOAN,
      description: 'Préstamo personal con plazos flexibles.',
      interestRate: 0.12, // 12% anual
      penaltyRate: 0.05, // 5% sobre la cuota mensual en caso de atraso
      graceDays: 5,
      isActive: true,
    },
  });
  console.log(`Created products: "${savingsProduct.name}", "${christmasSavingsPlan.name}", "${vacationSavingsPlan.name}" and "${loanProduct.name}"`);

  // 4. Create Accounts for John Doe
  const savingsAccount = await prisma.account.create({
    data: {
      userId: regularUser.id,
      productId: savingsProduct.id,
      balance: 500.0,
      savingsGoal: 10000.0,
    },
  });

  const loanAccount = await prisma.account.create({
    data: {
      userId: regularUser.id,
      productId: loanProduct.id,
      balance: -5000.0, // Saldo negativo representa la deuda
      loanDetails: {
        create: {
          principalAmount: 5000.0,
          currentBalance: 5000.0, // Saldo actual pendiente
          termMonths: 24,
          interestRate: loanProduct.interestRate!,
          monthlyPayment: 235.37, // Calculado externamente para este ejemplo
        },
      },
    },
  });
  console.log(`Created accounts for ${regularUser.username}: Savings (ID: ${savingsAccount.id}) and Loan (ID: ${loanAccount.id})`);

  // Crear cuentas para los nuevos planes de ahorro
  const christmasAccount = await prisma.account.create({
    data: {
      userId: regularUser.id,
      productId: christmasSavingsPlan.id,
      balance: 100000.0, // Ya ha ahorrado 2 cuotas
      savingsGoal: 250000.0, // Meta de ahorro para diciembre
    },
  });

  const vacationAccount = await prisma.account.create({
    data: {
      userId: adminUser.id,
      productId: vacationSavingsPlan.id,
      balance: 225000.0, // Ya ha ahorrado 3 cuotas
      savingsGoal: 450000.0, // Meta de ahorro para vacaciones
    },
  });
  console.log(`Created savings plan accounts: Christmas (ID: ${christmasAccount.id}) and Vacation (ID: ${vacationAccount.id})`);

  // 5. Create Initial Transactions
  // Depósito inicial en la cuenta de ahorros
  await prisma.transaction.create({
    data: {
      accountId: savingsAccount.id,
      amount: 500.0,
      type: 'DEPOSIT',
      status: 'COMPLETED',
      description: 'Depósito inicial',
    },
  });

  // Desembolso del préstamo
  await prisma.transaction.create({
    data: {
      accountId: loanAccount.id,
      amount: 5000.0,
      type: 'LOAN_DISBURSEMENT',
      status: 'COMPLETED',
      description: 'Desembolso de Préstamo Personal',
    },
  });
  console.log('Created initial transactions.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
