import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import productRoutes from './products.js';
import productAccountRoutes from './productAccounts.js';
import transactionRoutes from './transactions.js';
import paymentRoutes from './payments.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/product-accounts', productAccountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/payments', paymentRoutes);
export default router;
