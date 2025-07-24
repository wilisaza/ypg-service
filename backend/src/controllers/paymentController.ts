import { Request, Response } from 'express';
import { PaymentCompensationService } from '../services/paymentCompensationService.js';
import CronJobService from '../services/cronJobService.js';

const paymentService = new PaymentCompensationService();
const cronJobService = new CronJobService();

export const processPayment = async (req: Request, res: Response) => {
  try {
    const { accountId, amount, paymentDate } = req.body;
    
    if (!accountId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'accountId y amount son requeridos'
      });
    }

    const result = await paymentService.processPayment(
      accountId, 
      Number(amount), 
      paymentDate ? new Date(paymentDate) : undefined
    );

    res.json({
      success: true,
      message: 'Pago procesado exitosamente',
      data: result
    });

  } catch (error) {
    console.error('Error procesando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getDebtSummary = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    
    const summary = await paymentService.getDebtSummary(accountId);

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error obteniendo resumen de deuda:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const runQuotaGenerationManually = async (req: Request, res: Response) => {
  try {
    const quotasCreated = await cronJobService.runQuotaGenerationManually();

    res.json({
      success: true,
      message: 'Generación de cuotas ejecutada manualmente',
      data: { quotasCreated }
    });

  } catch (error) {
    console.error('Error en generación manual:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const runOverdueProcessingManually = async (req: Request, res: Response) => {
  try {
    const result = await cronJobService.runOverdueProcessingManually();

    res.json({
      success: true,
      message: 'Procesamiento de vencidos ejecutado manualmente',
      data: result
    });

  } catch (error) {
    console.error('Error en procesamiento manual:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
