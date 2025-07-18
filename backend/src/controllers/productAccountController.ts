import { Request, Response } from 'express';
import prisma from '../models/prismaClient.js';
import { logger } from '../utils/logger.js';
import { 
  calculateLoanProjection, 
  calculateLoanProjectionMonthly, 
  PaymentMode 
} from '../utils/financialCalculations.js';

// Obtener todas las cuentas de productos
export async function getProductAccounts(req: Request, res: Response) {
  try {
    const accounts = await prisma.productAccount.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          }
        },
        _count: {
          select: {
            transactions: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    logger.info('Cuentas de productos obtenidas correctamente');
    res.json({ success: true, data: accounts });
  } catch (error: any) {
    logger.error(`Error al obtener cuentas de productos: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Obtener una cuenta de producto por ID
export async function getProductAccount(req: Request, res: Response) {
  try {
    const account = await prisma.productAccount.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          }
        },
        transactions: {
          include: {
            type: true
          },
          orderBy: {
            date: 'desc'
          },
          take: 10
        }
      }
    });
    
    if (!account) {
      logger.warn(`Cuenta de producto no encontrada: ${req.params.id}`);
      return res.status(404).json({ success: false, error: 'Cuenta de producto no encontrada' });
    }
    
    logger.info(`Cuenta de producto obtenida: ${account.id}`);
    res.json({ success: true, data: account });
  } catch (error: any) {
    logger.error(`Error al obtener cuenta de producto: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Crear una nueva cuenta de producto
export async function createProductAccount(req: Request, res: Response) {
  try {
    const { 
      userId, 
      productId, 
      amount, 
      principal, 
      interest, 
      startDate, 
      endDate,
      paymentMode 
    } = req.body;

    // Validaciones requeridas
    if (!userId || !productId || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId, productId y amount son requeridos' 
      });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // Verificar que el producto existe
    const product = await prisma.financialProduct.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    // Validar modalidad de pago para préstamos
    let finalPaymentMode = paymentMode;
    if (product.type === 'PRESTAMO' && !paymentMode) {
      finalPaymentMode = 'CUOTAS_FIJAS'; // Por defecto cuotas fijas
    }

    // Calcular proyección automáticamente para préstamos
    let calculatedPrincipal = principal;
    let outstandingBalance = null;
    let lastInterestDate = null;
    
    if (product.type === 'PRESTAMO') {
      // Usar la tasa de interés específica o la por defecto del producto
      const interestRate = interest || product.defaultInterest;
      
      // Calcular plazo en meses desde las fechas proporcionadas
      let termMonths = product.termMonths; // valor por defecto
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        termMonths = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
      }
      
      if (interestRate && termMonths && termMonths > 0) {
        if (finalPaymentMode === 'CUOTAS_FIJAS') {
          // Para cuotas fijas, usar interés mensual directamente
          calculatedPrincipal = calculateLoanProjectionMonthly(amount, interestRate, termMonths);
          logger.info(`Proyección calculada para préstamo con cuotas fijas (interés mensual ${interestRate}%): ${amount} -> ${calculatedPrincipal}`);
        } else if (finalPaymentMode === 'ABONOS_LIBRES') {
          // Para abonos libres, el principal es el monto original y se maneja el saldo pendiente
          calculatedPrincipal = amount;
          outstandingBalance = amount;
          lastInterestDate = startDate ? new Date(startDate) : new Date();
          logger.info(`Préstamo con abonos libres configurado: monto inicial ${amount}, saldo pendiente ${outstandingBalance}, interés mensual ${interestRate}%`);
        }
      } else {
        // Si no hay suficiente información, usar el monto como principal
        calculatedPrincipal = amount;
        if (finalPaymentMode === 'ABONOS_LIBRES') {
          outstandingBalance = amount;
          lastInterestDate = startDate ? new Date(startDate) : new Date();
        }
        logger.info(`Préstamo creado sin cálculo automático (faltan datos): monto ${amount}`);
      }
    }

    const account = await prisma.productAccount.create({
      data: {
        userId,
        productId,
        amount,
        principal: calculatedPrincipal,
        interest,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        paymentMode: finalPaymentMode,
        outstandingBalance,
        lastInterestDate,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          }
        }
      }
    });

    logger.info(`Cuenta de producto creada: ${account.id} con modalidad ${finalPaymentMode}`);
    res.status(201).json({ success: true, data: account });
  } catch (error: any) {
    logger.error(`Error al crear cuenta de producto: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Actualizar una cuenta de producto
export async function updateProductAccount(req: Request, res: Response) {
  try {
    const { 
      amount, 
      principal, 
      interest, 
      startDate, 
      endDate, 
      isActive 
    } = req.body;

    // Obtener la cuenta actual para verificar el tipo de producto
    const currentAccount = await prisma.productAccount.findUnique({
      where: { id: req.params.id },
      include: { product: true }
    });

    if (!currentAccount) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }

    // Calcular proyección automáticamente para préstamos si se actualiza el monto o interés
    let calculatedPrincipal = principal;
    
    if (currentAccount.product.type === 'PRESTAMO' && (amount || interest)) {
      const newAmount = amount || currentAccount.amount;
      const newInterest = interest || currentAccount.interest || currentAccount.product.defaultInterest;
      const termMonths = currentAccount.product.termMonths;
      
      if (newInterest && termMonths) {
        calculatedPrincipal = calculateLoanProjection(newAmount, newInterest, termMonths);
        logger.info(`Proyección recalculada para préstamo: ${newAmount} -> ${calculatedPrincipal}`);
      }
    }

    const account = await prisma.productAccount.update({
      where: { id: req.params.id },
      data: {
        amount,
        principal: calculatedPrincipal,
        interest,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          }
        }
      }
    });

    logger.info(`Cuenta de producto actualizada: ${account.id}`);
    res.json({ success: true, data: account });
  } catch (error: any) {
    logger.error(`Error al actualizar cuenta de producto: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Eliminar una cuenta de producto
export async function deleteProductAccount(req: Request, res: Response) {
  try {
    // Verificar si tiene transacciones asociadas
    const transactionsCount = await prisma.transaction.count({
      where: { accountId: req.params.id }
    });

    if (transactionsCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se puede eliminar la cuenta porque tiene transacciones asociadas. Considere desactivarla en su lugar.' 
      });
    }

    await prisma.productAccount.delete({ where: { id: req.params.id } });
    logger.info(`Cuenta de producto eliminada: ${req.params.id}`);
    res.status(204).end();
  } catch (error: any) {
    logger.error(`Error al eliminar cuenta de producto: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Obtener cuentas de productos por usuario
export async function getProductAccountsByUser(req: Request, res: Response) {
  try {
    const accounts = await prisma.productAccount.findMany({
      where: { userId: req.params.userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          }
        },
        _count: {
          select: {
            transactions: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info(`Cuentas de productos obtenidas para usuario: ${req.params.userId}`);
    res.json({ success: true, data: accounts });
  } catch (error: any) {
    logger.error(`Error al obtener cuentas de productos por usuario: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}
