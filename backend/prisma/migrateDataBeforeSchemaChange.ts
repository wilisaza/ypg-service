import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateDataBeforeSchemaChange() {
  console.log('Iniciando migración de datos...');
  
  try {
    // 1. Obtener todas las cuentas de ahorro con month y year
    const savingsAccounts = await prisma.productAccount.findMany({
      where: {
        OR: [
          { month: { not: null } },
          { year: { not: null } }
        ]
      },
      include: {
        product: true
      }
    });

    console.log(`Encontradas ${savingsAccounts.length} cuentas de ahorro con datos de month/year`);

    // 2. Para cada cuenta, actualizar el producto financiero con los datos por defecto
    for (const account of savingsAccounts) {
      if (account.product.type === 'AHORRO') {
        // Calcular datos por defecto basados en la cuenta existente
        const monthlyAmount = account.amount; // Asumiendo que amount era el monto mensual
        const endMonth = account.month || 12;
        const endYear = account.year || new Date().getFullYear();
        
        // Actualizar el producto financiero con valores por defecto
        await prisma.financialProduct.update({
          where: { id: account.product.id },
          data: {
            monthlyAmount: monthlyAmount,
            startMonth: 1, // Enero por defecto
            startYear: new Date().getFullYear(),
            endMonth: endMonth,
            endYear: endYear,
          }
        });

        console.log(`Actualizado producto ${account.product.name} con datos de ahorro`);
      }
    }

    console.log('Migración de datos completada exitosamente');
  } catch (error) {
    console.error('Error durante la migración de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateDataBeforeSchemaChange();
