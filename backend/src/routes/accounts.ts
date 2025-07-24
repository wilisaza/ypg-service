import { Router } from 'express';
import { 
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountsByUserId
} from '../controllers/accountController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para cuentas
router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.post('/', createAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

// Rutas específicas
router.get('/user/:userId', getAccountsByUserId);

export default router;
