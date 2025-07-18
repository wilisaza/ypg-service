import { Router } from 'express';
import { 
  getTransactions, 
  getTransaction, 
  createTransaction, 
  updateTransaction, 
  deleteTransaction,
  getLoanStatus 
} from '../controllers/transactionController.js';

const router = Router();
router.get('/', getTransactions);
router.get('/:id', getTransaction);
router.get('/loan-status/:accountId', getLoanStatus);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);
export default router;
