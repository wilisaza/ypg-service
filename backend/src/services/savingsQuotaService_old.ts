import { PrismaClient } from '@prisma/client';
import { addDays, startOfMonth, addMonths } from 'date-fns';

const prisma = new PrismaClient();

export class SavingsQuotaService {
  
  /**
   * Genera cuotas mensuales para todos los planes de ahorro activos
   * Se ejecuta el primer día de cada mes
   */
  async generateMonthlyQuotas() {
    console.log('📅 Servicio temporalmente deshabilitado - requiere actualización de modelos');
    // TODO: Actualizar para usar modelos Product, Account, Transaction del schema actual
    return 0;
  }
}

export default SavingsQuotaService;
