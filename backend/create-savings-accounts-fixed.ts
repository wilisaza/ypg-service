import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSavingsAccounts() {
  try {
    console.log('🔍 Buscando el producto "Ahorro 2025"...');
    
    // Buscar el producto existente
    const savingsProduct = await prisma.product.findFirst({
      where: { 
        name: "Ahorro 2025",
        type: "SAVINGS",
        isActive: true
      }
    });

    if (!savingsProduct) {
      console.error('❌ No se encontró el producto "Ahorro 2025"');
      return;
    }

    console.log(`✅ Producto encontrado: ID ${savingsProduct.id} - ${savingsProduct.name}`);

    // Obtener todos los usuarios activos
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { username: 'asc' }
    });

    console.log(`👥 Se encontraron ${users.length} usuarios activos`);

    let accountsCreated = 0;
    let errors = 0;

    // Crear cuentas para cada usuario
    for (const user of users) {
      try {
        // Verificar si ya tiene una cuenta con este producto
        const existingAccount = await prisma.account.findFirst({
          where: {
            userId: user.id,
            productId: savingsProduct.id
          }
        });

        if (existingAccount) {
          console.log(`⚠️  Usuario ${user.username} ya tiene una cuenta de Ahorro 2025`);
          continue;
        }

        // Crear la cuenta
        const account = await prisma.account.create({
          data: {
            userId: user.id,
            productId: savingsProduct.id,
            balance: 0,
            savingsGoal: 250000, // Meta de ahorro
            status: 'ACTIVE'
          }
        });

        console.log(`✅ Cuenta creada para ${user.username} - ID: ${account.id}`);
        accountsCreated++;

      } catch (error) {
        console.error(`❌ Error creando cuenta para ${user.username}:`, error);
        errors++;
      }
    }

    console.log('\n📊 RESUMEN:');
    console.log(`✅ Cuentas creadas exitosamente: ${accountsCreated}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📋 Producto utilizado: ${savingsProduct.name} (ID: ${savingsProduct.id})`);

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSavingsAccounts();
