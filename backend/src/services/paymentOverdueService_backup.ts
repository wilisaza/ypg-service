import { PrismaClient } from '@prisma/client';
import { isAfter, isToday } from 'date-fns';

const prisma = new PrismaClient();

export class PaymentOverdueService {
  
  /**
   * Detecta cuotas vencidas y genera multas automáticamente
   * Se ejecuta diariamente
   */
  async processOverduePayments() {
    console.log('⏰ Servicio temporalmente deshabilitado - requiere actualización de modelos');
    // TODO: Actualizar para usar modelos Product, Account, Transaction del schema actual
    return { quotasUpdated: 0, penaltiesCreated: 0 };
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
