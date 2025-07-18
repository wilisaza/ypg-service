import { Box, Typography, Button, Paper } from '@mui/material';

interface DashboardProps {
  role: string;
  username: string;
  onLogout: () => void;
}

export default function Dashboard({ role, username, onLogout }: DashboardProps) {
  return (
    <Box minHeight="100vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" bgcolor="background.default" p={2}>
      <Paper elevation={4} sx={{ p: 4, minWidth: 320, borderRadius: 4, textAlign: 'center' }}>
        <Typography variant="h4" mb={2}>
          Bienvenido, {username}
        </Typography>
        <Typography variant="h6" mb={3} color="primary">
          Rol: {role}
        </Typography>
        {role === 'ADMIN' ? (
          <>
            <Button variant="contained" color="primary" sx={{ m: 1 }} fullWidth>Gestión de Usuarios</Button>
            <Button variant="contained" color="primary" sx={{ m: 1 }} fullWidth>Gestión de Productos</Button>
            <Button variant="contained" color="primary" sx={{ m: 1 }} fullWidth>Reportes</Button>
          </>
        ) : (
          <>
            <Button variant="contained" color="primary" sx={{ m: 1 }} fullWidth>Mis Ahorros</Button>
            <Button variant="contained" color="primary" sx={{ m: 1 }} fullWidth>Mis Préstamos</Button>
            <Button variant="contained" color="primary" sx={{ m: 1 }} fullWidth>Mis Transacciones</Button>
          </>
        )}
        <Button variant="outlined" color="secondary" sx={{ mt: 3 }} onClick={onLogout} fullWidth>Cerrar sesión</Button>
      </Paper>
    </Box>
  );
}
