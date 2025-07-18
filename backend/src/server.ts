
import './cron/billingJob.js'; // Importa el cronjob para que se ejecute automáticamente
import buildApp from './app.js';
import CronJobService from './services/cronJobService.js';

const PORT = process.env.PORT || 4000;
const app = buildApp();

// Inicializar servicios de cron jobs
const cronJobService = new CronJobService();
cronJobService.startAllJobs();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`🚀 Cron Jobs iniciados para planes de ahorro`);
});
