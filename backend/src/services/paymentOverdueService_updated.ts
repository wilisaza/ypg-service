import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';
import { BusinessDaysUtil } from '../utils/businessDays.js';

const prisma = new PrismaClient();

export class PaymentOverdueService {
  
  /**
   * Detecta cuotas vencidas y genera multas automáticamente
   * Se ejecuta diariamente via cron job
   */
  async processOverduePayments() {
    console.log('⏰ Iniciando procesamiento de pagos vencidos...');
    
    const currentDate = new Date();
    
    try {
      // Buscar cuotas de ahorro pendientes que ya vencieron
      const overdueQuotas = await prisma.transaction.findMany({
        where: {
          type: TransactionType.FEE_PAYMENT,
          status: TransactionStatus.PENDING,
          dueDate: {
            lt: currentDate // Fecha límite menor que hoy
          }
        },
        include: {
          account: {
            include: {
              product: true,
              user: true
            }
          }
        }
      });

      console.log(`⚠️  Encontradas ${overdueQuotas.length} cuotas vencidas`);

      let quotasUpdated = 0;
      let penaltiesCreated = 0;

      for (const quota of overdueQuotas) {
        const { account } = quota;
        const { product, user } = account;
        
        // 1. Cambiar estado de la cuota a VENCIDA
        await prisma.transaction.update({
          where: { id: quota.id },
          data: { status: TransactionStatus.OVERDUE }
        });
        quotasUpdated++;

        // 2. Verificar si ya existe una multa para esta cuota
        const existingPenalty = await prisma.transaction.findFirst({
          where: {
            accountId: account.id,
            type: TransactionType.PENALTY_FEE,
            month: quota.month, // Multa del mismo mes que la cuota
            year: quota.year
          }
        });

        if (existingPenalty) {
          console.log(`ℹ️  Multa ya existe para ${user.fullName} - ${quota.month}/${quota.year}`);
          continue;
        }

        // 3. Crear multa si el producto tiene penaltyRate configurado
        const penaltyAmount = product.penaltyRate || 0; // Tratamos penaltyRate como monto fijo
        
        if (penaltyAmount > 0) {
          // Calcular fecha límite original para referencia
          const originalDueDate = BusinessDaysUtil.calculatePaymentDueDate(
            quota.month || currentDate.getMonth() + 1,
            quota.year || currentDate.getFullYear(),
            product.graceDays || 5
          );

          await prisma.transaction.create({
            data: {
              accountId: account.id,
              amount: penaltyAmount,
              type: TransactionType.PENALTY_FEE,
              status: TransactionStatus.PENDING,
              month: quota.month, // Misma fecha que la cuota
              year: quota.year,
              description: `Multa por atraso - Cuota ${quota.month}/${quota.year}`,
              dueDate: originalDueDate // Mantener referencia a la fecha límite original
            }
          });
          
          penaltiesCreated++;
          console.log(`💸 Multa creada para ${user.fullName} - Cuota ${quota.month}/${quota.year} por $${penaltyAmount.toLocaleString('es-CO')}`);
        } else {
          console.log(`ℹ️  No se genera multa para ${product.name} (monto de multa: $0)`);
        }
      }

      console.log(`📊 Procesamiento completado:`);
      console.log(`   - ${quotasUpdated} cuotas marcadas como VENCIDAS`);
      console.log(`   - ${penaltiesCreated} multas generadas`);
      
      return {
        quotasUpdated,
        penaltiesCreated
      };

    } catch (error) {
      console.error('❌ Error procesando pagos vencidos:', error);
      throw error;
    }
  }

  /**
   * Envía recordatorios de pago próximos a vencer
   * Busca cuotas que vencen en los próximos 2 días hábiles
   */
  async sendPaymentReminders() {
    console.log('📧 Enviando recordatorios de pago...');
    
    const currentDate = new Date();
    
    // Calcular fecha límite para recordatorios (2 días hábiles antes del vencimiento)
    const reminderDate = BusinessDaysUtil.addBusinessDays(currentDate, 2);
    
    try {
      const upcomingQuotas = await prisma.transaction.findMany({
        where: {
          type: TransactionType.FEE_PAYMENT,
          status: TransactionStatus.PENDING,
          dueDate: {
            gte: currentDate,
            lte: reminderDate
          }
        },
        include: {
          account: {
            include: {
              product: true,
              user: true
            }
          }
        }
      });

      console.log(`📮 ${upcomingQuotas.length} recordatorios a enviar`);

      for (const quota of upcomingQuotas) {
        const { account } = quota;
        const { product, user } = account;
        
        // Aquí se implementaría el envío de email/SMS/notificación
        console.log(`📬 Recordatorio: ${user.fullName} - ${product.name} vence ${quota.dueDate?.toLocaleDateString('es-CO')} ($${quota.amount.toLocaleString('es-CO')})`);
      }

      return upcomingQuotas.length;

    } catch (error) {
      console.error('❌ Error enviando recordatorios:', error);
      throw error;
    }
  }

  /**
   * Obtiene resumen de multas por cuenta
   * @param accountId ID de la cuenta
   */
  async getPenaltySummary(accountId: string) {
    try {
      const penalties = await prisma.transaction.findMany({
        where: {
          accountId,
          type: TransactionType.PENALTY_FEE
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ]
      });

      const totalPending = penalties
        .filter(p => p.status === TransactionStatus.PENDING)
        .reduce((sum, p) => sum + p.amount, 0);

      const totalPaid = penalties
        .filter(p => p.status === TransactionStatus.COMPLETED)
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        totalPenalties: penalties.length,
        totalPending,
        totalPaid,
        penalties
      };

    } catch (error) {
      console.error('❌ Error obteniendo resumen de multas:', error);
      throw error;
    }
  }
}
