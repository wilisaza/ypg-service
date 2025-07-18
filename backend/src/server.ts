
import './cron/billingJob.ts'; // Importa el cronjob para que se ejecute automáticamente
import buildApp from './app.js';

const PORT = process.env.PORT || 4000;
const app = buildApp();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
