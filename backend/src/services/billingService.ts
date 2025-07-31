import prisma from '../models/prismaClient.js';
import { logger } from '../utils/logger.js';
import { ProductType, TransactionStatus, TransactionType } from '@prisma/client';
import { addDays } from 'date-fns';

// =============================================================================
// SERVICIO DE FACTURACIÓN REFACTORIZADO (ALINEADO CON NUEVO SCHEMA)
// =============================================================================

/**
 * 1. Genera las cuotas de PRÉSTAMO mensuales para todas las cuentas de préstamo activas.
 * @param fechaProceso La fecha en que se corre el proceso.
 */
export async function generarCuotasPrestamo(fechaProceso: Date) {
  const mes = fechaProceso.getMonth() + 1;
  const año = fechaProceso.getFullYear();
  logger.info(`🏦 Iniciando generación de cuotas de PRÉSTAMO para ${mes}/${año}`);

  const cuentasPrestamo = await prisma.account.findMany({
    where: {
      status: 'ACTIVE',
      product: { type: ProductType.LOAN },
      loanDetails: { isNot: null },
    },
    include: { user: true, loanDetails: true },
  });

  let cuotasGeneradas = 0;
  let errores = 0;

  for (const cuenta of cuentasPrestamo) {
    try {
      const cuotaExistente = await prisma.transaction.findFirst({
        where: {
          accountId: cuenta.id,
          type: TransactionType.FEE_PAYMENT,
          month: mes,
          year: año,
        },
      });

      if (cuotaExistente) {
        logger.warn(`⚠️ Cuota de préstamo para ${mes}/${año} ya existe para ${cuenta.user.fullName}.`);
        continue;
      }

      const montoCuota = cuenta.loanDetails!.monthlyPayment;
      
      // Verificar que montoCuota no sea null
      if (!montoCuota) {
        logger.error(`❌ Error: montoCuota es null para cuenta ${cuenta.id}`);
        errores++;
        continue;
      }
      
      const fechaVencimiento = new Date(año, mes - 1, 5); // Vence el 5 de cada mes

      await prisma.transaction.create({
        data: {
          accountId: cuenta.id,
          amount: montoCuota,
          type: TransactionType.FEE_PAYMENT,
          status: TransactionStatus.PENDING,
          description: `Cuota de préstamo para ${mes}/${año}`,
          date: fechaProceso,
          dueDate: fechaVencimiento,
          month: mes,
          year: año,
        },
      });

      logger.info(`✅ Cuota de préstamo generada para ${cuenta.user.fullName} - $${montoCuota.toLocaleString()}`);
      cuotasGeneradas++;
    } catch (error: any) {
      logger.error(`❌ Error generando cuota de préstamo para cuenta ${cuenta.id}: ${error.message}`);
      errores++;
    }
  }

  logger.info(`📊 Cuotas de préstamo generadas: ${cuotasGeneradas}/${cuentasPrestamo.length}`);
  return { generadas: cuotasGeneradas, errores };
}

/**
 * 2. Genera los cargos por manejo mensuales para las cuentas de AHORRO.
 * @param fechaProceso La fecha en que se corre el proceso.
 */
async function generarCargosManejoAhorro(fechaProceso: Date) {
    const mes = fechaProceso.getMonth() + 1;
    const año = fechaProceso.getFullYear();
    logger.info(`💰 Iniciando generación de cargos por manejo de AHORRO para ${mes}/${año}`);

    const cuentasAhorro = await prisma.account.findMany({
        where: {
            status: 'ACTIVE',
            product: { 
                type: ProductType.SAVINGS,
                monthlyFee: { gt: 0 } // Solo si tienen una cuota de manejo
            },
        },
        include: { user: true, product: true },
    });

    let cargosGenerados = 0;
    let errores = 0;

    for (const cuenta of cuentasAhorro) {
        try {
            const cargoExistente = await prisma.transaction.findFirst({
                where: {
                    accountId: cuenta.id,
                    type: TransactionType.MANAGEMENT_FEE,
                    month: mes,
                    year: año,
                },
            });

            if (cargoExistente) {
                logger.warn(`⚠️ Cargo por manejo para ${mes}/${año} ya existe para ${cuenta.user.fullName}.`);
                continue;
            }

            const montoCargo = cuenta.product.monthlyFee!;
            
            await prisma.transaction.create({
                data: {
                    accountId: cuenta.id,
                    amount: montoCargo,
                    type: TransactionType.MANAGEMENT_FEE,
                    status: TransactionStatus.COMPLETED, // Se debita inmediatamente
                    description: `Cargo por manejo ${mes}/${año}`,
                    date: fechaProceso,
                    month: mes,
                    year: año,
                },
            });

            // Actualizar el balance de la cuenta
            await prisma.account.update({
                where: { id: cuenta.id },
                data: { balance: { decrement: montoCargo } },
            });

            logger.info(`✅ Cargo por manejo generado y aplicado a ${cuenta.user.fullName} - $${montoCargo.toLocaleString()}`);
            cargosGenerados++;
        } catch (error: any) {
            logger.error(`❌ Error generando cargo por manejo para cuenta ${cuenta.id}: ${error.message}`);
            errores++;
        }
    }
    logger.info(`📊 Cargos por manejo generados: ${cargosGenerados}/${cuentasAhorro.length}`);
    return { generadas: cargosGenerados, errores };
}


