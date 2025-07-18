import { Box, Typography, AppBar, Toolbar, IconButton, Menu, MenuItem, Avatar, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState, useContext } from 'react';
import { ThemeContext } from '../themeContext';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardProps {
  username: string;
  onLogout: () => void;
}

export default function AdminDashboard({ username, onLogout }: AdminDashboardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const themeContext = useContext(ThemeContext) as {
    mode: 'light' | 'dark';
    toggleMode: () => void;
  };
  const navigate = useNavigate();
  const handleMenuItemClick = (option: string) => {
    handleClose();
    if (option === 'Gestión de Usuarios') navigate('/dashboard/ADMIN/users');
    if (option === 'Gestión de Productos') navigate('/dashboard/ADMIN/products');
    if (option === 'Gestión de Cuentas de Productos') navigate('/dashboard/ADMIN/product-accounts');
    // Aquí puedes agregar más opciones de menú
  };
  return (
    <Box minHeight="100vh" bgcolor="background.default" width="100vw">
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleMenu} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Panel de Administración
          </Typography>
          <IconButton sx={{ ml: 1 }} color="inherit" onClick={themeContext.toggleMode}>
            {themeContext.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <Typography variant="body1" sx={{ mx: 2 }}>
            {username}
          </Typography>
          <Tooltip title="Cerrar sesión">
            <IconButton color="inherit" onClick={onLogout} sx={{ ml: 1 }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
          {/* Avatar del usuario al extremo derecho */}
          <Avatar sx={{ ml: 2, bgcolor: 'secondary.main', width: 36, height: 36 }}>
            {username
              ? username
                  .split(' ')
                  .map(word => word[0])
                  .join('')
                  .toUpperCase()
              : ''}
          </Avatar>
        </Toolbar>
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem onClick={() => handleMenuItemClick('Gestión de Usuarios')}>Gestión de Usuarios</MenuItem>
          <MenuItem onClick={() => handleMenuItemClick('Gestión de Productos')}>Gestión de Productos</MenuItem>
          <MenuItem onClick={() => handleMenuItemClick('Gestión de Cuentas de Productos')}>Gestión de Cuentas de Productos</MenuItem>
          <MenuItem onClick={() => handleMenuItemClick('Reportes')}>Reportes</MenuItem>
        </Menu>
      </AppBar>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight={{ xs: 'calc(100vh - 64px)', sm: '80vh' }}
        p={2}
        width="100vw"
      >
        {/* Contenido central eliminado, solo AppBar y estructura vacía */}
      </Box>
    </Box>
  );
}
