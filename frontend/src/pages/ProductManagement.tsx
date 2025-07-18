import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip,
  FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Product {
  id: string;
  name: string;
  type: 'AHORRO' | 'PRESTAMO';
  description?: string;
  
  // Campos específicos para AHORRO
  monthlyAmount?: number;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  penaltyAmount?: number;
  graceDays?: number;
  
  // Campos específicos para PRESTAMO
  defaultInterest?: number;
  termMonths?: number;
  
  createdAt: string;
  updatedAt: string;
}

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
    type: 'AHORRO', 
    description: '',
    monthlyAmount: undefined,
    startMonth: undefined,
    startYear: undefined,
    endMonth: undefined,
    endYear: undefined,
    penaltyAmount: undefined,
    graceDays: 5,
    defaultInterest: undefined,
    termMonths: undefined
  });
  const [error, setError] = useState('');

  // Funciones para formatear números con separadores de miles
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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
        type: product.type || 'AHORRO',
        description: product.description || '',
        monthlyAmount: product.monthlyAmount,
        startMonth: product.startMonth,
        startYear: product.startYear,
        endMonth: product.endMonth,
        endYear: product.endYear,
        penaltyAmount: product.penaltyAmount,
        graceDays: product.graceDays || 5,
        defaultInterest: product.defaultInterest,
        termMonths: product.termMonths
      });
    } else {
      setForm({ 
        name: '', 
        type: 'AHORRO', 
        description: '',
        monthlyAmount: undefined,
        startMonth: undefined,
        startYear: undefined,
        endMonth: undefined,
        endYear: undefined,
        penaltyAmount: undefined,
        graceDays: 5,
        defaultInterest: undefined,
        termMonths: undefined
      });
    }
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    setForm({ 
      name: '', 
      type: 'AHORRO', 
      description: '',
      monthlyAmount: undefined,
      startMonth: undefined,
      startYear: undefined,
      endMonth: undefined,
      endYear: undefined,
      penaltyAmount: undefined,
      graceDays: 5,
      defaultInterest: undefined,
      termMonths: undefined
    });
    setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsedValue = ['monthlyAmount', 'startMonth', 'startYear', 'endMonth', 'endYear', 'penaltyAmount', 'graceDays', 'defaultInterest', 'termMonths'].includes(name)
      ? value === '' ? undefined : Number(value)
      : value;
    setForm({ ...form, [name]: parsedValue });
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleMonthlyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseCurrency(value);
    setForm({ ...form, monthlyAmount: numericValue });
  };

  const handlePenaltyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseCurrency(value);
    setForm({ ...form, penaltyAmount: numericValue });
  };

  const handleSave = async () => {
    if (!form.name || !form.type) {
      setError('Completa todos los campos obligatorios.');
      return;
    }
    const token = localStorage.getItem('token');
    setSubmitLoading(true);
    try {
      const payload = { ...form };
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
      if (!res.ok) throw new Error('Error al guardar producto');
      handleClose();
      fetchProducts();
    } catch {
      setError('Error al guardar producto');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
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
      fetchProducts();
    } catch {
      window.alert('Error al conectar con el servidor.');
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
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="20" stroke="#1976d2" strokeWidth="4" strokeDasharray="31.4 31.4" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" from="0 24 24" to="360 24 24" />
            </circle>
          </svg>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Detalles Específicos</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map(product => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.type}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>
                    {product.type === 'AHORRO' ? (
                      <div>
                        {product.monthlyAmount && <div>Monto mensual: ${formatCurrency(product.monthlyAmount)}</div>}
                        {product.startMonth && product.startYear && (
                          <div>Inicio: {product.startMonth}/{product.startYear}</div>
                        )}
                        {product.endMonth && product.endYear && (
                          <div>Fin: {product.endMonth}/{product.endYear}</div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {product.defaultInterest && <div>Interés: {product.defaultInterest}%</div>}
                        {product.termMonths && <div>Plazo: {product.termMonths} meses</div>}
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
            />
            <FormControl fullWidth>
              <InputLabel>Tipo *</InputLabel>
              <Select
                value={form.type || 'AHORRO'}
                label="Tipo *"
                onChange={(e) => handleSelectChange('type', e.target.value)}
              >
                <MenuItem value="AHORRO">AHORRO</MenuItem>
                <MenuItem value="PRESTAMO">PRESTAMO</MenuItem>
              </Select>
            </FormControl>
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

          {/* Campos específicos para AHORRO */}
          {form.type === 'AHORRO' && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>Configuración de Ahorro</Typography>
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                <TextField
                  label="Monto Mensual"
                  name="monthlyAmount"
                  value={form.monthlyAmount ? formatCurrency(form.monthlyAmount) : ''}
                  onChange={handleMonthlyAmountChange}
                  fullWidth
                  placeholder="0"
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9,]*'
                  }}
                />
                <TextField
                  label="Mes de Inicio"
                  name="startMonth"
                  type="number"
                  value={form.startMonth || ''}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ min: 1, max: 12 }}
                />
                <TextField
                  label="Año de Inicio"
                  name="startYear"
                  type="number"
                  value={form.startYear || ''}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ min: 2024 }}
                />
                <TextField
                  label="Mes Fin"
                  name="endMonth"
                  type="number"
                  value={form.endMonth || ''}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ min: 1, max: 12 }}
                />
                <TextField
                  label="Multa por Pago Tardío"
                  name="penaltyAmount"
                  value={form.penaltyAmount ? formatCurrency(form.penaltyAmount) : ''}
                  onChange={handlePenaltyAmountChange}
                  fullWidth
                  placeholder="0"
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9,]*'
                  }}
                />
                <TextField
                  label="Días de Gracia"
                  name="graceDays"
                  type="number"
                  value={form.graceDays || ''}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ min: 1, max: 30 }}
                  helperText="Días antes de aplicar multa"
                />
              </Box>
            </Box>
          )}

          {/* Campos específicos para PRESTAMO */}
          {form.type === 'PRESTAMO' && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>Configuración de Préstamo</Typography>
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                <TextField
                  label="Interés por Defecto (%)"
                  name="defaultInterest"
                  type="number"
                  value={form.defaultInterest || ''}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
                <TextField
                  label="Plazo por Defecto (meses)"
                  name="termMonths"
                  type="number"
                  value={form.termMonths || ''}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ min: 1, max: 360 }}
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
