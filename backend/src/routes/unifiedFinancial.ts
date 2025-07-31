import { Router } from 'express';
import { productController } from '../controllers/unifiedProductController.js';
import { unifiedLoanController } from '../controllers/unifiedLoanController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// ===================================================================
// RUTAS DE PRODUCTOS UNIFICADAS
// ===================================================================

// Crear producto (préstamo o ahorro)
router.post('/products', authenticateToken, productController.createProduct.bind(productController));

// Listar todos los productos
router.get('/products', authenticateToken, productController.getProducts.bind(productController));

// Obtener producto por ID
router.get('/products/:id', authenticateToken, productController.getProductById.bind(productController));

// Actualizar producto
router.put('/products/:id', authenticateToken, productController.updateProduct.bind(productController));

// Eliminar/desactivar producto
router.delete('/products/:id', authenticateToken, productController.deleteProduct.bind(productController));

// Obtener productos por tipo (SAVINGS o LOAN)
router.get('/products/type/:type', authenticateToken, productController.getProductsByType.bind(productController));

// ===================================================================
// RUTAS DE PRÉSTAMOS UNIFICADAS
// ===================================================================

// Crear préstamo (automáticamente detecta el tipo según el producto)
router.post('/loans', authenticateToken, unifiedLoanController.createLoan.bind(unifiedLoanController));

// Obtener estado de un préstamo
router.get('/loans/:accountId/status', authenticateToken, unifiedLoanController.getLoanStatus.bind(unifiedLoanController));

// Procesar pago a un préstamo
router.post('/loans/:accountId/payment', authenticateToken, unifiedLoanController.processLoanPayment.bind(unifiedLoanController));

// Listar todos los préstamos activos
router.get('/loans', authenticateToken, unifiedLoanController.getActiveLoans.bind(unifiedLoanController));

// Obtener cronograma de pagos (solo para sistema francés)
router.get('/loans/:accountId/schedule', authenticateToken, unifiedLoanController.getPaymentSchedule.bind(unifiedLoanController));

// ===================================================================
// RUTAS DE ADMINISTRACIÓN EXISTENTES (mantenidas para compatibilidad)
// ===================================================================

// Generar intereses diarios manualmente
router.post('/loans/generate-daily-interest', authenticateToken, async (req, res) => {
  try {
    const variableCapitalLoanService = new (await import('../services/variableCapitalLoanService.js')).VariableCapitalLoanService();
    const result = await variableCapitalLoanService.generateDailyInterest();
    
    res.json({
      success: true,
      message: 'Intereses diarios generados exitosamente',
      data: { interestsGenerated: result }
    });
  } catch (error) {
    console.error('Error generating daily interest:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Estado de jobs de cron
router.get('/loans/cron/status', authenticateToken, async (req, res) => {
  try {
    const { cronManager } = await import('../services/cronJobManager.js');
    const status = cronManager.getJobsStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting cron status:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Ejecutar job de intereses ahora
router.post('/loans/cron/run-interest-now', authenticateToken, async (req, res) => {
  try {
    const { cronManager } = await import('../services/cronJobManager.js');
    const result = await cronManager.runDailyInterestNow();
    
    res.json({
      success: true,
      data: { interestsGenerated: result }
    });
  } catch (error) {
    console.error('Error running interest job:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
