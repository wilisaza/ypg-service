import { Router } from 'express';
import { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction } from '../controllers/transactionController.js';

const router = Router();
router.get('/', getTransactions);
router.get('/:id', getTransaction);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);
export default router;
