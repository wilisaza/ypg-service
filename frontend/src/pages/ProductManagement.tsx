import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Chip, Switch, FormControlLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Product {
  id: number;
  name: string;
  type: 'SAVINGS' | 'LOAN';
  loanType?: 'FRENCH_SYSTEM' | 'VARIABLE_CAPITAL';
  description?: string;
  interestRate?: number;
  minBalance?: number;
  maxBalance?: number;
  monthlyFee?: number;
  penaltyRate?: number;
  graceDays?: number;
  // Nuevos campos para planes de ahorro
  monthlyAmount?: number;
  billingDay?: number;
  penaltyAmount?: number;
  startMonth?: number;
  endMonth?: number;
  planYear?: number;
  isActive: boolean;
  activeAccounts?: number;
  createdAt: string;
  updatedAt: string;
}

// Traducciones para facilitar el uso
const monthLabels: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
};

const apiUrl = import.meta.env.VITE_API_URL || '/api';

export default function ProductManagement() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({
    name: '',
    type: 'SAVINGS',
    loanType: undefined,
    description: '',
    interestRate: 0,
    minBalance: 0,
    maxBalance: 0,
    monthlyFee: 0,
    penaltyRate: 0,
    graceDays: 0,
    // Nuevos campos para planes de ahorro
    monthlyAmount: 0,
    billingDay: 1,
    penaltyAmount: 0,
    startMonth: 1,
    endMonth: 12,
    planYear: new Date().getFullYear(),
    isActive: true
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Función para validar campos obligatorios
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Campos obligatorios básicos
    if (!form.name?.trim()) {
      errors.name = 'El nombre es obligatorio';
    }
    
    if (!form.type) {
      errors.type = 'El tipo de producto es obligatorio';
    }
    
    // Validaciones específicas para préstamos
    if (form.type === 'LOAN') {
      if (!form.loanType) {
        errors.loanType = 'El tipo de préstamo es obligatorio';
      }
    }
    
    // Validaciones específicas para planes de ahorro
    if (form.type === 'SAVINGS') {
      if (form.monthlyAmount && form.monthlyAmount <= 0) {
        errors.monthlyAmount = 'La cuota mensual debe ser mayor a 0';
      }
      
      if (form.billingDay && (form.billingDay < 1 || form.billingDay > 30)) {
        errors.billingDay = 'El día de cobro debe estar entre 1 y 30';
      }
      
      if (form.startMonth && form.endMonth && form.startMonth > form.endMonth) {
        errors.startMonth = 'El mes de inicio no puede ser posterior al mes de fin';
        errors.endMonth = 'El mes de fin no puede ser anterior al mes de inicio';
      }
      
      if (form.planYear && form.planYear < new Date().getFullYear()) {
        errors.planYear = 'El año del plan no puede ser anterior al año actual';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Función para verificar si un campo tiene error
  const hasError = (fieldName: string): boolean => {
    return fieldName in fieldErrors;
  };

  // Función para obtener el mensaje de error de un campo
  const getErrorMessage = (fieldName: string): string => {
    return fieldErrors[fieldName] || '';
  };

  // Funciones para formatear números con separadores de miles
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (rate: number): string => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/[^\d]/g, '')) || 0;
  };

  const fetchProducts = useCallback(async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        window.alert('Sesión expirada o token inválido. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        navigate('/login');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setProducts(data.data || []);
    } catch {
      window.alert('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpen = (product?: Product) => {
    setEditingProduct(product || null);
    if (product) {
      setForm({
        name: product.name || '',
        type: product.type || 'SAVINGS',
        loanType: product.loanType,
        description: product.description || '',
        interestRate: product.interestRate ? product.interestRate * 100 : 0, // Convert to percentage
        minBalance: product.minBalance || 0,
        maxBalance: product.maxBalance || 0,
        monthlyFee: product.monthlyFee || 0,
        penaltyRate: product.penaltyRate ? product.penaltyRate * 100 : 0, // Convert to percentage
        graceDays: product.graceDays || 0,
        // Nuevos campos para planes de ahorro
        monthlyAmount: product.monthlyAmount || 0,
        billingDay: product.billingDay || 1,
        penaltyAmount: product.penaltyAmount || 0,
        startMonth: product.startMonth || 1,
        endMonth: product.endMonth || 12,
        planYear: product.planYear || new Date().getFullYear(),
        isActive: product.isActive
      });
    } else {
      setForm({
        name: '',
        type: 'SAVINGS',
        loanType: undefined,
        description: '',
        interestRate: 0,
        minBalance: 0,
        maxBalance: 0,
        monthlyFee: 0,
        penaltyRate: 0,
        graceDays: 0,
        // Nuevos campos para planes de ahorro
        monthlyAmount: 0,
        billingDay: 1,
        penaltyAmount: 0,
        startMonth: 1,
        endMonth: 12,
        planYear: new Date().getFullYear(),
        isActive: true
      });
    }
    setOpen(true);
    setError('');
    setFieldErrors({}); // Limpiar errores de campos
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    setForm({
      name: '',
      type: 'SAVINGS',
      loanType: undefined,
      description: '',
      interestRate: 0,
      minBalance: 0,
      maxBalance: 0,
      monthlyFee: 0,
      penaltyRate: 0,
      graceDays: 0,
      // Nuevos campos para planes de ahorro
      monthlyAmount: 0,
      billingDay: 1,
      penaltyAmount: 0,
      startMonth: 1,
      endMonth: 12,
      planYear: new Date().getFullYear(),
      isActive: true
    });
    setError('');
    setFieldErrors({}); // Limpiar errores de campos
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericFields = ['interestRate', 'minBalance', 'maxBalance', 'monthlyFee', 'penaltyRate', 'graceDays', 
                          'monthlyAmount', 'billingDay', 'penaltyAmount', 'startMonth', 'endMonth', 'planYear'];
    const parsedValue = numericFields.includes(name)
      ? value === '' ? 0 : Number(value)
      : value;
    setForm({ ...form, [name]: parsedValue });
  };

  const handleSelectChange = (name: string, value: string | number) => {
    setForm({ ...form, [name]: value });
  };

  const handleCurrencyChange = (field: keyof Product) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseCurrency(value);
    setForm({ ...form, [field]: numericValue });
  };

  const handleSave = async () => {
    // Limpiar errores previos
    setError('');
    setFieldErrors({});
    
    // Validar formulario
    if (!validateForm()) {
      setError('Por favor, corrige los errores marcados en rojo antes de continuar.');
      return;
    }

    const token = localStorage.getItem('token');
    setSubmitLoading(true);
    try {
      // Prepare payload
      const payload: {
        name: string;
        type: string;
        description: string;
        isActive: boolean;
        loanType?: string;
        interestRate?: number;
        penaltyRate?: number;
        graceDays?: number;
        minBalance?: number;
        maxBalance?: number;
        monthlyFee?: number;
        // Nuevos campos para planes de ahorro
        monthlyAmount?: number;
        billingDay?: number;
        penaltyAmount?: number;
        startMonth?: number;
        endMonth?: number;
        planYear?: number;
      } = {
        name: form.name,
        type: form.type,
        description: form.description || '',
        isActive: form.isActive ?? true
      };

      // Add type-specific fields
      if (form.type === 'LOAN') {
        payload.loanType = form.loanType;
        if (form.interestRate) payload.interestRate = form.interestRate / 100; // Convert percentage to decimal
        if (form.penaltyRate) payload.penaltyRate = form.penaltyRate / 100;
        if (form.graceDays) payload.graceDays = form.graceDays;
        // Para préstamos de capital variable, monthlyFee es un valor fijo en pesos
        if (form.loanType === 'VARIABLE_CAPITAL' && form.monthlyFee) {
          payload.monthlyFee = form.monthlyFee;
        }
      } else if (form.type === 'SAVINGS') {
        if (form.interestRate) payload.interestRate = form.interestRate / 100;
        if (form.minBalance) payload.minBalance = form.minBalance;
        if (form.maxBalance) payload.maxBalance = form.maxBalance;
        if (form.monthlyFee) payload.monthlyFee = form.monthlyFee;
        if (form.penaltyRate) payload.penaltyRate = form.penaltyRate / 100;
        if (form.graceDays) payload.graceDays = form.graceDays;
        // Nuevos campos específicos para planes de ahorro
        if (form.monthlyAmount !== undefined && form.monthlyAmount !== null) payload.monthlyAmount = form.monthlyAmount;
        if (form.billingDay !== undefined && form.billingDay !== null) payload.billingDay = form.billingDay;
        if (form.penaltyAmount !== undefined && form.penaltyAmount !== null) payload.penaltyAmount = form.penaltyAmount;
        if (form.startMonth !== undefined && form.startMonth !== null) payload.startMonth = form.startMonth;
        if (form.endMonth !== undefined && form.endMonth !== null) payload.endMonth = form.endMonth;
        if (form.planYear !== undefined && form.planYear !== null) payload.planYear = form.planYear;
      }

      console.log('📤 Payload enviado al backend:', payload);

      const res = await fetch(
        `${apiUrl}/products${editingProduct ? `/${editingProduct.id}` : ''}`,
        {
          method: editingProduct ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        }
      );
      if (res.status === 401 || res.status === 403) {
        window.alert('Sesión expirada o token inválido. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al guardar producto');
      }
      handleClose();
      fetchProducts();
    } catch (err) {
      setError(`Error al guardar producto: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      const res = await fetch(`${apiUrl}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        window.alert('Sesión expirada o token inválido. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (res.status === 409) {
        window.alert('No se puede eliminar el producto porque tiene cuentas asociadas.');
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        window.alert(`Error al eliminar producto: ${errorData.message || 'Error desconocido'}`);
        return;
      }
      fetchProducts();
      window.alert('Producto eliminado exitosamente.');
    } catch (error) {
      console.error('Error de conexión:', error);
      window.alert('Error al conectar con el servidor.');
    }
  };

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case 'SAVINGS': return 'Ahorro';
      case 'LOAN': return 'Préstamo';
      default: return type;
    }
  };

  const getLoanTypeLabel = (loanType?: string) => {
    switch (loanType) {
      case 'FRENCH_SYSTEM': return 'Sistema Francés';
      case 'VARIABLE_CAPITAL': return 'Capital Variable';
      default: return '';
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Gestión de Productos</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ mb: 2 }}>
        Nuevo Producto
      </Button>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: 'calc(100vh - 180px)',
            overflow: 'auto'
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 180 }}>Nombre</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Tipo</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Estado</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Descripción</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Detalles Específicos</TableCell>
                <TableCell align="right" sx={{ minWidth: 120 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map(product => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getProductTypeLabel(product.type)} 
                      color={product.type === 'LOAN' ? 'primary' : 'secondary'}
                      size="small"
                    />
                    {product.loanType && (
                      <Chip 
                        label={getLoanTypeLabel(product.loanType)} 
                        variant="outlined"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={product.isActive ? 'Activo' : 'Inactivo'} 
                      color={product.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>
                    {product.type === 'SAVINGS' ? (
                      <div>
                        {product.monthlyAmount && <div>Cuota mensual: ${formatCurrency(product.monthlyAmount)}</div>}
                        {product.billingDay && <div>Día de cobro: {product.billingDay}</div>}
                        {product.penaltyAmount && <div>Multa: ${formatCurrency(product.penaltyAmount)}</div>}
                        {product.startMonth && product.endMonth && (
                          <div>Período: {monthLabels[product.startMonth]} - {monthLabels[product.endMonth]}</div>
                        )}
                        {product.planYear && <div>Año: {product.planYear}</div>}
                        {product.graceDays && <div>Días de gracia: {product.graceDays}</div>}
                        {product.interestRate && <div>Tasa de interés: {formatPercentage(product.interestRate)}</div>}
                        {product.minBalance && <div>Saldo mínimo: ${formatCurrency(product.minBalance)}</div>}
                        {product.maxBalance && <div>Saldo máximo: ${formatCurrency(product.maxBalance)}</div>}
                        {product.monthlyFee && <div>Cuota manejo: ${formatCurrency(product.monthlyFee)}</div>}
                        {product.penaltyRate && <div>Tasa multa (%): {formatPercentage(product.penaltyRate)}</div>}
                      </div>
                    ) : (
                      <div>
                        {product.interestRate && <div>Tasa de interés: {formatPercentage(product.interestRate)}</div>}
                        {product.loanType === 'VARIABLE_CAPITAL' && product.monthlyFee && (
                          <div>Multa mensual: ${formatCurrency(product.monthlyFee)}</div>
                        )}
                        {product.penaltyRate && <div>Tasa de multa: {formatPercentage(product.penaltyRate)}</div>}
                        {product.graceDays && <div>Días de gracia: {product.graceDays}</div>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpen(product)}><EditIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton color="error" onClick={() => handleDelete(product.id)}><DeleteIcon /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 0 }}>
          {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          <IconButton aria-label="Cerrar" onClick={handleClose} size="small" sx={{ ml: 2 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
            <TextField
              label="Nombre *"
              name="name"
              value={form.name || ''}
              onChange={handleChange}
              required
              fullWidth
              error={hasError('name')}
              helperText={getErrorMessage('name') || 'Nombre único del producto'}
            />
            <FormControl fullWidth error={hasError('type')}>
              <InputLabel>Tipo *</InputLabel>
              <Select
                value={form.type || 'SAVINGS'}
                label="Tipo *"
                onChange={(e) => handleSelectChange('type', e.target.value)}
              >
                <MenuItem value="SAVINGS">Plan de Ahorro</MenuItem>
                <MenuItem value="LOAN">Préstamo</MenuItem>
              </Select>
              {hasError('type') && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                  {getErrorMessage('type')}
                </Typography>
              )}
            </FormControl>

            {/* Loan Type Selection */}
            {form.type === 'LOAN' && (
              <FormControl fullWidth error={hasError('loanType')}>
                <InputLabel>Tipo de Préstamo *</InputLabel>
                <Select
                  value={form.loanType || ''}
                  label="Tipo de Préstamo *"
                  onChange={(e) => handleSelectChange('loanType', e.target.value)}
                >
                  <MenuItem value="FRENCH_SYSTEM">Sistema Francés</MenuItem>
                  <MenuItem value="VARIABLE_CAPITAL">Capital Variable</MenuItem>
                </Select>
                {hasError('loanType') && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                    {getErrorMessage('loanType')}
                  </Typography>
                )}
              </FormControl>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive || false}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
              }
              label="Producto Activo"
            />

            <TextField
              label="Descripción"
              name="description"
              value={form.description || ''}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
              sx={{ gridColumn: { xs: '1', sm: '1 / 3' } }}
            />
          </Box>

          {/* Common Fields */}
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>Configuración General</Typography>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
              <TextField
                label="Tasa de Interés (%)"
                name="interestRate"
                type="number"
                value={form.interestRate || ''}
                onChange={handleChange}
                fullWidth
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
              <TextField
                label="Tasa de Multa (%)"
                name="penaltyRate"
                type="number"
                value={form.penaltyRate || ''}
                onChange={handleChange}
                fullWidth
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
              <TextField
                label="Días de Gracia"
                name="graceDays"
                type="number"
                value={form.graceDays || ''}
                onChange={handleChange}
                fullWidth
                inputProps={{ min: 0, max: 30 }}
                helperText="Días antes de aplicar multa"
              />
            </Box>
          </Box>

          {/* Specific Fields for VARIABLE_CAPITAL Loans */}
          {form.type === 'LOAN' && form.loanType === 'VARIABLE_CAPITAL' && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>Configuración de Préstamo Capital Variable</Typography>
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                <TextField
                  label="Multa Mensual (Valor Fijo)"
                  name="monthlyFee"
                  value={form.monthlyFee ? formatCurrency(form.monthlyFee) : ''}
                  onChange={handleCurrencyChange('monthlyFee')}
                  fullWidth
                  placeholder="0"
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9,]*'
                  }}
                  helperText="Valor fijo en pesos que se cobra mensualmente"
                />
              </Box>
            </Box>
          )}

          {/* Specific Fields for SAVINGS */}
          {form.type === 'SAVINGS' && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>Configuración de Plan de Ahorro</Typography>
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                {/* Nuevos campos específicos para planes de ahorro */}
                <TextField
                  label="Cuota Mensual del Plan"
                  name="monthlyAmount"
                  value={form.monthlyAmount ? formatCurrency(form.monthlyAmount) : ''}
                  onChange={handleCurrencyChange('monthlyAmount')}
                  fullWidth
                  placeholder="50000"
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9,]*'
                  }}
                  error={hasError('monthlyAmount')}
                  helperText={getErrorMessage('monthlyAmount') || 'Monto fijo mensual del plan de ahorro'}
                />
                <TextField
                  label="Día de Cobro"
                  name="billingDay"
                  type="number"
                  value={form.billingDay || ''}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ min: 1, max: 30 }}
                  error={hasError('billingDay')}
                  helperText={getErrorMessage('billingDay') || 'Día del mes para el cobro (1-30)'}
                />
                <TextField
                  label="Multa por Atraso"
                  name="penaltyAmount"
                  value={form.penaltyAmount ? formatCurrency(form.penaltyAmount) : ''}
                  onChange={handleCurrencyChange('penaltyAmount')}
                  fullWidth
                  placeholder="10000"
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9,]*'
                  }}
                  error={hasError('penaltyAmount')}
                  helperText={getErrorMessage('penaltyAmount') || 'Valor fijo en pesos por atraso'}
                />
                <FormControl fullWidth error={hasError('startMonth')}>
                  <InputLabel>Mes de Inicio</InputLabel>
                  <Select
                    value={form.startMonth || 1}
                    onChange={(e) => handleSelectChange('startMonth', Number(e.target.value))}
                  >
                    {Object.entries(monthLabels).map(([value, label]) => (
                      <MenuItem key={value} value={parseInt(value)}>{label}</MenuItem>
                    ))}
                  </Select>
                  {hasError('startMonth') && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {getErrorMessage('startMonth')}
                    </Typography>
                  )}
                </FormControl>
                <FormControl fullWidth error={hasError('endMonth')}>
                  <InputLabel>Mes de Fin</InputLabel>
                  <Select
                    value={form.endMonth || 12}
                    onChange={(e) => handleSelectChange('endMonth', Number(e.target.value))}
                  >
                    {Object.entries(monthLabels).map(([value, label]) => (
                      <MenuItem key={value} value={parseInt(value)}>{label}</MenuItem>
                    ))}
                  </Select>
                  {hasError('endMonth') && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {getErrorMessage('endMonth')}
                    </Typography>
                  )}
                </FormControl>
                <TextField
                  label="Año del Plan"
                  name="planYear"
                  type="number"
                  value={form.planYear || ''}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ min: new Date().getFullYear(), max: new Date().getFullYear() + 10 }}
                  error={hasError('planYear')}
                  helperText={getErrorMessage('planYear') || 'Año del plan de ahorro'}
                />
                
                {/* Campos opcionales adicionales */}
                <TextField
                  label="Saldo Mínimo (Opcional)"
                  name="minBalance"
                  value={form.minBalance ? formatCurrency(form.minBalance) : ''}
                  onChange={handleCurrencyChange('minBalance')}
                  fullWidth
                  placeholder="0"
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9,]*'
                  }}
                />
                <TextField
                  label="Saldo Máximo (Opcional)"
                  name="maxBalance"
                  value={form.maxBalance ? formatCurrency(form.maxBalance) : ''}
                  onChange={handleCurrencyChange('maxBalance')}
                  fullWidth
                  placeholder="0"
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9,]*'
                  }}
                />
                <TextField
                  label="Cuota de Manejo (Opcional)"
                  name="monthlyFee"
                  value={form.monthlyFee ? formatCurrency(form.monthlyFee) : ''}
                  onChange={handleCurrencyChange('monthlyFee')}
                  fullWidth
                  placeholder="0"
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9,]*'
                  }}
                  helperText="Cuota adicional de manejo"
                />
              </Box>
            </Box>
          )}

          {error && <Typography color="error" mt={2}>{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={submitLoading}
            startIcon={submitLoading ? <CircularProgress size={20} /> : null}
          >
            {submitLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
