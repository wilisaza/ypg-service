import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateProductDefaults() {
  try {
    // Actualizar productos de AHORRO con valores por defecto
    const ahorroUpdate = await prisma.financialProduct.updateMany({
      where: {
        type: 'AHORRO'
      },
      data: {
        monthlyAmount: 50000,
        startMonth: 1,
        startYear: 2025,
        endMonth: 12,
        endYear: 2025
      }
    });

    console.log(`Actualizados ${ahorroUpdate.count} productos de AHORRO`);

    // Actualizar productos de PRESTAMO con valores por defecto
    const prestamoUpdate = await prisma.financialProduct.updateMany({
      where: {
        type: 'PRESTAMO'
      },
      data: {
        defaultInterest: 15.0,
        termMonths: 24
      }
    });

    console.log(`Actualizados ${prestamoUpdate.count} productos de PRESTAMO`);

    // Verificar los productos actualizados
    const allProducts = await prisma.financialProduct.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        monthlyAmount: true,
        startMonth: true,
        startYear: true,
        endMonth: true,
        endYear: true,
        defaultInterest: true,
        termMonths: true
      }
    });

    console.log('\nProductos actualizados:');
    allProducts.forEach(product => {
      if (product.type === 'AHORRO') {
        console.log(`- ${product.name} (${product.type}): $${product.monthlyAmount}/mes, ${product.startMonth}/${product.startYear} - ${product.endMonth}/${product.endYear}`);
      } else {
        console.log(`- ${product.name} (${product.type}): ${product.defaultInterest}% interés, ${product.termMonths} meses`);
      }
    });

  } catch (error) {
    console.error('Error actualizando productos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProductDefaults();