/**
 * 3. Actualiza el estado de las cuotas de PENDING a OVERDUE si su fecha de vencimiento ha pasado.
 * @param fechaProceso La fecha actual del proceso.
 */
async function actualizarEstadoCuotasVencidas(fechaProceso: Date) {
  logger.info('🔄 Actualizando estados de cuotas a OVERDUE...');
  
  const cuotasVencidas = await prisma.transaction.updateMany({
    where: {
      status: TransactionStatus.PENDING,
      dueDate: {
        lt: fechaProceso,
      },
    },
    data: {
      status: TransactionStatus.OVERDUE,
    },
  });

  if (cuotasVencidas.count > 0) {
    logger.info(`✅ ${cuotasVencidas.count} cuotas actualizadas a OVERDUE.`);
  } else {
    logger.info('No hay cuotas pendientes para marcar como vencidas.');
  }
  
  return cuotasVencidas.count;
}

/**
 * 4. Genera multas para las cuotas que están marcadas como OVERDUE.
 * Solo genera una multa por cuota vencida para evitar duplicados.
 * @param fechaProceso La fecha actual del proceso.
 */
async function generarMultasPorAtraso(fechaProceso: Date) {
  logger.info('🚨 Iniciando generación de multas por atraso...');

  const cuotasVencidas = await prisma.transaction.findMany({
    where: {
      status: TransactionStatus.OVERDUE,
      type: TransactionType.FEE_PAYMENT, // Solo se aplican multas a cuotas de préstamo
    },
    include: {
      account: {
        include: {
          user: true,
          product: true,
        },
      },
    },
  });

  let multasGeneradas = 0;
  let errores = 0;

  for (const cuota of cuotasVencidas) {
    try {
      const multaExistente = await prisma.transaction.findFirst({
        where: {
          accountId: cuota.accountId,
          type: TransactionType.PENALTY_FEE,
          month: cuota.month,
          year: cuota.year,
        },
      });

      if (multaExistente) {
        logger.warn(`⚠️ Multa para ${cuota.month}/${cuota.year} ya existe para ${cuota.account.user.fullName}.`);
        continue;
      }

      const tasaMulta = cuota.account.product.penaltyRate;
      if (!tasaMulta || tasaMulta <= 0) {
        logger.warn(`🚫 No se puede generar multa para ${cuota.account.user.fullName}, no hay tasa de multa definida en el producto.`);
        continue;
      }

      const montoMulta = cuota.amount * tasaMulta;

      await prisma.transaction.create({
        data: {
          accountId: cuota.accountId,
          amount: montoMulta,
          type: TransactionType.PENALTY_FEE,
          status: TransactionStatus.PENDING,
          description: `Multa por atraso en cuota de ${cuota.month}/${cuota.year}`,
          date: fechaProceso,
          month: cuota.month,
          year: cuota.year,
        },
      });
      logger.info(`🚨 Multa generada para ${cuota.account.user.fullName} - $${montoMulta.toLocaleString()}`);
      multasGeneradas++;
    } catch (error: any) {
      logger.error(`❌ Error generando multa para cuenta ${cuota.accountId}: ${error.message}`);
      errores++;
    }
  }

  logger.info(`📊 Multas generadas: ${multasGeneradas}`);
  return { generadas: multasGeneradas, errores };
}


// =============================================================================
// FUNCIÓN PRINCIPAL DE ORQUESTACIÓN
// =============================================================================

/**
 * Ejecuta el ciclo de facturación mensual completo.
 * Esta es la función principal que debería ser llamada por un cron job.
 * @param fechaProceso La fecha en la que se está ejecutando el ciclo.
 */
export async function ejecutarCicloFacturacion(fechaProceso: Date) {
  logger.info(`🚀 INICIANDO CICLO DE FACTURACIÓN PARA ${fechaProceso.toISOString().split('T')[0]} 🚀`);
  
  // 1. Generar cuotas de préstamo para el mes actual
  await generarCuotasPrestamo(fechaProceso);
  
  // 2. Generar cargos por manejo de cuentas de ahorro
  await generarCargosManejoAhorro(fechaProceso);

  // 3. Actualizar el estado de cuotas pendientes a vencidas
  await actualizarEstadoCuotasVencidas(fechaProceso);
  
  // 4. Generar multas para las cuotas vencidas que no tengan multa
  await generarMultasPorAtraso(fechaProceso);
  
  logger.info('🏁 CICLO DE FACTURACIÓN COMPLETADO 🏁');
}
