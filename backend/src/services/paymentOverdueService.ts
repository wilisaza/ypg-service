import { PrismaClient } from '@prisma/client';
import { isAfter, isToday } from 'date-fns';

const prisma = new PrismaClient();

export class PaymentOverdueService {
  
  /**
   * Detecta cuotas vencidas y genera multas automáticamente
   * Se ejecuta diariamente
   */
  async processOverduePayments() {
    console.log('⏰ Iniciando procesamiento de pagos vencidos...');
    
    const currentDate = new Date();
    
    try {
      // Buscar cuotas pendientes que ya vencieron
      const overdueQuotas = await prisma.transaction.findMany({
        where: {
          status: 'PENDIENTE',
          dueDate: {
            lt: currentDate // Menor que la fecha actual
          },
          type: {
            name: 'CUOTA_AHORRO_MENSUAL'
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

      // Obtener el tipo de transacción para multas
      const penaltyType = await prisma.transactionTypeDetail.findFirst({
        where: { name: 'MULTA' }
      });

      if (!penaltyType) {
        throw new Error('Tipo de transacción MULTA no encontrado');
      }

      let quotasUpdated = 0;
      let penaltiesCreated = 0;

      for (const quota of overdueQuotas) {
        const { account } = quota;
        const { product, user } = account;
        
        // Cambiar estado de la cuota a VENCIDA
        await prisma.transaction.update({
          where: { id: quota.id },
          data: { status: 'VENCIDA' }
        });
        quotasUpdated++;

        // Verificar si ya existe una multa para esta cuota
        const existingPenalty = await prisma.transaction.findFirst({
          where: {
            accountId: account.id,
            typeId: penaltyType.id,
            relatedTransactionId: quota.id
          }
        });

        if (existingPenalty) {
          console.log(`ℹ️  Multa ya existe para cuota ${quota.id}`);
          continue;
        }

        // Crear multa asociada a la cuota vencida
        const penaltyAmount = product.penaltyAmount || 0;
        
        if (penaltyAmount > 0) {
          await prisma.transaction.create({
            data: {
              accountId: account.id,
              amount: penaltyAmount,
              typeId: penaltyType.id,
              status: 'PENDIENTE',
              relatedTransactionId: quota.id,
              month: quota.month,
              year: quota.year
            }
          });
          
          penaltiesCreated++;
          console.log(`💸 Multa creada para ${user.fullName} - Cuota ${quota.month}/${quota.year} por $${penaltyAmount}`);
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
   */
  async sendPaymentReminders() {
    console.log('📧 Enviando recordatorios de pago...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    try {
      // Buscar cuotas que vencen mañana
      const upcomingQuotas = await prisma.transaction.findMany({
        where: {
          status: 'PENDIENTE',
          dueDate: {
            gte: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()),
            lt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1)
          },
          type: {
            name: 'CUOTA_AHORRO_MENSUAL'
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
        console.log(`📬 Recordatorio: ${user.fullName} - ${product.name} vence mañana ($${quota.amount})`);
      }

      return upcomingQuotas.length;

    } catch (error) {
      console.error('❌ Error enviando recordatorios:', error);
      throw error;
    }
  }
}

export default PaymentOverdueService;
