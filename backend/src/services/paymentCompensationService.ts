import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PaymentCompensationService {
  
  /**
   * Procesa un pago realizado por el usuario y compensa multas y cuotas pendientes
   * @param accountId ID de la cuenta
   * @param paymentAmount Monto del pago
   * @param paymentDate Fecha del pago (opcional, por defecto hoy)
   */
  async processPayment(accountId: string, paymentAmount: number, paymentDate?: Date) {
    console.log(`💳 Procesando pago de $${paymentAmount} para cuenta ${accountId}`);
    
    const currentDate = paymentDate || new Date();
    
    try {
      // Obtener tipos de transacción
      const paymentType = await prisma.transactionTypeDetail.findFirst({
        where: { name: 'PAGO' }
      });
      
      const penaltyType = await prisma.transactionTypeDetail.findFirst({
        where: { name: 'MULTA' }
      });
      
      const quotaType = await prisma.transactionTypeDetail.findFirst({
        where: { name: 'CUOTA_AHORRO_MENSUAL' }
      });

      if (!paymentType || !penaltyType || !quotaType) {
        throw new Error('Tipos de transacción requeridos no encontrados');
      }

      // Registrar el pago del usuario
      const paymentTransaction = await prisma.transaction.create({
        data: {
          accountId,
          amount: paymentAmount,
          typeId: paymentType.id,
          status: 'PAGADA',
          date: currentDate
        }
      });

      console.log(`✅ Pago registrado con ID: ${paymentTransaction.id}`);

      let remainingAmount = paymentAmount;
      const compensatedTransactions = [];

      // PASO 1: Compensar multas pendientes (por orden de antigüedad)
      const pendingPenalties = await prisma.transaction.findMany({
        where: {
          accountId,
          typeId: penaltyType.id,
          status: 'PENDIENTE'
        },
        orderBy: {
          date: 'asc' // Más antiguas primero
        }
      });

      console.log(`💸 ${pendingPenalties.length} multas pendientes encontradas`);

      for (const penalty of pendingPenalties) {
        if (remainingAmount <= 0) break;

        if (remainingAmount >= penalty.amount) {
          // Pago completo de la multa
          await prisma.transaction.update({
            where: { id: penalty.id },
            data: { 
              status: 'PAGADA',
              relatedTransactionId: paymentTransaction.id
            }
          });
          
          remainingAmount -= penalty.amount;
          compensatedTransactions.push({
            type: 'MULTA',
            id: penalty.id,
            amount: penalty.amount,
            compensation: 'TOTAL'
          });
          
          console.log(`✅ Multa ${penalty.id} pagada completamente ($${penalty.amount})`);
        } else {
          // Pago parcial de la multa (crear nueva transacción por la diferencia)
          await prisma.transaction.update({
            where: { id: penalty.id },
            data: { 
              amount: penalty.amount - remainingAmount
            }
          });

          // Crear transacción por el monto pagado
          await prisma.transaction.create({
            data: {
              accountId,
              amount: remainingAmount,
              typeId: penaltyType.id,
              status: 'PAGADA',
              relatedTransactionId: paymentTransaction.id
            }
          });

          compensatedTransactions.push({
            type: 'MULTA',
            id: penalty.id,
            amount: remainingAmount,
            compensation: 'PARCIAL'
          });

          console.log(`⚡ Multa ${penalty.id} pagada parcialmente ($${remainingAmount} de $${penalty.amount})`);
          remainingAmount = 0;
        }
      }

      // PASO 2: Compensar cuotas pendientes (por orden de vencimiento)
      if (remainingAmount > 0) {
        const pendingQuotas = await prisma.transaction.findMany({
          where: {
            accountId,
            typeId: quotaType.id,
            status: {
              in: ['PENDIENTE', 'VENCIDA']
            }
          },
          orderBy: [
            { year: 'asc' },
            { month: 'asc' }
          ]
        });

        console.log(`📅 ${pendingQuotas.length} cuotas pendientes encontradas`);

        for (const quota of pendingQuotas) {
          if (remainingAmount <= 0) break;

          if (remainingAmount >= quota.amount) {
            // Pago completo de la cuota
            await prisma.transaction.update({
              where: { id: quota.id },
              data: { 
                status: 'PAGADA',
                relatedTransactionId: paymentTransaction.id
              }
            });
            
            remainingAmount -= quota.amount;
            compensatedTransactions.push({
              type: 'CUOTA',
              id: quota.id,
              amount: quota.amount,
              compensation: 'TOTAL'
            });
            
            console.log(`✅ Cuota ${quota.month}/${quota.year} pagada completamente ($${quota.amount})`);
          } else {
            // Pago parcial de la cuota
            await prisma.transaction.update({
              where: { id: quota.id },
              data: { 
                amount: quota.amount - remainingAmount
              }
            });

            // Crear transacción por el monto pagado
            await prisma.transaction.create({
              data: {
                accountId,
                amount: remainingAmount,
                typeId: quotaType.id,
                status: 'PAGADA',
                relatedTransactionId: paymentTransaction.id,
                month: quota.month,
                year: quota.year
              }
            });

            compensatedTransactions.push({
              type: 'CUOTA',
              id: quota.id,
              amount: remainingAmount,
              compensation: 'PARCIAL'
            });

            console.log(`⚡ Cuota ${quota.month}/${quota.year} pagada parcialmente ($${remainingAmount} de $${quota.amount})`);
            remainingAmount = 0;
          }
        }
      }

      // Resultado del procesamiento
      const result = {
        paymentId: paymentTransaction.id,
        originalAmount: paymentAmount,
        compensatedAmount: paymentAmount - remainingAmount,
        remainingAmount,
        compensatedTransactions,
        summary: {
          penaltiesPaid: compensatedTransactions.filter(t => t.type === 'MULTA').length,
          quotasPaid: compensatedTransactions.filter(t => t.type === 'CUOTA').length
        }
      };

      console.log(`🎉 Procesamiento completado:`);
      console.log(`   - Monto compensado: $${result.compensatedAmount}`);
      console.log(`   - Monto restante: $${result.remainingAmount}`);
      console.log(`   - Multas pagadas: ${result.summary.penaltiesPaid}`);
      console.log(`   - Cuotas pagadas: ${result.summary.quotasPaid}`);

      return result;

    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      throw error;
    }
  }

  /**
   * Obtiene el resumen de deuda de una cuenta
   */
  async getDebtSummary(accountId: string) {
    try {
      const [pendingPenalties, pendingQuotas] = await Promise.all([
        // Multas pendientes
        prisma.transaction.aggregate({
          where: {
            accountId,
            type: { name: 'MULTA' },
            status: 'PENDIENTE'
          },
          _sum: { amount: true },
          _count: true
        }),
        
        // Cuotas pendientes/vencidas
        prisma.transaction.aggregate({
          where: {
            accountId,
            type: { name: 'CUOTA_AHORRO_MENSUAL' },
            status: { in: ['PENDIENTE', 'VENCIDA'] }
          },
          _sum: { amount: true },
          _count: true
        })
      ]);

      const summary = {
        totalDebt: (pendingPenalties._sum.amount || 0) + (pendingQuotas._sum.amount || 0),
        penalties: {
          amount: pendingPenalties._sum.amount || 0,
          count: pendingPenalties._count
        },
        quotas: {
          amount: pendingQuotas._sum.amount || 0,
          count: pendingQuotas._count
        }
      };

      return summary;

    } catch (error) {
      console.error('❌ Error obteniendo resumen de deuda:', error);
      throw error;
    }
  }
}

export default PaymentCompensationService;
