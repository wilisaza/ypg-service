import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import accountRoutes from './accounts.js';
import transactionRoutes from './transactions.js';
import paymentRoutes from './payments.js';
import unifiedFinancialRoutes from './unifiedFinancial.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/payments', paymentRoutes);

// Rutas unificadas para productos y préstamos
router.use('/', unifiedFinancialRoutes);

export default router;
