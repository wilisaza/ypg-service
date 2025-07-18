import { Router } from 'express';
import { 
  getProductAccounts, 
  getProductAccount, 
  createProductAccount, 
  updateProductAccount, 
  deleteProductAccount,
  getProductAccountsByUser
} from '../controllers/productAccountController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para cuentas de productos
router.get('/', getProductAccounts);
router.get('/:id', getProductAccount);
router.post('/', createProductAccount);
router.put('/:id', updateProductAccount);
router.delete('/:id', deleteProductAccount);

// Rutas específicas
router.get('/user/:userId', getProductAccountsByUser);

export default router;
