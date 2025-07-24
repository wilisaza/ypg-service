import prisma from '../models/prismaClient.js';

async function simularCuotasAhorroMensual() {
  console.log('🏦 Script temporalmente deshabilitado - requiere actualización de modelos');
  // TODO: Actualizar para usar modelos Product, Account, Transaction del schema actual
  return;
}
      user: true
    }
  });
  
  console.log(`📊 Encontradas ${cuentasAhorro.length} cuentas de ahorro activas`);
  
  let cuotasGeneradas = 0;
  let cuotasOmitidas = 0;
  
  // 3. Procesar cada cuenta
  for (const cuenta of cuentasAhorro) {
    const { product, user } = cuenta;
    
    // Verificar si ya existe una cuota para este mes
    const cuotaExistente = await prisma.transaction.findFirst({
      where: {
        accountId: cuenta.id,
        typeId: tipoCuotaAhorro.id,
        month: mesActual,
        year: añoActual
      }
    });
    
    if (cuotaExistente) {
      console.log(`⚠️  Ya existe cuota para ${user.fullName} - ${product.name} (${mesActual}/${añoActual})`);
      cuotasOmitidas++;
      continue;
    }
    
    // Generar la cuota mensual
    const montoCuota = product.monthlyAmount || 0;
    
    try {
      const nuevaCuota = await prisma.transaction.create({
        data: {
          accountId: cuenta.id,
          amount: montoCuota,
          typeId: tipoCuotaAhorro.id,
          status: 'PENDIENTE',
          date: fechaSimulacion,
          dueDate: new Date(añoActual, mesActual, 0), // Último día del mes
          month: mesActual,
          year: añoActual
        }
      });
      
      console.log(`✅ Cuota generada: ${user.fullName} - ${product.name} - $${montoCuota.toLocaleString()}`);
      cuotasGeneradas++;
      
    } catch (error) {
      console.error(`❌ Error al generar cuota para ${user.fullName}:`, error);
    }
  }
  
  console.log(`\n📈 Resumen de simulación:`);
  console.log(`   • Cuotas generadas: ${cuotasGeneradas}`);
  console.log(`   • Cuotas omitidas (ya existían): ${cuotasOmitidas}`);
  console.log(`   • Total procesadas: ${cuotasGeneradas + cuotasOmitidas}`);
  
  // 4. Mostrar resumen de transacciones pendientes
  const transaccionesPendientes = await prisma.transaction.findMany({
    where: {
      status: 'PENDIENTE',
      month: mesActual,
      year: añoActual,
      typeId: tipoCuotaAhorro.id
    },
    include: {
      account: {
        include: {
          user: true,
          product: true
        }
      }
    }
  });
  
  console.log(`\n💰 Transacciones pendientes para ${mesActual}/${añoActual}:`);
  for (const trans of transaccionesPendientes) {
    console.log(`   • ${trans.account.user.fullName} - ${trans.account.product.name}: $${trans.amount.toLocaleString()}`);
  }
}

// Ejecutar la simulación
simularCuotasAhorroMensual()
  .catch((e) => {
    console.error('❌ Error en la simulación:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
