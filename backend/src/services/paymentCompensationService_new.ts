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
    console.log('💳 Servicio temporalmente deshabilitado - requiere actualización de modelos');
    // TODO: Actualizar para usar modelos Product, Account, Transaction del schema actual
    return { paymentId: null, compensatedTransactions: [], excessAmount: paymentAmount };
  }

  /**
   * Obtiene un resumen de la deuda de una cuenta
   */
  async getDebtSummary(accountId: string) {
    console.log('📊 Servicio temporalmente deshabilitado - requiere actualización de modelos');
    // TODO: Actualizar para usar modelos Product, Account, Transaction del schema actual
    return { 
      totalPendingPenalties: 0, 
      totalPendingQuotas: 0, 
      totalDebt: 0, 
      oldestDebt: null 
    };
  }
}
