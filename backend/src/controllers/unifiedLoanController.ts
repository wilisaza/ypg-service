import { Request, Response } from 'express';
import prisma from '../models/prismaClient.js';
import { frenchSystemLoanService } from '../services/frenchSystemLoanService.js';
import { VariableCapitalLoanService } from '../services/variableCapitalLoanService.js';

const variableCapitalLoanService = new VariableCapitalLoanService();

export class UnifiedLoanController {

  /**
   * Crear un préstamo (detecta automáticamente el tipo según el producto)
   */
  async createLoan(req: Request, res: Response) {
    try {
      const { userId, productId, principalAmount, termMonths } = req.body;

      // Validaciones básicas
      if (!userId || !productId || !principalAmount || !termMonths) {
        return res.status(400).json({
          success: false,
          error: 'Todos los campos son requeridos: userId, productId, principalAmount, termMonths'
        });
      }

      if (principalAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'El monto principal debe ser mayor a 0'
        });
      }

      if (termMonths < 1 || termMonths > 60) {
        return res.status(400).json({
          success: false,
          error: 'El plazo debe estar entre 1 y 60 meses'
        });
      }

      // Obtener el producto para determinar el tipo de préstamo
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado'
        });
      }

      if (product.type !== 'LOAN') {
        return res.status(400).json({
          success: false,
          error: 'El producto seleccionado no es un préstamo'
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          error: 'El producto no está activo'
        });
      }

      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      let result;

      // Delegar al servicio correspondiente según el tipo de préstamo
      switch (product.loanType) {
        case 'FRENCH_SYSTEM':
          result = await frenchSystemLoanService.createFrenchSystemLoan({
            userId,
            productId,
            principalAmount,
            termMonths
          });
          break;

        case 'VARIABLE_CAPITAL':
          result = await variableCapitalLoanService.createVariableCapitalLoan(
            userId,
            productId,
            principalAmount,
            termMonths
          );
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Tipo de préstamo no soportado'
          });
      }

      res.status(201).json({
        success: true,
        message: `Préstamo ${product.loanType === 'FRENCH_SYSTEM' ? 'de sistema francés' : 'de capital variable'} creado exitosamente`,
        data: {
          ...result,
          loanType: product.loanType,
          productName: product.name
        }
      });

    } catch (error) {
      console.error('Error creating loan:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estado de un préstamo (detecta automáticamente el tipo)
   */
  async getLoanStatus(req: Request, res: Response) {
    try {
      const { accountId } = req.params;

      // Obtener información de la cuenta para determinar el tipo
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
          product: true,
          loanDetails: true
        }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Cuenta no encontrada'
        });
      }

      if (account.product.type !== 'LOAN') {
        return res.status(400).json({
          success: false,
          error: 'La cuenta no corresponde a un préstamo'
        });
      }

      let result;

      // Delegar al servicio correspondiente
      switch (account.product.loanType) {
        case 'FRENCH_SYSTEM':
          result = await frenchSystemLoanService.getLoanStatus(accountId);
          break;

        case 'VARIABLE_CAPITAL':
          result = await variableCapitalLoanService.getLoanStatus(accountId);
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Tipo de préstamo no soportado'
          });
      }

      res.json({
        success: true,
        data: {
          ...result,
          productName: account.product.name
        }
      });

    } catch (error) {
      console.error('Error getting loan status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  }

  /**
   * Procesar pago a un préstamo (detecta automáticamente el tipo)
   */
  async processLoanPayment(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const { paymentAmount } = req.body;

      if (!paymentAmount || paymentAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'El monto del pago debe ser mayor a 0'
        });
      }

      // Obtener información de la cuenta para determinar el tipo
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
          product: true,
          loanDetails: true
        }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Cuenta no encontrada'
        });
      }

      if (account.product.type !== 'LOAN') {
        return res.status(400).json({
          success: false,
          error: 'La cuenta no corresponde a un préstamo'
        });
      }

      let result;

      // Delegar al servicio correspondiente
      switch (account.product.loanType) {
        case 'FRENCH_SYSTEM':
          result = await frenchSystemLoanService.processLoanPayment(accountId, paymentAmount);
          break;

        case 'VARIABLE_CAPITAL':
          result = await variableCapitalLoanService.processLoanPayment(accountId, paymentAmount);
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Tipo de préstamo no soportado'
          });
      }

      res.json({
        success: true,
        message: 'Pago procesado exitosamente',
        data: result
      });

    } catch (error) {
      console.error('Error processing loan payment:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  }

  /**
   * Listar todos los préstamos activos
   */
  async getActiveLoans(req: Request, res: Response) {
    try {
      const { loanType, userId } = req.query;

      const whereClause: any = {
        product: {
          type: 'LOAN'
        },
        status: 'ACTIVE',
        loanDetails: {
          currentBalance: { gt: 0 }
        }
      };

      if (loanType) {
        whereClause.product.loanType = loanType;
      }

      if (userId) {
        whereClause.userId = userId;
      }

      const loans = await prisma.account.findMany({
        where: whereClause,
        include: {
          loanDetails: true,
          user: {
            select: { id: true, fullName: true, username: true }
          },
          product: true
        },
        orderBy: [
          { product: { loanType: 'asc' } },
          { user: { fullName: 'asc' } }
        ]
      });

      const formattedLoans = loans.map(loan => ({
        accountId: loan.id,
        user: loan.user,
        loanType: loan.product.loanType,
        productName: loan.product.name,
        principalAmount: loan.loanDetails?.principalAmount || 0,
        currentBalance: loan.loanDetails?.currentBalance || 0,
        monthlyPayment: loan.loanDetails?.monthlyPayment,
        monthlyInterestAmount: loan.loanDetails?.monthlyInterestAmount,
        maturityDate: loan.loanDetails?.maturityDate,
        status: loan.status,
        openedAt: loan.openedAt
      }));

      res.json({
        success: true,
        data: formattedLoans
      });

    } catch (error) {
      console.error('Error fetching active loans:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * Generar cronograma de pagos para préstamos de sistema francés
   */
  async getPaymentSchedule(req: Request, res: Response) {
    try {
      const { accountId } = req.params;

      const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
          product: true,
          loanDetails: true
        }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Cuenta no encontrada'
        });
      }

      if (account.product.loanType !== 'FRENCH_SYSTEM') {
        return res.status(400).json({
          success: false,
          error: 'El cronograma de pagos solo está disponible para préstamos de sistema francés'
        });
      }

      if (!account.loanDetails) {
        return res.status(400).json({
          success: false,
          error: 'No se encontraron detalles del préstamo'
        });
      }

      // Generar cronograma usando el servicio
      const service = new (await import('../services/frenchSystemLoanService.js')).FrenchSystemLoanService();
      const schedule = (service as any).calculatePaymentSchedule(
        account.loanDetails.principalAmount,
        account.loanDetails.interestRate || 0,
        account.loanDetails.termMonths
      );

      res.json({
        success: true,
        data: {
          accountId: account.id,
          principalAmount: account.loanDetails.principalAmount,
          termMonths: account.loanDetails.termMonths,
          interestRate: account.loanDetails.interestRate,
          schedule
        }
      });

    } catch (error) {
      console.error('Error generating payment schedule:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}

export const unifiedLoanController = new UnifiedLoanController();
