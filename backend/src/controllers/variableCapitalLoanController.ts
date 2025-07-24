import { Request, Response } from 'express';
import { VariableCapitalLoanService } from '../services/variableCapitalLoanService.js';

const loanService = new VariableCapitalLoanService();

export class VariableCapitalLoanController {

  /**
   * Crear un nuevo préstamo de capital variable
   * POST /api/loans/variable-capital
   */
  async createLoan(req: Request, res: Response) {
    try {
      const { userId, productId, principalAmount, termMonths } = req.body;

      // Validaciones básicas
      if (!userId || !productId || !principalAmount || !termMonths) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: userId, productId, principalAmount, termMonths'
        });
      }

      if (principalAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto del préstamo debe ser mayor a cero'
        });
      }

      if (termMonths <= 0 || termMonths > 12) {
        return res.status(400).json({
          success: false,
          message: 'El plazo debe ser entre 1 y 12 meses'
        });
      }

      const result = await loanService.createVariableCapitalLoan(
        userId,
        productId,
        principalAmount,
        termMonths
      );

      res.status(201).json({
        success: true,
        message: 'Préstamo creado exitosamente',
        data: result
      });

    } catch (error: any) {
      console.error('❌ Error en createLoan:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Procesar un pago al préstamo
   * POST /api/loans/:accountId/payment
   */
  async processPayment(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const { paymentAmount } = req.body;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta requerido'
        });
      }

      if (!paymentAmount || paymentAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Monto de pago debe ser mayor a cero'
        });
      }

      const result = await loanService.processLoanPayment(accountId, paymentAmount);

      res.status(200).json({
        success: true,
        message: 'Pago procesado exitosamente',
        data: result
      });

    } catch (error: any) {
      console.error('❌ Error en processPayment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estado del préstamo
   * GET /api/loans/:accountId/status
   */
  async getLoanStatus(req: Request, res: Response) {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta requerido'
        });
      }

      const status = await loanService.getLoanStatus(accountId);

      res.status(200).json({
        success: true,
        data: status
      });

    } catch (error: any) {
      console.error('❌ Error en getLoanStatus:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Ejecutar generación de intereses diarios (endpoint administrativo)
   * POST /api/loans/generate-daily-interest
   */
  async generateDailyInterest(req: Request, res: Response) {
    try {
      const result = await loanService.generateDailyInterest();

      res.status(200).json({
        success: true,
        message: 'Intereses diarios generados exitosamente',
        data: result
      });

    } catch (error: any) {
      console.error('❌ Error en generateDailyInterest:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
}
