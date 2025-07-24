import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

// Funciones de formato para valores monetarios
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ===================================================================
// NUEVAS INTERFACES Y TIPOS ALINEADOS CON PRISMA SCHEMA
// ===================================================================

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
}

const ProductType = {
  SAVINGS: 'SAVINGS',
  LOAN: 'LOAN',
} as const;
type ProductType = typeof ProductType[keyof typeof ProductType];

interface Product {
  id: number;
  name: string;
  type: ProductType;
  description?: string;
  interestRate?: number;
  monthlyFee?: number;
  penaltyRate?: number;
}

const AccountStatus = {
  ACTIVE: 'ACTIVE',
  DORMANT: 'DORMANT',
  CLOSED: 'CLOSED',
  BLOCKED: 'BLOCKED',
} as const;
type AccountStatus = typeof AccountStatus[keyof typeof AccountStatus];


interface LoanDetails {
  id: string;
  principalAmount: number;
  termMonths: number;
  monthlyPayment: number;
  interestRate: number;
}

interface Account {
  id: string;
  user: User;
  product: Product;
  balance: number;
  status: AccountStatus;
  openedAt: string;
  loanDetails?: LoanDetails | null;
  userId: string;
  productId: number;
}

const TransactionType = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  INTEREST_ACCRUED: 'INTEREST_ACCRUED',
  LOAN_DISBURSEMENT: 'LOAN_DISBURSEMENT',
  FEE_PAYMENT: 'FEE_PAYMENT',
  PENALTY_FEE: 'PENALTY_FEE',
  MANAGEMENT_FEE: 'MANAGEMENT_FEE',
  ADJUSTMENT_CREDIT: 'ADJUSTMENT_CREDIT',
  ADJUSTMENT_DEBIT: 'ADJUSTMENT_DEBIT',
} as const;
type TransactionType = typeof TransactionType[keyof typeof TransactionType];

const TransactionStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
  CANCELED: 'CANCELED',
} as const;
type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];

interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  date: string;
  description?: string;
  dueDate?: string;
}

// Interfaz para el formulario de creación/edición
interface AccountFormData {
  userId: string;
  productId: number | '';
  balance: number; // Para Ahorros, es el saldo inicial. Para Préstamos, es el monto solicitado.
  termMonths?: number; // Solo para préstamos
}

// Interfaz para el cuerpo de la petición de creación
interface CreateAccountBody {
    userId: string;
    productId: number;
    principalAmount?: number;
    termMonths?: number;
    balance?: number;
}


