import { Router } from 'express';
import { 
  getTransactions, 
  getTransactionById, 
  createTransaction, 
  updateTransactionStatus, 
  deleteTransaction,
} from '../controllers/transactionController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.post('/', createTransaction);
router.patch('/:id/status', updateTransactionStatus); // Usamos PATCH para actualizaciones parciales
router.delete('/:id', deleteTransaction);

export default router;
