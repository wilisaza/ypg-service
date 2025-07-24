
import 'dotenv/config';
// buildApp y CronJobService se importan dinámicamente en main

const PORT = process.env.PORT || 4000;

async function main() {
  console.log('[server] Iniciando servidor...');
  console.log(`[server] DATABASE_URL cargada: ${process.env.DATABASE_URL ? 'sí' : 'no'}`);
  let prismaClient;
  try {
    console.log('[server] Importando prismaClient dinámicamente...');
    const mod = await import('./models/prismaClient.js');
    prismaClient = mod.default;
    console.log('[server] prismaClient importado correctamente');
  } catch (importError) {
    console.error('❌ Error al importar prismaClient:', importError);
    process.exit(1);
  }
  try {
    console.log('[server] Intentando conectar a la base de datos...');
    await prismaClient.$connect();
    console.log('✅ Conexión a base de datos exitosa');
  } catch (connError) {
    console.error('❌ Error al conectar a la base de datos:', connError);
    process.exit(1);
  }
  // Importar dinámicamente buildApp y servicios de cron
  const [{ default: buildApp }, { cronManager }] = await Promise.all([
    import('./app.js'),
    import('./services/cronJobManager.js')
  ]);
  
  // Inicializar aplicación
  const app = buildApp();
  
  // Inicializar jobs de cron
  cronManager.startAllJobs();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Express corriendo en el puerto ${PORT}`);
    console.log('🚀 Sistema completo iniciado con jobs de cron optimizados');
  });
}

// Capturar cualquier rechazo no manejado
process.on('unhandledRejection', (reason) => {
  console.error('❌ Rechazo no manejado:', reason);
});
// Ejecutar arranque con manejo de errores
main().catch((e) => {
  console.error('❌ Error en la función main():', e);
  process.exit(1);
});
