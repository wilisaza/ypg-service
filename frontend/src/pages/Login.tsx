
import { useState, useContext } from 'react';
import { TextField, Button, Box, Typography, Paper, Alert, InputAdornment, IconButton } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ThemeContext } from '../themeContext';
import logo from '../assets/ypg.jpg'; // Cambia por tu logo real si lo tienes

interface LoginProps {
  onLogin?: (user: { username: string; role: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const themeContext = useContext(ThemeContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error de autenticación');
      localStorage.setItem('token', data.token);
      // Decodifica el token para obtener el rol y username
      const payload = JSON.parse(atob(data.token.split('.')[1]));
      if (onLogin) onLogin({ username: payload.username, role: payload.role });
      window.location.href = `/dashboard/${payload.role}`;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        bgcolor: 'linear-gradient(135deg, #e0e7ff 0%, #f5f5f5 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: { xs: 2, sm: 4 },
          width: '100%',
          maxWidth: 380,
          borderRadius: 4,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box mb={2} display="flex" flexDirection="column" alignItems="center">
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{ width: 64, height: 64, mb: 1, borderRadius: '50%', boxShadow: 2, bgcolor: '#fff' }}
          />
          <Typography variant="h5" fontWeight={700} color="primary.main" mb={1} align="center">
            Iniciar sesión
          </Typography>
        </Box>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField
            label="Usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            fullWidth
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle color="primary" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, py: 1.2, fontWeight: 600, fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
        {/* Botón de alternancia de modo claro/oscuro debajo del botón Ingresar */}
        <Box display="flex" justifyContent="center" width="100%" mt={1}>
          <IconButton
            size="small"
            onClick={themeContext.toggleMode}
            color="primary"
            aria-label="Alternar modo claro/oscuro"
            sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mt: 1 }}
          >
            {themeContext.mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
          </IconButton>
        </Box>
      </Paper>
      <Typography variant="body2" color="text.secondary" mt={3} align="center">
        © {new Date().getFullYear()} YPG Holding. Todos los derechos reservados.
      </Typography>
    </Box>
  );
}
