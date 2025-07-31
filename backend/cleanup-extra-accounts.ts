import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupExtraAccounts() {
  try {
    console.log('🧹 Limpiando cuentas de ahorro de usuarios existentes...');
    
    // Buscar el producto "Ahorro 2025"
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

    const usersToClean = ['admin', 'johndoe'];
    let accountsDeleted = 0;

    for (const username of usersToClean) {
      // Buscar el usuario
      const user = await prisma.user.findUnique({
        where: { username: username }
      });

      if (!user) {
        console.log(`⚠️  Usuario ${username} no encontrado`);
        continue;
      }

      // Buscar cuentas de ahorro del usuario
      const accounts = await prisma.account.findMany({
        where: {
          userId: user.id,
          productId: savingsProduct.id
        }
      });

      if (accounts.length === 0) {
        console.log(`ℹ️  Usuario ${username} no tiene cuentas de ahorro`);
        continue;
      }

      // Eliminar las cuentas
      for (const account of accounts) {
        await prisma.account.delete({
          where: { id: account.id }
        });
        
        console.log(`🗑️  Cuenta eliminada: ${account.id} (Usuario: ${username})`);
        accountsDeleted++;
      }
    }

    console.log('\n📊 RESUMEN:');
    console.log(`🗑️  Cuentas eliminadas: ${accountsDeleted}`);
    console.log(`✅ Ahora solo deben quedar 31 cuentas de ahorro (para los 31 usuarios nuevos)`);

    // Verificar el total final
    const remainingAccounts = await prisma.account.count({
      where: { productId: savingsProduct.id }
    });
    
    console.log(`📈 Total de cuentas de ahorro restantes: ${remainingAccounts}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupExtraAccounts();
