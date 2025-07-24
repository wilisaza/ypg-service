import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import ProductManagement from './ProductManagement';
import ProductAccountManagement from './ProductAccountManagement';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';

interface AdminLayoutProps {
  username: string;
  onLogout: () => void;
}

export default function AdminLayout({ username, onLogout }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  // Solo muestra el recuadro si la ruta coincide
  const showUserManagement = location.pathname === '/dashboard/ADMIN/users';
  const showProductManagement = location.pathname === '/dashboard/ADMIN/products';
  const showAccountManagement = location.pathname === '/dashboard/ADMIN/accounts';

  return (
    <Box minHeight="100vh" width="100vw" bgcolor="background.default">
      <AdminDashboard username={username} onLogout={onLogout} />
      {/* Renderiza el recuadro fijo solo si la ruta coincide */}
      {showUserManagement && (
        <Box
          position="fixed"
          top="50%"
          left="50%"
          sx={{
            transform: 'translate(-50%, -50%)',
            minWidth: { xs: '90vw', sm: 600 },
            maxWidth: '95vw',
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            boxShadow: 4,
            borderRadius: 4,
            p: { xs: 1, sm: 3 },
            overflow: 'auto',
            zIndex: 1300,
          }}
        >
          <Box display="flex" justifyContent="flex-end">
            <IconButton aria-label="Cerrar gestión de usuarios" onClick={() => navigate('/dashboard/ADMIN')} size="large">
              <CloseIcon />
            </IconButton>
          </Box>
          <UserManagement />
        </Box>
      )}
      {showProductManagement && (
        <Box
          position="fixed"
          top="50%"
          left="50%"
          sx={{
            transform: 'translate(-50%, -50%)',
            minWidth: { xs: '90vw', sm: 600 },
            maxWidth: '95vw',
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            boxShadow: 4,
            borderRadius: 4,
            p: { xs: 1, sm: 3 },
            overflow: 'auto',
            zIndex: 1300,
          }}
        >
          <Box display="flex" justifyContent="flex-end">
            <IconButton aria-label="Cerrar gestión de productos" onClick={() => navigate('/dashboard/ADMIN')} size="large">
              <CloseIcon />
            </IconButton>
          </Box>
          <ProductManagement />
        </Box>
      )}

      {showAccountManagement && (
        <Box
          position="fixed"
          top="50%"
          left="50%"
          sx={{
            transform: 'translate(-50%, -50%)',
            minWidth: { xs: '90vw', sm: 600 },
            maxWidth: '95vw',
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            boxShadow: 4,
            borderRadius: 4,
            p: { xs: 1, sm: 3 },
            overflow: 'auto',
            zIndex: 1300,
          }}
        >
          <Box display="flex" justifyContent="flex-end">
            <IconButton aria-label="Cerrar gestión de cuentas de productos" onClick={() => navigate('/dashboard/ADMIN')} size="large">
              <CloseIcon />
            </IconButton>
          </Box>
          <ProductAccountManagement />
        </Box>
      )}
      <Outlet />
    </Box>
  );
}

