import cron from 'node-cron';
import { SavingsQuotaService } from './savingsQuotaService.js';
import { PaymentOverdueService } from './paymentOverdueService.js';
import { logger } from '../utils/logger.js';

export class CronJobService {
  private savingsQuotaService: SavingsQuotaService;
  private paymentOverdueService: PaymentOverdueService;

  constructor() {
    this.savingsQuotaService = new SavingsQuotaService();
    this.paymentOverdueService = new PaymentOverdueService();
  }

  /**
   * Inicia todos los trabajos programados
   */
  startAllJobs() {
    logger.info('🚀 Iniciando trabajos programados (Cron Jobs)...');

    // Generar cuotas mensuales - Cada 1ro de mes a las 6:00 AM
    this.scheduleMonthlyQuotaGeneration();
    
    // Procesar pagos vencidos - Diariamente a las 8:00 AM
    this.scheduleOverduePaymentProcessing();
    
    // Enviar recordatorios - Diariamente a las 10:00 AM
    this.schedulePaymentReminders();

    logger.info('✅ Todos los Cron Jobs han sido programados');
  }

  /**
   * Programar generación de cuotas mensuales
   * Cron: "0 6 1 * *" = Cada 1ro de mes a las 6:00 AM
   */
  private scheduleMonthlyQuotaGeneration() {
    cron.schedule('0 6 1 * *', async () => {
      logger.info('📅 Ejecutando generación de cuotas mensuales...');
      
      try {
        const quotasCreated = await this.savingsQuotaService.generateMonthlyQuotas();
        logger.info(`✅ Generación completada: ${quotasCreated} cuotas creadas`);
      } catch (error) {
        logger.error(`❌ Error en generación de cuotas: ${error}`);
      }
    }, {
      timezone: "America/Bogota"
    });

    logger.info('📅 Cron Job programado: Generación de cuotas mensuales (1ro de cada mes 6:00 AM)');
  }

  /**
   * Programar procesamiento de pagos vencidos
   * Cron: "0 8 * * *" = Diariamente a las 8:00 AM
   */
  private scheduleOverduePaymentProcessing() {
    cron.schedule('0 8 * * *', async () => {
      logger.info('⏰ Ejecutando procesamiento de pagos vencidos...');
      
      try {
        const result = await this.paymentOverdueService.processOverduePayments();
        logger.info(`✅ Procesamiento completado: ${result.quotasUpdated} cuotas vencidas, ${result.penaltiesCreated} multas generadas`);
      } catch (error) {
        logger.error(`❌ Error en procesamiento de vencidos: ${error}`);
      }
    }, {
      timezone: "America/Bogota"
    });

    logger.info('⏰ Cron Job programado: Procesamiento de vencidos (diario 8:00 AM)');
  }

  /**
   * Programar envío de recordatorios
   * Cron: "0 10 * * *" = Diariamente a las 10:00 AM
   */
  private schedulePaymentReminders() {
    cron.schedule('0 10 * * *', async () => {
      logger.info('📧 Ejecutando envío de recordatorios...');
      
      try {
        const remindersSent = await this.paymentOverdueService.sendPaymentReminders();
        logger.info(`✅ Recordatorios enviados: ${remindersSent}`);
      } catch (error) {
        logger.error(`❌ Error en envío de recordatorios: ${error}`);
      }
    }, {
      timezone: "America/Bogota"
    });

    logger.info('📧 Cron Job programado: Recordatorios de pago (diario 10:00 AM)');
  }

  /**
   * Ejecutar manualmente la generación de cuotas (para testing)
   */
  async runQuotaGenerationManually() {
    logger.info('🔧 Ejecutando generación de cuotas manualmente...');
    try {
      const quotasCreated = await this.savingsQuotaService.generateMonthlyQuotas();
      logger.info(`✅ Generación manual completada: ${quotasCreated} cuotas creadas`);
      return quotasCreated;
    } catch (error) {
      logger.error(`❌ Error en generación manual: ${error}`);
      throw error;
    }
  }

  /**
   * Ejecutar manualmente el procesamiento de vencidos (para testing)
   */
  async runOverdueProcessingManually() {
    logger.info('🔧 Ejecutando procesamiento de vencidos manualmente...');
    try {
      const result = await this.paymentOverdueService.processOverduePayments();
      logger.info(`✅ Procesamiento manual completado: ${result.quotasUpdated} cuotas vencidas, ${result.penaltiesCreated} multas generadas`);
      return result;
    } catch (error) {
      logger.error(`❌ Error en procesamiento manual: ${error}`);
      throw error;
    }
  }

  /**
   * Detener todos los trabajos programados
   */
  stopAllJobs() {
    cron.getTasks().forEach((task) => {
      task.stop();
    });
    logger.info('🛑 Todos los Cron Jobs han sido detenidos');
  }
}

export default CronJobService;
