import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTransactionTypeDetail() {
  console.log('🔄 Actualizando tipos de transacción existentes...');

  // Verificar tipos existentes
  const existingTypes = await prisma.transactionTypeDetail.findMany();
  console.log('Tipos existentes:', existingTypes);

  // Mapeo de actualizaciones necesarias
  const updates = [
    { oldName: 'CUOTA PERIODICA', newName: 'CUOTA_AHORRO_MENSUAL', nature: 'debito' },
    // Los demás ya tienen buenos nombres, solo verificamos que existan
  ];

  // Actualizar nombres si es necesario
  for (const update of updates) {
    const existing = await prisma.transactionTypeDetail.findFirst({
      where: { name: update.oldName }
    });

    if (existing) {
      await prisma.transactionTypeDetail.update({
        where: { id: existing.id },
        data: { 
          name: update.newName,
          nature: update.nature 
        }
      });
      console.log(`✅ Actualizado: ${update.oldName} → ${update.newName}`);
    }
  }

  // Agregar tipos faltantes si no existen
  const requiredTypes = [
    { name: 'CUOTA_AHORRO_MENSUAL', nature: 'debito' },
    { name: 'MULTA', nature: 'debito' },
    { name: 'PAGO', nature: 'credito' },
    { name: 'INTERES', nature: 'debito' }
  ];

  for (const type of requiredTypes) {
    const existing = await prisma.transactionTypeDetail.findFirst({
      where: { name: type.name }
    });

    if (!existing) {
      await prisma.transactionTypeDetail.create({
        data: type
      });
      console.log(`➕ Agregado: ${type.name}`);
    } else {
      console.log(`ℹ️  Ya existe: ${type.name}`);
    }
  }

  console.log('✅ Actualización completada');
}

updateTransactionTypeDetail()
  .catch((e) => {
    console.error('❌ Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
