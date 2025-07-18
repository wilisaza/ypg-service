import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

interface UserForm extends Partial<User> {
  password?: string;
  confirmPassword?: string;
}

const apiUrl = import.meta.env.VITE_API_URL || '/api';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>({ username: '', email: '', fullName: '', role: 'USER', isActive: true, password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/users`, {
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
      setUsers(data.data || []);
    } catch (err) {
      window.alert('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpen = (user?: User) => {
    setEditingUser(user || null);
    if (user) {
      console.log('Editar usuario:', user);
      setForm({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        role: user.role || 'USER',
        isActive: typeof user.isActive === 'boolean' ? user.isActive : true,
        password: '',
        confirmPassword: ''
      });
    } else {
      setForm({ username: '', email: '', fullName: '', role: 'USER', isActive: true, password: '', confirmPassword: '' });
    }
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
    setForm({ username: '', email: '', fullName: '', role: 'USER', isActive: true, password: '', confirmPassword: '' });
    setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    // Validaciones frontend
    if (!form.username || !form.email || !form.fullName) {
      setError('Completa todos los campos obligatorios.');
      return;
    }
    if (!editingUser) {
      if (!form.password || form.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }
    const token = localStorage.getItem('token');
    try {
      const payload = { ...form };
      if (editingUser) {
        delete payload.password;
        delete payload.confirmPassword;
      } else {
        // Solo enviar password si es nuevo usuario
        delete payload.confirmPassword;
      }
      const res = await fetch(
        `${apiUrl}/users${editingUser ? `/${editingUser.id}` : ''}`,
        {
          method: editingUser ? 'PUT' : 'POST',
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
      if (!res.ok) throw new Error('Error al guardar usuario');
      handleClose();
      fetchUsers();
    } catch (err) {
      setError('Error al guardar usuario');
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      const res = await fetch(`${apiUrl}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        window.alert('Sesión expirada o token inválido. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      fetchUsers();
    } catch (err) {
      window.alert('Error al conectar con el servidor.');
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Gestión de Usuarios</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ mb: 2 }}>
        Nuevo Usuario
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
                <TableCell>Usuario</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Activo</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.isActive ? 'Sí' : 'No'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpen(user)}><EditIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton color="error" onClick={() => handleDelete(user.id)}><DeleteIcon /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 0 }}>
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          <IconButton aria-label="Cerrar" onClick={handleClose} size="small" sx={{ ml: 2 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
            <TextField
              label="Usuario"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Nombre completo"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              fullWidth
              sx={{ gridColumn: { xs: '1', sm: '1 / 3' } }}
            />
            <TextField
              label="Rol"
              name="role"
              value={form.role}
              onChange={handleChange}
              select
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
            </TextField>
            <TextField
              label="Activo"
              name="isActive"
              value={form.isActive ? 'true' : 'false'}
              onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}
              select
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="true">Sí</option>
              <option value="false">No</option>
            </TextField>
            {/* Solo mostrar campos de contraseña al crear usuario */}
            {!editingUser && (
              <>
                <TextField
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                <TextField
                  label="Repetir contraseña"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  fullWidth
                />
              </>
            )}
          </Box>
          {error && <Typography color="error" mt={2}>{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
