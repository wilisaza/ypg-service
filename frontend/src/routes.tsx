import { RouteObject } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './pages/AdminLayout';
import UserManagement from './pages/UserManagement';
import ProductManagement from './pages/ProductManagement';
import ProductAccountManagement from './pages/ProductAccountManagement';

export const routes: RouteObject[] = [
  { path: '/login', element: <Login /> },
  // Puedes agregar más rutas aquí
  {
    path: '/dashboard/ADMIN',
    element: <AdminLayout username="admin" onLogout={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} />,
    children: [
      { path: 'users', element: <UserManagement /> },
      { path: 'products', element: <ProductManagement /> },
      { path: 'product-accounts', element: <ProductAccountManagement /> },
    ]
  },
];
