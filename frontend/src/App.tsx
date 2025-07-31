import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AdminLayout from './pages/AdminLayout';
import UserManagement from './pages/UserManagement';
import ProductManagement from './pages/ProductManagement';
import ProductAccountManagement from './pages/ProductAccountManagement';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';
import { ThemeContext } from './themeContext';
import { useMemo, useState } from 'react';

function getUserFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

function App() {
  // Leer el modo desde localStorage o usar preferencia del sistema
  const getInitialMode = () => {
    const stored = localStorage.getItem('themeMode');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [mode, setMode] = useState<'light' | 'dark'>(getInitialMode);
  const theme = useMemo(() => getTheme(mode), [mode]);
  const [user, setUser] = useState(() => getUserFromToken());

  // Guardar el modo en localStorage cuando cambie
  const toggleMode = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', next);
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login onLogin={setUser} />} />
            <Route path="/dashboard/ADMIN" element={user && user.role === 'ADMIN' ? <AdminLayout username={user.username} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
              <Route path="users" element={<UserManagement />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="product-accounts" element={<ProductAccountManagement />} />
            </Route>
            <Route path="/dashboard/USER" element={user && user.role === 'USER' ? <UserDashboard username={user.username} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
            <Route path="/" element={user ? <Navigate to={`/dashboard/${user.role}`} replace /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to={user ? `/dashboard/${user.role}` : '/login'} replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default App;
