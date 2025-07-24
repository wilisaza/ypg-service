import { PrismaClient, TransactionType, TransactionStatus, ProductType } from '@prisma/client';
import { BusinessDaysUtil } from '../utils/businessDays.js';

const prisma = new PrismaClient();

export class SavingsQuotaService {
  
  /**
   * Genera cuotas mensuales para todas las cuentas de ahorro activas
   * Se ejecuta automáticamente el primer día de cada mes
   * @param month Mes para generar cuotas (opcional, por defecto mes actual)
   * @param year Año para generar cuotas (opcional, por defecto año actual)
   */
  async generateMonthlyQuotas(month?: number, year?: number) {
    console.log('🏦 Iniciando generación de cuotas mensuales...');
    
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();
    
    console.log(`📅 Generando cuotas para: ${targetMonth}/${targetYear}`);
    
    try {
      // Obtener todas las cuentas de ahorro activas
      const savingsAccounts = await prisma.account.findMany({
        where: { 
          product: { type: ProductType.SAVINGS },
          status: 'ACTIVE'
        },
        include: { 
          product: true,
          user: true
        }
      });

      console.log(`📊 Encontradas ${savingsAccounts.length} cuentas de ahorro activas`);

      let quotasCreated = 0;
      let quotasSkipped = 0;

      for (const account of savingsAccounts) {
        const { product, user } = account;
        
        // Verificar si ya existe una cuota para este mes
        const existingQuota = await prisma.transaction.findFirst({
          where: {
            accountId: account.id,
            type: TransactionType.FEE_PAYMENT,
            month: targetMonth,
            year: targetYear
          }
        });

        if (existingQuota) {
          console.log(`⚠️  Ya existe cuota para ${user.fullName} - ${product.name} (${targetMonth}/${targetYear})`);
          quotasSkipped++;
          continue;
        }

        // Calcular fecha límite de pago usando días hábiles
        const dueDate = BusinessDaysUtil.calculatePaymentDueDate(
          targetMonth,
          targetYear,
          product.graceDays || 5
        );

        // Obtener el monto de la cuota mensual del producto
        const quotaAmount = product.monthlyFee || 0;

        if (quotaAmount > 0) {
          // Crear la transacción de cuota mensual
          await prisma.transaction.create({
            data: {
              accountId: account.id,
              amount: quotaAmount,
              type: TransactionType.FEE_PAYMENT,
              status: TransactionStatus.PENDING,
              dueDate: dueDate,
              month: targetMonth,
              year: targetYear,
              description: `Cuota de ahorro ${targetMonth}/${targetYear} - ${product.name}`
            }
          });
          
          quotasCreated++;
          console.log(`✅ Cuota creada para ${user.fullName}: $${quotaAmount.toLocaleString('es-CO')} (vence: ${dueDate.toLocaleDateString('es-CO')})`);
        } else {
          console.log(`ℹ️  No se genera cuota para ${user.fullName} - ${product.name} (monto: $0)`);
          quotasSkipped++;
        }
      }

      console.log(`📊 Generación completada:`);
      console.log(`   - ${quotasCreated} cuotas creadas`);
      console.log(`   - ${quotasSkipped} cuentas omitidas`);
      console.log(`   - Fecha límite calculada con días hábiles colombianos`);
      
      return {
        quotasCreated,
        quotasSkipped,
        targetMonth,
        targetYear
      };

    } catch (error) {
      console.error('❌ Error generando cuotas mensuales:', error);
      throw error;
    }
  }

  /**
   * Obtiene resumen de cuotas por cuenta
   * @param accountId ID de la cuenta
   * @param year Año a consultar (opcional)
   */
  async getQuotaSummary(accountId: string, year?: number) {
    try {
      const currentYear = year || new Date().getFullYear();
      
      const quotas = await prisma.transaction.findMany({
        where: {
          accountId,
          type: TransactionType.FEE_PAYMENT,
          year: currentYear
        },
        orderBy: { month: 'asc' }
      });

      const totalPending = quotas
        .filter(q => q.status === TransactionStatus.PENDING)
        .reduce((sum, q) => sum + q.amount, 0);

      const totalOverdue = quotas
        .filter(q => q.status === TransactionStatus.OVERDUE)
        .reduce((sum, q) => sum + q.amount, 0);

      const totalPaid = quotas
        .filter(q => q.status === TransactionStatus.COMPLETED)
        .reduce((sum, q) => sum + q.amount, 0);

      return {
        year: currentYear,
        totalQuotas: quotas.length,
        totalPending,
        totalOverdue,
        totalPaid,
        quotas
      };

    } catch (error) {
      console.error('❌ Error obteniendo resumen de cuotas:', error);
      throw error;
    }
  }

  /**
   * Simula la generación de cuotas para un mes específico
   * Útil para testing y recuperación de datos
   * @param month Mes (1-12)
   * @param year Año
   */
  async simulateMonthlyQuotas(month: number, year: number) {
    console.log(`🔄 Simulando generación de cuotas para ${month}/${year}`);
    
    // Verificar que la fecha sea válida
    if (month < 1 || month > 12) {
      throw new Error('Mes debe estar entre 1 y 12');
    }

    if (year < 2020 || year > 2030) {
      throw new Error('Año debe estar entre 2020 y 2030');
    }

    return await this.generateMonthlyQuotas(month, year);
  }
}
