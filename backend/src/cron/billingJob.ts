import cron from 'node-cron';
import { ejecutarCicloFacturacion } from '../services/billingService.js';

// Ejecutar todos los días a las 2am
cron.schedule('0 2 * * *', async () => {
  const hoy = new Date();
  await ejecutarCicloFacturacion(hoy);
  console.log('Facturación ejecutada:', hoy);
});

export default cron;
