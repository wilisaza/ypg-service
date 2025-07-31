import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lista de usernames de los usuarios creados
const usernames = [
  'ygaona', 'gtaborda', 'fsepulveda', 'npenagos', 'wisaza', 'darboleda',
  'nrivera', 'atrivino', 'damariles', 'aencinales', 'fmolina', 'evelasquez',
  'avalencia', 'dbernal', 'egiraldo', 'jcarrillo', 'jjaramillo', 'agarzon',
  'dvalencia', 'dmesa', 'lescandon', 'jvalencia', 'egarcia', 'fmarulanda',
  'jpava', 'smolina', 'jcabrera', 'lmazuera', 'wdussan', 'adussan', 'jpelaez'
];

async function createSavingsAccountsForUsers() {
  console.log('🚀 Iniciando creación de cuentas de plan de ahorro 2025...');
  
  try {
    // 1. Buscar el producto de plan de ahorro navideño (que ya existe en el seed)
    const savingsProduct = await prisma.product.findFirst({
      where: {
        type: 'SAVINGS',
        name: 'Plan Ahorro Navidad 2025'
      }
    });

    if (!savingsProduct) {
      console.log('❌ No se encontró el producto de Plan Ahorro Navidad 2025');
      console.log('🔧 Creando producto de plan de ahorro 2025...');
      
      // Crear el producto si no existe
      const newSavingsProduct = await prisma.product.create({
        data: {
          name: 'Plan Ahorro 2025',
          type: 'SAVINGS',
          description: 'Plan de ahorro general para el año 2025',
          monthlyAmount: 50000, // Cuota mensual fija de $50,000
          billingDay: 15, // Cobro el día 15 de cada mes
          penaltyAmount: 10000, // Multa fija de $10,000
          startMonth: 8, // Agosto
          endMonth: 12, // Diciembre
          planYear: 2025,
          graceDays: 5,
          isActive: true,
        },
      });
      
      console.log(`✅ Producto creado: ${newSavingsProduct.name} (ID: ${newSavingsProduct.id})`);
      
      // Usar el producto recién creado
      var productToUse = newSavingsProduct;
    } else {
      console.log(`✅ Producto encontrado: ${savingsProduct.name} (ID: ${savingsProduct.id})`);
      var productToUse = savingsProduct;
    }

    let createdCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // 2. Para cada usuario, crear una cuenta de plan de ahorro
    for (const username of usernames) {
      try {
        // Buscar el usuario
        const user = await prisma.user.findUnique({
          where: { username }
        });

        if (!user) {
          errors.push(`❌ Usuario ${username} no encontrado`);
          continue;
        }

        // Verificar si ya tiene una cuenta con este producto
        const existingAccount = await prisma.account.findFirst({
          where: {
            userId: user.id,
            productId: productToUse.id
          }
        });

        if (existingAccount) {
          console.log(`⚠️  Usuario ${username} ya tiene una cuenta del plan de ahorro, omitiendo...`);
          skippedCount++;
          continue;
        }

        // Crear la cuenta de plan de ahorro
        const savingsAccount = await prisma.account.create({
          data: {
            userId: user.id,
            productId: productToUse.id,
            balance: 0, // Comienzan con saldo 0
            savingsGoal: 250000, // Meta de $250,000 para diciembre
            status: 'ACTIVE'
          }
        });

        // Crear transacción inicial (registro de apertura)
        await prisma.transaction.create({
          data: {
            accountId: savingsAccount.id,
            amount: 0,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            description: `Apertura de Plan Ahorro 2025 para ${user.fullName}`,
          }
        });

        console.log(`✅ Cuenta creada para ${user.fullName} (${username}) - ID: ${savingsAccount.id}`);
        createdCount++;

      } catch (error) {
        const errorMsg = `❌ Error creando cuenta para ${username}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // 3. Resumen final
    console.log('\n📊 RESUMEN DE CREACIÓN DE CUENTAS:');
    console.log(`✅ Cuentas de ahorro creadas: ${createdCount}`);
    console.log(`⚠️  Cuentas omitidas (ya existían): ${skippedCount}`);
    console.log(`❌ Errores: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n🔍 DETALLES DE ERRORES:');
      errors.forEach(error => console.log(error));
    }

    console.log('\n💰 DETALLES DEL PLAN DE AHORRO:');
    console.log(`📦 Producto: ${productToUse.name}`);
    console.log(`💵 Cuota mensual: $${productToUse.monthlyAmount?.toLocaleString('es-CO')}`);
    console.log(`📅 Día de cobro: ${productToUse.billingDay} de cada mes`);
    console.log(`💸 Multa por atraso: $${productToUse.penaltyAmount?.toLocaleString('es-CO')}`);
    console.log(`📆 Período: ${productToUse.startMonth}/${productToUse.planYear} - ${productToUse.endMonth}/${productToUse.planYear}`);
    console.log(`🎯 Meta por usuario: $250,000`);

  } catch (error) {
    console.error('💥 Error general:', error);
    throw error;
  }
}

async function main() {
  try {
    await createSavingsAccountsForUsers();
  } catch (error) {
    console.error('💥 Error en main:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔚 Proceso completado.');
  }
}

// Ejecutar directamente
main();
