import { Router } from 'express';
import { VariableCapitalLoanController } from '../controllers/variableCapitalLoanController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { cronManager } from '../services/cronJobManager.js';

const router = Router();
const loanController = new VariableCapitalLoanController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route POST /api/loans/variable-capital
 * @desc Crear un nuevo préstamo de capital variable
 * @access Private
 * @body {
 *   userId: string,
 *   productId: number,
 *   principalAmount: number,
 *   termMonths: number
 * }
 */
router.post('/variable-capital', (req, res) => {
  loanController.createLoan(req, res);
});

/**
 * @route POST /api/loans/generate-daily-interest
 * @desc Generar intereses diarios para todos los préstamos activos
 * @access Private (Solo administradores - puede agregar validación de rol)
 */
router.post('/generate-daily-interest', (req, res) => {
  loanController.generateDailyInterest(req, res);
});

/**
 * @route POST /api/loans/cron/run-interest-now
 * @desc Ejecutar manualmente el job de intereses (testing)
 * @access Private
 */
router.post('/cron/run-interest-now', async (req, res) => {
  try {
    const result = await cronManager.runDailyInterestNow();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/loans/cron/status
 * @desc Obtener estado de los jobs de cron
 * @access Private
 */
router.get('/cron/status', (req, res) => {
  const status = cronManager.getJobsStatus();
  res.json({ success: true, data: status });
});

/**
 * @route POST /api/loans/:accountId/payment
 * @desc Procesar un pago al préstamo
 * @access Private
 * @params accountId: string (ID de la cuenta del préstamo)
 * @body {
 *   paymentAmount: number
 * }
 */
router.post('/:accountId/payment', (req, res) => {
  loanController.processPayment(req, res);
});

/**
 * @route GET /api/loans/:accountId/status
 * @desc Obtener estado actual del préstamo
 * @access Private
 * @params accountId: string (ID de la cuenta del préstamo)
 */
router.get('/:accountId/status', (req, res) => {
  loanController.getLoanStatus(req, res);
});

export default router;
