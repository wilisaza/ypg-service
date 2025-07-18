import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import productRoutes from './products.js';
import productAccountRoutes from './productAccounts.js';
import transactionRoutes from './transactions.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/product-accounts', productAccountRoutes);
router.use('/transactions', transactionRoutes);
export default router;
