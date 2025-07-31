const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createFrenchSystemProduct() {
  try {
    // Crear producto de préstamo de sistema francés
    const frenchProduct = await prisma.product.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Préstamo Sistema Francés',
        type: 'LOAN',
        loanType: 'FRENCH_SYSTEM',
        description: 'Préstamo con cuota fija mensual (sistema francés)',
        interestRate: 0.18, // 18% anual
        penaltyRate: 0.02,
        graceDays: 5,
        isActive: true
      }
    });

    console.log('✅ Producto de sistema francés creado:', frenchProduct.name);

    // Crear producto de ahorro
    const savingsProduct = await prisma.product.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: 'Plan de Ahorro Básico',
        type: 'SAVINGS',
        description: 'Plan de ahorro con rendimientos competitivos',
        interestRate: 0.06, // 6% anual
        minBalance: 100000,
        maxBalance: 50000000,
        monthlyFee: 5000, // Cuota de manejo
        isActive: true
      }
    });

    console.log('✅ Producto de ahorro creado:', savingsProduct.name);

    console.log('\n🎯 Productos disponibles:');
    const allProducts = await prisma.product.findMany({
      orderBy: { id: 'asc' }
    });

    allProducts.forEach(product => {
      console.log(`  ${product.id}. ${product.name} (${product.type}${product.loanType ? ` - ${product.loanType}` : ''})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFrenchSystemProduct();
