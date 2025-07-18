import prisma from '../models/prismaClient.js';

// 1. Generar cuotas de préstamo (PRESTAMO)
export async function generarCuotasPrestamo(fecha: Date) {
  // Obtener los tipos de transacción
  const tiposPago = await prisma.transactionTypeDetail.findFirst({ where: { name: 'PAGO' } });
  const tiposInteres = await prisma.transactionTypeDetail.findFirst({ where: { name: 'INTERES' } });
  
  const cuentas = await prisma.productAccount.findMany({
    where: { 
      product: { type: 'PRESTAMO' }, 
      isActive: true 
    },
    include: { product: true }
  });
  
  for (const cuenta of cuentas) {
    // Ejemplo: cuota fija mensual
    const abonoCapital = cuenta.principal ? cuenta.principal / 12 : 0;
    const interes = cuenta.interest ? cuenta.interest / 12 : 0;
    
    // Crear transacción de abono a capital
    if (tiposPago) {
      await prisma.transaction.create({
        data: {
          accountId: cuenta.id,
          amount: abonoCapital,
          typeId: tiposPago.id,
          date: fecha,
        },
      });
    }
    
    // Crear transacción de interés
    if (tiposInteres) {
      await prisma.transaction.create({
        data: {
          accountId: cuenta.id,
          amount: interes,
          typeId: tiposInteres.id,
          date: fecha,
        },
      });
    }
  }
}

// 2. Generar cuotas de ahorro (AHORRO)
export async function generarCuotasAhorro(fecha: Date) {
  // Obtener el tipo de transacción DEPOSITO
  const tipoDeposito = await prisma.transactionTypeDetail.findFirst({ where: { name: 'DEPOSITO' } });
  
  const cuentas = await prisma.productAccount.findMany({
    where: { 
      product: { type: 'AHORRO' }, 
      isActive: true 
    },
    include: { product: true }
  });
  
  for (const cuenta of cuentas) {
    // Ejemplo: cuota mensual fija
    if (tipoDeposito) {
      await prisma.transaction.create({
        data: {
          accountId: cuenta.id,
          amount: cuenta.amount,
          typeId: tipoDeposito.id,
          date: fecha,
        },
      });
    }
  }
}

// 3. Generar multas por atraso en ahorro
export async function generarMultasAhorro(fecha: Date, montoMulta: number) {
  // Obtener los tipos de transacción
  const tipoDeposito = await prisma.transactionTypeDetail.findFirst({ where: { name: 'DEPOSITO' } });
  const tipoMulta = await prisma.transactionTypeDetail.findFirst({ where: { name: 'MULTA' } });
  
  if (!tipoDeposito || !tipoMulta) return;
  
  const cuotas = await prisma.transaction.findMany({
    where: {
      typeId: tipoDeposito.id,
      date: { lt: fecha },
      account: { 
        product: { type: 'AHORRO' } 
      },
    },
    include: { account: { include: { product: true } } },
  });
  
  for (const cuota of cuotas) {
    // Buscar si existe un pago recibido para esa cuota
    const pago = await prisma.transaction.findFirst({
      where: {
        accountId: cuota.accountId,
        typeId: tipoDeposito.id,
        date: cuota.date,
      },
    });
    
    if (!pago) {
      // Crear multa
      await prisma.transaction.create({
        data: {
          accountId: cuota.accountId,
          amount: montoMulta,
          typeId: tipoMulta.id,
          date: fecha,
        },
      });
    }
  }
}

// 4. Conciliación de pagos (opcional, ejemplo simple)
export async function conciliarPagos() {
  // Aquí podrías comparar transacciones de tipo PAGO/INTERES/DEPOSITO con las generadas por facturación
  // y marcar como conciliadas, pagadas, etc. Puedes agregar un campo status si lo deseas.
}

// Recomendaciones:
// - Puedes agregar un campo status a Transaction (PENDIENTE, PAGADA, VENCIDA) para mayor control.
// - Usa un cron job diario para ejecutar la facturación automáticamente.
// - Siempre valida que no se dupliquen transacciones para la misma cuota y fecha.
// - Puedes parametrizar montos, tasas y fechas según tu lógica de negocio.
