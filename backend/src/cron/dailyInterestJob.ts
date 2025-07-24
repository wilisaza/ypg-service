import cron from 'node-cron';
import { VariableCapitalLoanService } from '../services/variableCapitalLoanService.js';

const loanService = new VariableCapitalLoanService();

/**
 * Job para generar intereses diarios en préstamos de capital variable
 * Se ejecuta todos los días a las 00:30 AM
 */
export const dailyInterestJob = cron.schedule('30 0 * * *', async () => {
  console.log('🕐 Ejecutando job de intereses diarios...');
  
  try {
    const result = await loanService.generateDailyInterest();
    console.log(`✅ Job completado: ${result.interestsGenerated} intereses generados`);
  } catch (error) {
    console.error('❌ Error en job de intereses diarios:', error);
  }
}, {
  timezone: 'America/Bogota'
});

/**
 * Inicia el job de intereses diarios
 */
export function startDailyInterestJob() {
  console.log('📅 Job de intereses diarios configurado - Se ejecutará diariamente a las 00:30 AM');
}

/**
 * Detiene el job de intereses diarios
 */
export function stopDailyInterestJob() {
  dailyInterestJob.destroy();
  console.log('⏹️  Job de intereses diarios detenido');
}
