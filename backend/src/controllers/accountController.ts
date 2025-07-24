import { Request, Response } from 'express';
import prisma from '../models/prismaClient.js';
import { logger } from '../utils/logger.js';
import { ProductType } from '@prisma/client';

// Obtener todas las cuentas
export async function getAccounts(req: Request, res: Response) {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        loanDetails: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        openedAt: 'desc',
      },
    });
    logger.info('Cuentas obtenidas correctamente');
    res.json({ success: true, data: accounts });
  } catch (error: any) {
    logger.error(`Error al obtener cuentas: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Obtener una cuenta por ID
export async function getAccountById(req: Request, res: Response) {
  try {
    const account = await prisma.account.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        product: true,
        loanDetails: true,
        transactions: {
          orderBy: {
            date: 'desc',
          },
          take: 20, // Aumentamos el número de transacciones recientes
        },
      },
    });

    if (!account) {
      logger.warn(`Cuenta no encontrada: ${req.params.id}`);
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }

    logger.info(`Cuenta obtenida: ${account.id}`);
    res.json({ success: true, data: account });
  } catch (error: any) {
    logger.error(`Error al obtener cuenta: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Crear una nueva cuenta
export async function createAccount(req: Request, res: Response) {
  try {
    const {
      userId,
      productId,
      balance,
      savingsGoal,
      loanDetails, // Objeto con { principalAmount, termMonths }
    } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        error: 'userId y productId son requeridos',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    let accountData: any = {
      userId,
      productId,
      balance: balance || 0,
      savingsGoal,
    };

    // Lógica específica para préstamos
    if (product.type === ProductType.LOAN) {
      if (!loanDetails || !loanDetails.principalAmount || !loanDetails.termMonths) {
        return res.status(400).json({
          success: false,
          error: 'Para préstamos, se requiere loanDetails con principalAmount y termMonths',
        });
      }
      
      // TODO: Implementar cálculo de cuota mensual (amortización)
      const monthlyPayment = loanDetails.principalAmount / loanDetails.termMonths; // Simplificación temporal

      accountData.balance = -loanDetails.principalAmount; // El saldo inicial de un préstamo es negativo
      accountData.loanDetails = {
        create: {
          principalAmount: loanDetails.principalAmount,
          termMonths: loanDetails.termMonths,
          interestRate: product.interestRate || 0,
          monthlyPayment: monthlyPayment, // Usar el valor calculado
        },
      };
    }

    const newAccount = await prisma.account.create({
      data: accountData,
      include: {
        user: true,
        product: true,
        loanDetails: true,
      },
    });

    logger.info(`Cuenta creada: ${newAccount.id} para el producto ${product.name}`);
    res.status(201).json({ success: true, data: newAccount });
  } catch (error: any) {
    logger.error(`Error al crear cuenta: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Actualizar una cuenta (ej: cambiar estado, meta de ahorro)
export async function updateAccount(req: Request, res: Response) {
    try {
      const { savingsGoal, status } = req.body;
  
      const updatedAccount = await prisma.account.update({
        where: { id: req.params.id },
        data: {
          savingsGoal,
          status,
        },
        include: {
          user: true,
          product: true,
          loanDetails: true,
        },
      });
  
      logger.info(`Cuenta actualizada: ${updatedAccount.id}`);
      res.json({ success: true, data: updatedAccount });
    } catch (error: any) {
      logger.error(`Error al actualizar cuenta: ${error.message}`);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  

// Eliminar una cuenta
export async function deleteAccount(req: Request, res: Response) {
  try {
    const transactionsCount = await prisma.transaction.count({
      where: { accountId: req.params.id },
    });

    if (transactionsCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la cuenta porque tiene transacciones. Considere cambiar su estado a "CLOSED".',
      });
    }

    // También eliminar detalles de préstamo si existen
    await prisma.loanDetails.deleteMany({
        where: { accountId: req.params.id },
    });

    await prisma.account.delete({ where: { id: req.params.id } });
    
    logger.info(`Cuenta eliminada: ${req.params.id}`);
    res.status(204).end();
  } catch (error: any) {
    logger.error(`Error al eliminar cuenta: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Obtener cuentas por ID de usuario
export async function getAccountsByUserId(req: Request, res: Response) {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.params.userId },
      include: {
        product: true,
        loanDetails: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        product: {
            type: 'asc'
        }
      },
    });

    logger.info(`Cuentas obtenidas para el usuario: ${req.params.userId}`);
    res.json({ success: true, data: accounts });
  } catch (error: any) {
    logger.error(`Error al obtener cuentas por usuario: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}
