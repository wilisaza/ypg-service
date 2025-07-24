import prisma from '../models/prismaClient.js';

async function simularCuotasAhorroMensual() {
  console.log('🏦 Script temporalmente deshabilitado - requiere actualización de modelos');
  // TODO: Actualizar para usar modelos Product, Account, Transaction del schema actual
  return;
}

// Ejecutar la simulación
simularCuotasAhorroMensual()
  .then(() => {
    console.log('✅ Simulación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en la simulación:', error);
    process.exit(1);
  });
