import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { 
  processPayment, 
  getDebtSummary, 
  runQuotaGenerationManually, 
  runOverdueProcessingManually 
} from '../controllers/paymentController.js';

const router = Router();

// Procesar un pago
router.post('/process', authenticateToken, processPayment);

// Obtener resumen de deuda de una cuenta
router.get('/debt-summary/:accountId', authenticateToken, getDebtSummary);

// Ejecutar manualmente generación de cuotas (para testing)
router.post('/admin/generate-quotas', authenticateToken, runQuotaGenerationManually);

// Ejecutar manualmente procesamiento de vencidos (para testing)
router.post('/admin/process-overdue', authenticateToken, runOverdueProcessingManually);

export default router;
