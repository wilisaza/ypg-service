import React, { useState, useEffect, useCallback } from 'react';
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

// Funciones de formato para valores monetarios
const formatCurrencyWithDecimals = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  type: 'AHORRO' | 'PRESTAMO';
  description?: string;
}

interface ProductAccount {
  id: string;
  user: User;
  product: Product;
  amount: number;
  principal?: number;
  interest?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
  };
}

interface ProductAccountFormData {
  userId: string;
  productId: string;
  amount: number;
  principal?: number;
  interest?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

const ProductAccountManagement: React.FC = () => {
  const [productAccounts, setProductAccounts] = useState<ProductAccount[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ProductAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProductAccountFormData>({
    userId: '',
    productId: '',
    amount: 0,
    principal: undefined,
    interest: undefined,
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const apiUrl = import.meta.env.VITE_API_URL || '/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchProductAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/product-accounts`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setProductAccounts(data.data);
      } else {
        setError(data.error || 'Error al cargar las cuentas de productos');
      }
    } catch {
      setError('Error de conexión al cargar las cuentas de productos');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/users`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
      }
    } catch {
      console.error('Error al cargar usuarios');
    }
  }, [apiUrl]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/products`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      }
    } catch {
      console.error('Error al cargar productos');
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchProductAccounts();
    fetchUsers();
    fetchProducts();
  }, [fetchProductAccounts, fetchUsers, fetchProducts]);

  const handleOpenDialog = (account?: ProductAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        userId: account.user.id,
        productId: account.product.id,
        amount: account.amount,
        principal: account.principal || undefined,
        interest: account.interest || undefined,
        startDate: account.startDate ? account.startDate.split('T')[0] : '',
        endDate: account.endDate ? account.endDate.split('T')[0] : '',
        isActive: account.isActive,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        userId: '',
        productId: '',
        amount: 0,
        principal: undefined,
        interest: undefined,
        startDate: '',
        endDate: '',
        isActive: true,
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

  const handleSubmit = async () => {
    try {
      const url = editingAccount
        ? `${apiUrl}/product-accounts/${editingAccount.id}`
        : `${apiUrl}/product-accounts`;
      
      const method = editingAccount ? 'PUT' : 'POST';
      
      // Preparar datos para envío
      const dataToSend = { ...formData };
      
      // Limpiar campos vacíos
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key as keyof ProductAccountFormData] === '' || 
            dataToSend[key as keyof ProductAccountFormData] === undefined) {
          delete dataToSend[key as keyof ProductAccountFormData];
        }
      });

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingAccount ? 'Cuenta actualizada exitosamente' : 'Cuenta creada exitosamente');
        fetchProductAccounts();
        handleCloseDialog();
      } else {
        setError(data.error || 'Error al guardar la cuenta');
      }
    } catch {
      setError('Error de conexión al guardar la cuenta');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta cuenta?')) {
      try {
        const response = await fetch(`${apiUrl}/product-accounts/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          setSuccess('Cuenta eliminada exitosamente');
          fetchProductAccounts();
        } else {
          const data = await response.json();
          setError(data.error || 'Error al eliminar la cuenta');
        }
      } catch {
        setError('Error de conexión al eliminar la cuenta');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getProductTypeChip = (type: 'AHORRO' | 'PRESTAMO') => {
    return (
      <Chip
        label={type}
        color={type === 'AHORRO' ? 'success' : 'primary'}
        size="small"
      />
    );
  };

  const selectedProduct = products.find(p => p.id === formData.productId);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Cuentas de Productos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Cuenta
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="20" stroke="#1976d2" strokeWidth="4" strokeDasharray="31.4 31.4" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" from="0 24 24" to="360 24 24" />
            </circle>
          </svg>
        </Box>
      ) : (
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Detalles</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Transacciones</TableCell>
                    <TableCell>Fecha Creación</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {account.user.fullName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {account.user.username}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{account.product.name}</TableCell>
                      <TableCell>{getProductTypeChip(account.product.type)}</TableCell>
                      <TableCell>
                        {formatCurrencyWithDecimals(account.amount)}
                        <Typography variant="caption" display="block" color="textSecondary">
                          {account.product.type === 'PRESTAMO' ? 'Monto a prestar' : 'Depósito inicial'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {account.product.type === 'PRESTAMO' && account.principal ? (
                          <Box>
                            <Typography variant="body2">
                              {formatCurrencyWithDecimals(account.principal || 0)}
                            </Typography>
                            <Typography variant="caption" display="block" color="textSecondary">
                              Proyección total
                            </Typography>
                            {account.interest && (
                              <Typography variant="caption" color="textSecondary">
                                Interés: {account.interest}%
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="body2">
                              {formatCurrencyWithDecimals(account.principal || 0)}
                            </Typography>
                            <Typography variant="caption" display="block" color="textSecondary">
                              Monto ahorrado
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={account.isActive ? 'Activa' : 'Inactiva'}
                          color={account.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{account._count?.transactions || 0}</TableCell>
                      <TableCell>{formatDate(account.createdAt)}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(account)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(account.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Dialog para crear/editar cuenta */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAccount ? 'Editar Cuenta de Producto' : 'Nueva Cuenta de Producto'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Usuario</InputLabel>
                <Select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  disabled={!!editingAccount}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.fullName} ({user.username})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Producto</InputLabel>
                <Select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  disabled={!!editingAccount}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} ({product.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              label={selectedProduct?.type === 'PRESTAMO' ? 'Monto a Prestar' : 'Monto'}
              value={formData.amount > 0 ? formatCurrencyWithDecimals(formData.amount) : ''}
              onChange={(e) => {
                // Extraer solo números y comas decimales
                const cleanValue = e.target.value.replace(/[^0-9,]/g, '');
                // Convertir coma decimal a punto para parseFloat
                const numericValue = cleanValue.replace(',', '.');
                const amount = parseFloat(numericValue) || 0;
                setFormData({ ...formData, amount });
              }}
              placeholder="$ 0,00"
              helperText={selectedProduct?.type === 'PRESTAMO' ? 'Monto base que se le prestará al usuario' : 'Meta de ahorro total'}
            />

            {selectedProduct?.type === 'PRESTAMO' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Proyección Total"
                    value={formData.principal ? formatCurrencyWithDecimals(formData.principal) : ''}
                    helperText="Se calcula automáticamente (monto + intereses)"
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{ backgroundColor: '#f5f5f5' }}
                  />
                  <TextField
                    fullWidth
                    label="Interés (%)"
                    type="number"
                    value={formData.interest || ''}
                    onChange={(e) => setFormData({ ...formData, interest: Number(e.target.value) || undefined })}
                    helperText="Tasa de interés anual"
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Fecha de Inicio"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    label="Fecha de Fin"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Cuenta Activa"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAccount ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductAccountManagement;
