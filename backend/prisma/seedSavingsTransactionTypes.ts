import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSavingsTransactionTypes() {
  console.log('🌱 Agregando tipos de transacción para flujo de ahorros...');

  // Tipos de transacción para el flujo de ahorros
  const transactionTypes = [
    {
      name: 'CUOTA_AHORRO_MENSUAL',
      nature: 'debito'
    },
    {
      name: 'MULTA_PAGO_TARDIO',
      nature: 'debito'
    },
    {
      name: 'PAGO_USUARIO',
      nature: 'credito'
    },
    {
      name: 'INTERES_PRESTAMO',
      nature: 'debito'
    }
  ];

  for (const type of transactionTypes) {
    const existing = await prisma.transactionTypeDetail.findUnique({
      where: { name: type.name }
    });

    if (!existing) {
      await prisma.transactionTypeDetail.create({
        data: type
      });
      console.log(`✅ Creado tipo de transacción: ${type.name}`);
    } else {
      console.log(`ℹ️  Tipo de transacción ya existe: ${type.name}`);
    }
  }

  console.log('✅ Tipos de transacción para ahorros agregados correctamente');
}

seedSavingsTransactionTypes()
  .catch((e) => {
    console.error('❌ Error al agregar tipos de transacción:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
