import cron from 'node-cron';
import { generarCuotasPrestamo, generarCuotasAhorro, generarMultasAhorro } from '../services/billingService.js';

// Ejecutar todos los días a las 2am
cron.schedule('0 2 * * *', async () => {
  const hoy = new Date();
  await generarCuotasPrestamo(hoy);
  await generarCuotasAhorro(hoy);
  await generarMultasAhorro(hoy, 5000); // ejemplo: multa de 5000
  console.log('Facturación ejecutada:', hoy);
});

export default cron;
