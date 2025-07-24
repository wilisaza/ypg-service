import { Request, Response } from 'express';
import prisma from '../models/prismaClient.js';
import { logger } from '../utils/logger.js';
import { TransactionStatus, TransactionType } from '@prisma/client';

// Obtener todas las transacciones con filtros
export async function getTransactions(req: Request, res: Response) {
  try {
    const { accountId, type, status } = req.query;

    const where: any = {};
    if (accountId) where.accountId = accountId as string;
    if (type) where.type = type as TransactionType;
    if (status) where.status = status as TransactionStatus;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.json({ success: true, data: transactions });
  } catch (error: any) {
    logger.error(`Error al obtener transacciones: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Obtener una transacción por ID
export async function getTransactionById(req: Request, res: Response) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        account: {
          include: {
            user: true,
            product: true,
          },
        },
      },
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

// Crear una nueva transacción (ej: un pago manual, un depósito)
export async function createTransaction(req: Request, res: Response) {
  try {
    const { accountId, amount, type, description, status } = req.body;

    if (!accountId || !amount || !type) {
      return res.status(400).json({
        success: false,
        error: 'accountId, amount y type son requeridos',
      });
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }

    // Lógica de impacto en el balance
    let balanceChange = 0;
    if (type === TransactionType.DEPOSIT || type === TransactionType.ADJUSTMENT_CREDIT) {
        balanceChange = amount;
    } else if (type === TransactionType.WITHDRAWAL || type === TransactionType.ADJUSTMENT_DEBIT) {
        balanceChange = -amount;
    }
    // Otros tipos como FEE_PAYMENT, PENALTY_FEE se manejan en sus propios servicios
    // pero si se crean manualmente, también deberían afectar el balance.
    // Por ejemplo, un pago a un préstamo reduce la deuda (aumenta el balance hacia cero).
    else if (type === TransactionType.FEE_PAYMENT || type === TransactionType.PENALTY_FEE) {
        balanceChange = amount; // Un pago aumenta el balance (reduce la deuda)
    }


    const [transaction, updatedAccount] = await prisma.$transaction([
        prisma.transaction.create({
            data: {
              accountId,
              amount,
              type,
              description,
              status: status || TransactionStatus.COMPLETED,
            },
        }),
        prisma.account.update({
            where: { id: accountId },
            data: { balance: { increment: balanceChange } },
        }),
    ]);


    logger.info(`Transacción creada: ${transaction.id} por ${amount}. Nuevo balance de cuenta: ${updatedAccount.balance}`);
    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    logger.error(`Error al crear transacción: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Actualizar una transacción (ej: cambiar estado de PENDING a COMPLETED)
export async function updateTransactionStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      if (!status || !Object.values(TransactionStatus).includes(status)) {
        return res.status(400).json({ success: false, error: 'Estado no válido' });
      }
  
      const transactionToUpdate = await prisma.transaction.findUnique({ where: { id } });
  
      if (!transactionToUpdate) {
        return res.status(404).json({ success: false, error: 'Transacción no encontrada' });
      }
  
      // Lógica de negocio al completar un pago
      if (status === TransactionStatus.COMPLETED && transactionToUpdate.status !== TransactionStatus.COMPLETED) {
        
        // El balance se afecta basado en el tipo de transacción
        let balanceChange = 0;
        if (transactionToUpdate.type === TransactionType.FEE_PAYMENT || transactionToUpdate.type === TransactionType.PENALTY_FEE) {
            // Pagar una cuota o multa reduce la deuda, lo que significa que el balance (que es negativo) aumenta.
            balanceChange = transactionToUpdate.amount;
        } else if (transactionToUpdate.type === TransactionType.DEPOSIT) {
            balanceChange = transactionToUpdate.amount;
        } else if (transactionToUpdate.type === TransactionType.WITHDRAWAL) {
            balanceChange = -transactionToUpdate.amount;
        }

        const [updatedTransaction, updatedAccount] = await prisma.$transaction([
            prisma.transaction.update({
                where: { id },
                data: { status },
            }),
            prisma.account.update({
                where: { id: transactionToUpdate.accountId },
                data: { balance: { increment: balanceChange } },
            }),
        ]);

        logger.info(`Transacción ${id} completada. Balance de cuenta actualizado a ${updatedAccount.balance}`);
        return res.json({ success: true, data: updatedTransaction });

      } else {
        // Si solo es un cambio de estado sin lógica de negocio compleja
        const updatedTransaction = await prisma.transaction.update({
            where: { id },
            data: { status },
        });
        logger.info(`Estado de transacción ${id} actualizado a ${status}`);
        return res.json({ success: true, data: updatedTransaction });
      }
  
    } catch (error: any) {
      logger.error(`Error al actualizar estado de transacción: ${error.message}`);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  

// Eliminar una transacción (¡Usar con cuidado!)
export async function deleteTransaction(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return res.status(404).json({ success: false, error: 'Transacción no encontrada' });
    }

    // Revertir el impacto en el balance si la transacción fue completada
    if (existingTransaction.status === TransactionStatus.COMPLETED) {
        let balanceChange = 0;
        if (existingTransaction.type === TransactionType.DEPOSIT || existingTransaction.type === TransactionType.ADJUSTMENT_CREDIT || existingTransaction.type === TransactionType.FEE_PAYMENT || existingTransaction.type === TransactionType.PENALTY_FEE) {
            balanceChange = -existingTransaction.amount; // Revertir el crédito
        } else if (existingTransaction.type === TransactionType.WITHDRAWAL || existingTransaction.type === TransactionType.ADJUSTMENT_DEBIT) {
            balanceChange = existingTransaction.amount; // Revertir el débito
        }

        await prisma.$transaction([
            prisma.account.update({
                where: { id: existingTransaction.accountId },
                data: { balance: { increment: balanceChange } },
            }),
            prisma.transaction.delete({ where: { id } }),
        ]);

        logger.warn(`Transacción ${id} eliminada y su impacto en el balance ha sido revertido.`);

    } else {
        // Si no estaba completada, solo se borra
        await prisma.transaction.delete({ where: { id } });
        logger.warn(`Transacción ${id} (estado: ${existingTransaction.status}) eliminada.`);
    }

    res.status(204).end();
  } catch (error: any) {
    logger.error(`Error al eliminar transacción: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}
