import { Request, Response } from 'express';
import prisma from '../models/prismaClient.js';
import { logger } from '../utils/logger.js';
import { 
  calculateMonthlyPayment, 
  calculateMonthlyInterestOnBalance, 
  calculateMonthlyInterestOnBalanceFromMonthly,
  applyPaymentToBalance,
  PaymentMode 
} from '../utils/financialCalculations.js';

// Función auxiliar para obtener el estado actual de un préstamo con abonos libres
async function getCurrentLoanStatus(accountId: string) {
  const account = await prisma.productAccount.findUnique({
    where: { id: accountId },
    include: {
      product: true
    }
  });

  if (!account || account.product.type !== 'PRESTAMO' || account.paymentMode !== 'ABONOS_LIBRES') {
    return null;
  }

  const currentBalance = account.outstandingBalance || account.amount;
  const interestRate = account.interest || account.product.defaultInterest || 0;
  const lastDate = account.lastInterestDate || account.startDate || account.createdAt;
  const currentDate = new Date();
  const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  let accruedInterest = 0;
  if (daysDiff >= 30) {
    // Usar función de interés mensual directo
    accruedInterest = calculateMonthlyInterestOnBalanceFromMonthly(currentBalance, interestRate);
  }

  return {
    currentBalance,
    accruedInterest,
    totalOwed: currentBalance + accruedInterest,
    daysSinceLastInterest: daysDiff,
    interestRate
  };
}

// Obtener todas las transacciones
export async function getTransactions(req: Request, res: Response) {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        account: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                type: true,
              }
            }
          }
        },
        type: true,
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json({ success: true, data: transactions });
  } catch (error: any) {
    logger.error(`Error al obtener transacciones: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Obtener una transacción específica
export async function getTransaction(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                type: true,
              }
            }
          }
        },
        type: true,
      }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transacción no encontrada' });
    }

    res.json({ success: true, data: transaction });
  } catch (error: any) {
    logger.error(`Error al obtener transacción: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}
// Crear una nueva transacción
export async function createTransaction(req: Request, res: Response) {
  try {
    const { accountId, amount, typeId, description } = req.body;

    // Validaciones básicas
    if (!accountId || !amount || !typeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'accountId, amount y typeId son requeridos' 
      });
    }

    // Verificar que la cuenta existe
    const account = await prisma.productAccount.findUnique({
      where: { id: accountId },
      include: {
        product: true
      }
    });

    if (!account) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }

    // Verificar que el tipo de transacción existe
    const transactionType = await prisma.transactionTypeDetail.findUnique({
      where: { id: typeId }
    });

    if (!transactionType) {
      return res.status(404).json({ success: false, error: 'Tipo de transacción no encontrado' });
    }

    // Para préstamos, manejar las diferentes modalidades de pago
    let updatedAccount = null;
    if (account.product.type === 'PRESTAMO' && transactionType.nature === 'credito') {
      if (account.paymentMode === 'ABONOS_LIBRES') {
        // Para abonos libres, aplicar el pago al saldo pendiente
        const currentBalance = account.outstandingBalance || account.amount;
        const interestRate = account.interest || account.product.defaultInterest || 0;
        
        // Calcular interés acumulado desde la última fecha de liquidación
        const lastDate = account.lastInterestDate || account.startDate || account.createdAt;
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff >= 30) { // Si ha pasado al menos un mes
          const accruedInterest = calculateMonthlyInterestOnBalanceFromMonthly(currentBalance, interestRate);
          const newBalanceWithInterest = currentBalance + accruedInterest;
          
          // Aplicar el pago al nuevo balance
          const remainingBalance = applyPaymentToBalance(newBalanceWithInterest, amount);

          // Actualizar la cuenta con el nuevo saldo
          updatedAccount = await prisma.productAccount.update({
            where: { id: accountId },
            data: {
              outstandingBalance: remainingBalance,
              lastInterestDate: currentDate,
            }
          });

          logger.info(`Pago de abono libre aplicado: Interés mensual acumulado ${accruedInterest}, Saldo con interés ${newBalanceWithInterest}, Pago ${amount}, Saldo restante ${remainingBalance}`);
        } else {
          // No ha pasado suficiente tiempo, aplicar directamente al principal
          const remainingBalance = applyPaymentToBalance(currentBalance, amount);
          
          updatedAccount = await prisma.productAccount.update({
            where: { id: accountId },
            data: {
              outstandingBalance: remainingBalance,
            }
          });

          logger.info(`Pago directo al principal: ${amount}, Saldo restante ${remainingBalance}`);
        }
      } else if (account.paymentMode === 'CUOTAS_FIJAS') {
        // Para cuotas fijas, la lógica es más simple - es un pago programado
        logger.info(`Pago de cuota fija registrado: ${amount}`);
      }
    }

    // Crear la transacción
    const transaction = await prisma.transaction.create({
      data: {
        accountId,
        amount,
        typeId,
        status: 'PAGADA',
        date: new Date(),
      },
      include: {
        account: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                type: true,
              }
            }
          }
        },
        type: true,
      }
    });

    logger.info(`Transacción creada: ${transaction.id} por ${amount}`);
    res.status(201).json({ 
      success: true, 
      data: transaction,
      accountUpdate: updatedAccount 
    });
  } catch (error: any) {
    logger.error(`Error al crear transacción: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}
// Actualizar una transacción
export async function updateTransaction(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { amount, typeId, status, description } = req.body;

    // Verificar que la transacción existe
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!existingTransaction) {
      return res.status(404).json({ success: false, error: 'Transacción no encontrada' });
    }

    // Actualizar la transacción
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(amount && { amount }),
        ...(typeId && { typeId }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
      include: {
        account: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                type: true,
              }
            }
          }
        },
        type: true,
      }
    });

    logger.info(`Transacción actualizada: ${transaction.id}`);
    res.json({ success: true, data: transaction });
  } catch (error: any) {
    logger.error(`Error al actualizar transacción: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Eliminar una transacción
export async function deleteTransaction(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verificar que la transacción existe
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!existingTransaction) {
      return res.status(404).json({ success: false, error: 'Transacción no encontrada' });
    }

    // Eliminar la transacción
    await prisma.transaction.delete({
      where: { id }
    });

    logger.info(`Transacción eliminada: ${id}`);
    res.status(204).end();
  } catch (error: any) {
    logger.error(`Error al eliminar transacción: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Obtener el estado actual de un préstamo
export async function getLoanStatus(req: Request, res: Response) {
  try {
    const { accountId } = req.params;

    const loanStatus = await getCurrentLoanStatus(accountId);

    if (!loanStatus) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cuenta no encontrada o no es un préstamo con abonos libres' 
      });
    }

    res.json({ success: true, data: loanStatus });
  } catch (error: any) {
    logger.error(`Error al obtener estado del préstamo: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}
