
import 'dotenv/config';
import buildApp from './app.js';
import { cronManager } from './services/cronJobManager.js';

const PORT = process.env.PORT || 4000;

async function main() {
  console.log('🚀 Iniciando servidor YPG...');
  
  try {
    // Inicializar aplicación
    const app = buildApp();
    
    // Inicializar jobs de cron
    cronManager.startAllJobs();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en puerto ${PORT}`);
      console.log('✅ Sistema de préstamos y cron jobs activos');
    });
    
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (reason) => {
  console.error('❌ Rechazo no manejado:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  process.exit(1);
});

// Iniciar servidor
main();