const ProductAccountManagement: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para modal de transacciones
  const [openTransactionsDialog, setOpenTransactionsDialog] = useState(false);
  const [selectedAccountTransactions, setSelectedAccountTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedAccountInfo, setSelectedAccountInfo] = useState<Account | null>(null);

  const [formData, setFormData] = useState<AccountFormData>({
    userId: '',
    productId: '',
    balance: 0,
    termMonths: 12, // Default para préstamos
  });

  const apiUrl = import.meta.env.VITE_API_URL || '/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      // Endpoint actualizado de /product-accounts a /accounts
      const response = await fetch(`${apiUrl}/accounts`, {
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401 || response.status === 403) {
        window.alert('Sesión expirada o token inválido. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        navigate('/login');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.data);
      } else {
        setError(data.error || 'Error al cargar las cuentas');
      }
    } catch {
      setError('Error de conexión al cargar las cuentas');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, navigate]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/users`, {
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401 || response.status === 403) {
        window.alert('Sesión expirada o token inválido. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
      }
    } catch {
      console.error('Error al cargar usuarios');
    }
  }, [apiUrl, navigate]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/products`, {
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401 || response.status === 403) {
        window.alert('Sesión expirada o token inválido. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      }
    } catch {
      console.error('Error al cargar productos');
    }
  }, [apiUrl, navigate]);

  // Función para obtener transacciones de una cuenta específica
  const fetchAccountTransactions = useCallback(async (accountId: string) => {
    setLoadingTransactions(true);
    try {
      // Endpoint actualizado para filtrar por accountId
      const response = await fetch(`${apiUrl}/transactions?accountId=${accountId}`, {
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401 || response.status === 403) {
        window.alert('Sesión expirada o token inválido. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedAccountTransactions(data.data || []);
      } else {
        setError(data.error || 'Error al cargar las transacciones');
        setSelectedAccountTransactions([]);
      }
    } catch {
      setError('Error de conexión al cargar las transacciones');
      setSelectedAccountTransactions([]);
    }
    setLoadingTransactions(false);
  }, [apiUrl, navigate]);

  useEffect(() => {
    fetchAccounts();
    fetchUsers();
    fetchProducts();
  }, [fetchAccounts, fetchUsers, fetchProducts]);

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      // La edición está deshabilitada por ahora para simplificar, 
      // pero preparamos los datos si se implementara.
      setEditingAccount(account);
      setFormData({
        userId: account.userId,
        productId: account.productId,
        balance: account.product.type === ProductType.LOAN 
          ? account.loanDetails?.principalAmount || 0
          : account.balance,
        termMonths: account.loanDetails?.termMonths,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        userId: '',
        productId: '',
        balance: 0,
        termMonths: 12,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAccount(null);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (accountId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.')) {
      return;
    }
    setSubmitLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`${apiUrl}/accounts/${accountId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        window.alert('Sesión expirada o token inválido.');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSuccess('Cuenta eliminada correctamente.');
        fetchAccounts(); // Recargar la lista
      } else {
        setError(data.error || 'Error al eliminar la cuenta.');
      }
    } catch {
      setError('Error de conexión al eliminar la cuenta.');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitLoading(true);
    setError(null);
    setSuccess(null);

    const selectedProduct = products.find(p => p.id === formData.productId);
    if (!selectedProduct || !formData.productId) {
        setError("Producto seleccionado no válido.");
        setSubmitLoading(false);
        return;
    }

    const body: CreateAccountBody = {
        userId: formData.userId,
        productId: formData.productId,
    };

    if (selectedProduct.type === ProductType.LOAN) {
        body.principalAmount = formData.balance;
        body.termMonths = formData.termMonths;
    } else {
        body.balance = formData.balance;
    }

    // La edición no está implementada en el backend, solo creación
    const url = `${apiUrl}/accounts`;
    const method = 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (response.status === 401 || response.status === 403) {
        window.alert('Sesión expirada o token inválido.');
        navigate('/login');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSuccess('Cuenta creada correctamente.');
        handleCloseDialog();
        fetchAccounts();
      } else {
        setError(data.error || 'Ocurrió un error.');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenTransactionsDialog = (account: Account) => {
    setSelectedAccountInfo(account);
    fetchAccountTransactions(account.id);
    setOpenTransactionsDialog(true);
  };

  const handleCloseTransactionsDialog = () => {
    setOpenTransactionsDialog(false);
    setSelectedAccountTransactions([]);
    setSelectedAccountInfo(null);
  };

  const selectedProductForForm = products.find(p => p.id === formData.productId);

  // ===================================================================
  // RENDERIZADO DEL COMPONENTE
  // ===================================================================
  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="div">
              Gestión de Cuentas
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Crear Cuenta
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Saldo / Monto</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha Apertura</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.user.fullName}</TableCell>
                      <TableCell>{account.product.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={account.product.type} 
                          color={account.product.type === ProductType.LOAN ? 'primary' : 'secondary'} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(account.product.type === ProductType.LOAN ? account.loanDetails?.principalAmount ?? 0 : account.balance)}
                      </TableCell>
                      <TableCell>
                        <Chip label={account.status} color={account.status === AccountStatus.ACTIVE ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>{new Date(account.openedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleOpenDialog(account)} size="small" title="Editar (deshabilitado)">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(account.id)} size="small" disabled={submitLoading} title="Eliminar">
                          <DeleteIcon />
                        </IconButton>
                        <IconButton onClick={() => handleOpenTransactionsDialog(account)} size="small" title="Ver Transacciones">
                          <ReceiptIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* DIÁLOGO PARA CREAR/EDITAR CUENTA */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAccount ? 'Editar Cuenta' : 'Crear Nueva Cuenta'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Usuario</InputLabel>
              <Select
                name="userId"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                disabled={!!editingAccount}
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>{user.fullName}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Producto</InputLabel>
              <Select
                name="productId"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: Number(e.target.value) })}
                disabled={!!editingAccount}
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>{product.name} ({product.type})</MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedProductForForm && (
              <>
                <TextField
                  name="balance"
                  label={selectedProductForForm.type === ProductType.LOAN ? 'Monto del Préstamo' : 'Saldo Inicial'}
                  type="number"
                  fullWidth
                  margin="normal"
                  required
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                  disabled={!!editingAccount}
                />

                {selectedProductForForm.type === ProductType.LOAN && (
                  <TextField
                    name="termMonths"
                    label="Plazo (meses)"
                    type="number"
                    fullWidth
                    margin="normal"
                    required
                    value={formData.termMonths}
                    onChange={(e) => setFormData({ ...formData, termMonths: Number(e.target.value) })}
                    disabled={!!editingAccount}
                  />
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            type="submit" 
            variant="contained" 
            onClick={handleSubmit}
            disabled={submitLoading || !!editingAccount} // Deshabilitar si se está editando
          >
            {submitLoading ? <CircularProgress size={24} /> : 'Crear Cuenta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIÁLOGO PARA VER TRANSACCIONES */}
      <Dialog open={openTransactionsDialog} onClose={handleCloseTransactionsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Transacciones de la Cuenta
          {selectedAccountInfo && (
            <Typography variant="body2" color="text.secondary">
              {selectedAccountInfo.user.fullName} - {selectedAccountInfo.product.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {loadingTransactions ? (
            <CircularProgress />
          ) : selectedAccountTransactions.length > 0 ? (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedAccountTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.date).toLocaleString()}</TableCell>
                      <TableCell>{tx.type.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{tx.description || '-'}</TableCell>
                      <TableCell>
                        <Chip label={tx.status} size="small" />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(tx.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No se encontraron transacciones para esta cuenta.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransactionsDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductAccountManagement;
