import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import productRoutes from './products.js';
import accountRoutes from './accounts.js';
import transactionRoutes from './transactions.js';
import paymentRoutes from './payments.js';
import variableCapitalLoanRoutes from './variableCapitalLoans.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/payments', paymentRoutes);
router.use('/loans', variableCapitalLoanRoutes);
export default router;
