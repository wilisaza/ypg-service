import { PrismaClient } from '@prisma/client';
import { addDays, startOfMonth, addMonths } from 'date-fns';

const prisma = new PrismaClient();

export class SavingsQuotaService {
  
  /**
   * Genera cuotas mensuales para todos los planes de ahorro activos
   * Se ejecuta el primer día de cada mes
   */
  async generateMonthlyQuotas() {
    console.log('📅 Iniciando generación de cuotas mensuales...');
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    try {
      // Obtener todas las cuentas de ahorro activas
      const savingsAccounts = await prisma.productAccount.findMany({
        where: {
          isActive: true,
          product: {
            type: 'AHORRO'
          }
        },
        include: {
          product: true,
          user: true
        }
      });

      console.log(`💰 Encontradas ${savingsAccounts.length} cuentas de ahorro activas`);

      // Obtener el tipo de transacción para cuotas de ahorro
      const quotaType = await prisma.transactionTypeDetail.findFirst({
        where: { name: 'CUOTA_AHORRO_MENSUAL' }
      });

      if (!quotaType) {
        throw new Error('Tipo de transacción CUOTA_AHORRO_MENSUAL no encontrado');
      }

      let quotasCreated = 0;

      for (const account of savingsAccounts) {
        const { product } = account;
        
        // Verificar si ya existe una cuota para este mes/año
        const existingQuota = await prisma.transaction.findFirst({
          where: {
            accountId: account.id,
            typeId: quotaType.id,
            month: currentMonth,
            year: currentYear
          }
        });

        if (existingQuota) {
          console.log(`ℹ️  Cuota ya existe para ${account.user.fullName} - ${product.name}`);
          continue;
        }

        // Verificar si el producto está en período activo
        if (product.startMonth && product.startYear) {
          const productStartDate = new Date(product.startYear, product.startMonth - 1, 1);
          if (currentDate < productStartDate) {
            console.log(`⏳ Producto ${product.name} aún no ha iniciado`);
            continue;
          }
        }

        if (product.endMonth && product.endYear) {
          const productEndDate = new Date(product.endYear, product.endMonth - 1, 1);
          if (currentDate > productEndDate) {
            console.log(`⏰ Producto ${product.name} ya finalizó`);
            continue;
          }
        }

        // Crear la cuota mensual
        const dueDate = addDays(startOfMonth(currentDate), product.graceDays || 5);
        
        await prisma.transaction.create({
          data: {
            accountId: account.id,
            amount: product.monthlyAmount || 0,
            typeId: quotaType.id,
            status: 'PENDIENTE',
            dueDate: dueDate,
            month: currentMonth,
            year: currentYear
          }
        });

        quotasCreated++;
        console.log(`✅ Cuota creada para ${account.user.fullName} - ${product.name} por $${product.monthlyAmount}`);
      }

      console.log(`🎉 Generación completada: ${quotasCreated} cuotas creadas`);
      return quotasCreated;

    } catch (error) {
      console.error('❌ Error generando cuotas mensuales:', error);
      throw error;
    }
  }
}

export default SavingsQuotaService;
