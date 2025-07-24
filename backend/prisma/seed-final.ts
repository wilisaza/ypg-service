import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Limpiar datos existentes en orden
  console.log('🧹 Limpiando datos existentes...');
  
  await prisma.transaction.deleteMany();
  await prisma.productAccount.deleteMany();
  await prisma.financialProduct.deleteMany();
  await prisma.transactionTypeDetail.deleteMany();
  await prisma.user.deleteMany();

  // 2. Crear usuarios de prueba
  console.log('👥 Creando usuarios...');

  const juan = await prisma.user.create({
    data: {
      username: 'juan.perez',
      email: 'juan.perez@email.com',
      password: '$2b$10$7bNMXWNWwN/KvW3nNQMj9OEGnNcFLjS6Y.KJZrVe4Z6NQvK2X5j6q', // contraseña: 123456
      fullName: 'Juan Pérez García',
      role: 'USER',
      isActive: true,
    },
  });

  const maria = await prisma.user.create({
    data: {
      username: 'maria.lopez',
      email: 'maria.lopez@email.com',
      password: '$2b$10$7bNMXWNWwN/KvW3nNQMj9OEGnNcFLjS6Y.KJZrVe4Z6NQvK2X5j6q',
      fullName: 'María López Silva',
      role: 'USER',
      isActive: true,
    },
  });

  const carlos = await prisma.user.create({
    data: {
      username: 'carlos.rodriguez',
      email: 'carlos.rodriguez@email.com',
      password: '$2b$10$7bNMXWNWwN/KvW3nNQMj9OEGnNcFLjS6Y.KJZrVe4Z6NQvK2X5j6q',
      fullName: 'Carlos Rodríguez Morales',
      role: 'USER',
      isActive: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@ypg.com',
      password: '$2b$10$7bNMXWNWwN/KvW3nNQMj9OEGnNcFLjS6Y.KJZrVe4Z6NQvK2X5j6q',
      fullName: 'Administrador del Sistema',
      role: 'ADMIN',
      isActive: true,
    },
  });

  // 2.1 Crear tipos de transacción
  console.log('📝 Creando tipos de transacción...');
  
  const tipoAhorroQuota = await prisma.transactionTypeDetail.create({
    data: {
      name: 'AHORRO_QUOTA',
      nature: 'credito',
    },
  });

  const tipoAhorroMulta = await prisma.transactionTypeDetail.create({
    data: {
      name: 'AHORRO_MULTA',
      nature: 'debito',
    },
  });

  const tipoPrestamoCuota = await prisma.transactionTypeDetail.create({
    data: {
      name: 'PRESTAMO_CUOTA',
      nature: 'debito',
    },
  });

  const tipoPrestamoAbono = await prisma.transactionTypeDetail.create({
    data: {
      name: 'PRESTAMO_ABONO',
      nature: 'debito',
    },
  });

  const tipoPrestamoInteres = await prisma.transactionTypeDetail.create({
    data: {
      name: 'PRESTAMO_INTERES',
      nature: 'debito',
    },
  });

  const tipoAjuste = await prisma.transactionTypeDetail.create({
    data: {
      name: 'AJUSTE',
      nature: 'credito',
    },
  });

  // 3. Crear productos financieros de ejemplo
  console.log('🏦 Creando productos financieros...');

  const ahorroBasico = await prisma.financialProduct.create({
    data: {
      name: 'Ahorro Básico Mensual',
      type: 'AHORRO',
      description: 'Plan de ahorro mensual con cuota fija',
      monthlyAmount: 50000,
      startMonth: 1,
      startYear: 2025,
      endMonth: 12,
      endYear: 2025,
      penaltyAmount: 5000,
      graceDays: 5,
    },
  });

  const ahorroPlus = await prisma.financialProduct.create({
    data: {
      name: 'Ahorro Plus',
      type: 'AHORRO',
      description: 'Plan de ahorro con mayor rentabilidad',
      monthlyAmount: 100000,
      startMonth: 1,
      startYear: 2025,
      endMonth: 6,
      endYear: 2026,
      penaltyAmount: 10000,
      graceDays: 3,
    },
  });

  const prestamoPersonal = await prisma.financialProduct.create({
    data: {
      name: 'Préstamo Personal',
      type: 'PRESTAMO',
      description: 'Préstamo personal con cuotas fijas',
      defaultInterest: 2.5,
      termMonths: 12,
      paymentMode: 'CUOTAS_FIJAS',
    },
  });

  const creditoLibre = await prisma.financialProduct.create({
    data: {
      name: 'Crédito Libre',
      type: 'PRESTAMO',
      description: 'Crédito con abonos libres',
      defaultInterest: 3.0,
      termMonths: 24,
      paymentMode: 'ABONOS_LIBRES',
    },
  });

  // 4. Crear cuentas de productos para los usuarios
  console.log('💰 Creando cuentas de productos...');

  const cuentaJuan = await prisma.productAccount.create({
    data: {
      userId: juan.id,
      productId: ahorroBasico.id,
      amount: 600000, // Meta de ahorro para 12 meses
      isActive: true,
    },
  });

  const cuentaMaria = await prisma.productAccount.create({
    data: {
      userId: maria.id,
      productId: ahorroPlus.id,
      amount: 1800000, // Meta de ahorro para 18 meses
      isActive: true,
    },
  });

  const cuentaCarlos = await prisma.productAccount.create({
    data: {
      userId: carlos.id,
      productId: prestamoPersonal.id,
      amount: 1000000, // Monto del préstamo
      principal: 1300000, // Con intereses calculados
      interest: 2.5,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-06-01'),
      paymentMode: 'CUOTAS_FIJAS',
      isActive: true,
    },
  });

  // 5. Crear algunas transacciones de ejemplo
  console.log('💸 Creando transacciones de ejemplo...');

  // Transacciones de ahorro de Juan (3 meses pagados)
  await prisma.transaction.create({
    data: {
      accountId: cuentaJuan.id,
      typeId: tipoAhorroQuota.id,
      amount: 50000,
      status: 'PAGADA',
      date: new Date('2025-01-05'),
      dueDate: new Date('2025-01-31'),
      month: 1,
      year: 2025,
    },
  });

  await prisma.transaction.create({
    data: {
      accountId: cuentaJuan.id,
      typeId: tipoAhorroQuota.id,
      amount: 50000,
      status: 'PAGADA',
      date: new Date('2025-02-03'),
      dueDate: new Date('2025-02-28'),
      month: 2,
      year: 2025,
    },
  });

  await prisma.transaction.create({
    data: {
      accountId: cuentaJuan.id,
      typeId: tipoAhorroQuota.id,
      amount: 50000,
      status: 'PAGADA',
      date: new Date('2025-03-01'),
      dueDate: new Date('2025-03-31'),
      month: 3,
      year: 2025,
    },
  });

  // Transacciones de María (1 pago normal, 1 con multa)
  await prisma.transaction.create({
    data: {
      accountId: cuentaMaria.id,
      typeId: tipoAhorroQuota.id,
      amount: 100000,
      status: 'PAGADA',
      date: new Date('2025-01-02'),
      dueDate: new Date('2025-01-31'),
      month: 1,
      year: 2025,
    },
  });

  await prisma.transaction.create({
    data: {
      accountId: cuentaMaria.id,
      typeId: tipoAhorroQuota.id,
      amount: 100000,
      status: 'PAGADA',
      date: new Date('2025-02-08'),
      dueDate: new Date('2025-02-28'),
      month: 2,
      year: 2025,
    },
  });

  // Multa por pago tardío de María
  await prisma.transaction.create({
    data: {
      accountId: cuentaMaria.id,
      typeId: tipoAhorroMulta.id,
      amount: 10000,
      status: 'PAGADA',
      date: new Date('2025-02-08'),
      dueDate: new Date('2025-02-28'),
      month: 2,
      year: 2025,
    },
  });

  // Transacciones de préstamo de Carlos
  await prisma.transaction.create({
    data: {
      accountId: cuentaCarlos.id,
      typeId: tipoPrestamoCuota.id,
      amount: 108333, // Cuota fija calculada
      status: 'PAGADA',
      date: new Date('2024-06-15'),
      dueDate: new Date('2024-06-30'),
      month: 6,
      year: 2024,
    },
  });

  await prisma.transaction.create({
    data: {
      accountId: cuentaCarlos.id,
      typeId: tipoPrestamoCuota.id,
      amount: 108333,
      status: 'PAGADA',
      date: new Date('2024-07-20'),
      dueDate: new Date('2024-07-31'),
      month: 7,
      year: 2024,
    },
  });

  console.log('✅ Datos de prueba creados exitosamente');
  console.log(`
📊 Resumen de datos creados:
- 👥 Usuarios: 4 (3 usuarios + 1 admin)
- 📝 Tipos de transacción: 6
- 🏦 Productos financieros: 4 (2 ahorros + 2 préstamos)
- 💰 Cuentas de productos: 3
- 💸 Transacciones: 8

🔑 Credenciales de acceso:
- Usuario: juan.perez | Email: juan.perez@email.com | Contraseña: 123456
- Usuario: maria.lopez | Email: maria.lopez@email.com | Contraseña: 123456  
- Usuario: carlos.rodriguez | Email: carlos.rodriguez@email.com | Contraseña: 123456
- Admin: admin | Email: admin@ypg.com | Contraseña: 123456
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error en la población de datos:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
