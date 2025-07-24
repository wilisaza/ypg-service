import cron, { ScheduledTask } from 'node-cron';
import { VariableCapitalLoanService } from './variableCapitalLoanService.js';

const loanService = new VariableCapitalLoanService();

export class CronJobManager {
  private jobs: Map<string, ScheduledTask> = new Map();

  /**
   * Inicializar todos los jobs de cron
   */
  startAllJobs() {
    this.startDailyInterestJob();
    console.log('🔄 Todos los jobs de cron iniciados');
  }

  /**
   * Job de intereses diarios - Se ejecuta a las 01:00 AM
   */
  private startDailyInterestJob() {
    const job = cron.schedule('0 1 * * *', async () => {
      console.log('🕐 [CRON] Ejecutando generación de intereses diarios...');
      try {
        const result = await loanService.generateDailyInterest();
        console.log(`✅ [CRON] Intereses generados: ${result.interestsGenerated} préstamos procesados`);
      } catch (error) {
        console.error('❌ [CRON] Error en job de intereses:', error);
      }
    }, {
      timezone: 'America/Bogota'
    });

    this.jobs.set('dailyInterest', job);
    console.log('📅 Job de intereses diarios programado para 01:00 AM');
  }

  /**
   * Ejecutar manualmente el job de intereses (para testing)
   */
  async runDailyInterestNow() {
    console.log('⚡ Ejecutando job de intereses manualmente...');
    try {
      const result = await loanService.generateDailyInterest();
      console.log(`✅ Resultado: ${result.interestsGenerated} intereses generados`);
      return result;
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  }

  /**
   * Detener todos los jobs
   */
  stopAllJobs() {
    this.jobs.forEach((job, name) => {
      job.destroy();
      console.log(`⏹️ Job ${name} detenido`);
    });
    this.jobs.clear();
  }

  /**
   * Obtener estado de los jobs
   */
  getJobsStatus() {
    const status = Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      running: job.getStatus() === 'scheduled'
    }));
    return status;
  }
}

// Instancia singleton
export const cronManager = new CronJobManager();
