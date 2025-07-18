# YPG Service - Sistema de Gestión Financiera

Sistema completo de gestión de productos financieros (préstamos, ahorros, usuarios y transacciones) con autenticación JWT y buenas prácticas de seguridad.

## 🏗️ Arquitectura

- **Backend**: Node.js, Express, TypeScript, ES Modules
- **Frontend**: React, Vite, TypeScript, Material-UI v5
- **Base de datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT
- **Automatización**: Cron jobs para facturación

## 🚀 Características

### Backend
- ✅ API REST con TypeScript y ES Modules
- ✅ Autenticación JWT segura
- ✅ Prisma ORM con PostgreSQL
- ✅ Cálculos financieros automáticos (amortización francesa)
- ✅ Cron jobs para facturación automática
- ✅ Validación y manejo de errores

### Frontend
- ✅ React con TypeScript
- ✅ Material-UI v5 con tema personalizable (modo claro/oscuro)
- ✅ Gestión completa de usuarios, productos y cuentas
- ✅ Formato de moneda colombiana (COP)
- ✅ Interfaz responsive y moderna

### Funcionalidades
- 👥 **Gestión de usuarios**: CRUD completo con roles
- 💰 **Productos financieros**: Préstamos y planes de ahorro
- 📊 **Cuentas de productos**: Vinculación usuario-producto
- 💳 **Transacciones**: Historial y seguimiento
- 🔄 **Cálculos automáticos**: Proyecciones de préstamos con intereses
- 📅 **Facturación automática**: Generación de cuotas y multas

## 🛠️ Instalación

### Prerrequisitos
- Node.js 18+
- PostgreSQL
- npm o yarn

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno en .env
npx prisma migrate dev
npx prisma generate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuración

### Variables de entorno (Backend)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ypg_db"
JWT_SECRET="tu-jwt-secret-muy-seguro"
PORT=4000
```

### Variables de entorno (Frontend)
```env
VITE_API_URL=http://localhost:4000/api
```

## 📊 Base de datos

El proyecto utiliza Prisma como ORM con las siguientes entidades principales:

- **User**: Usuarios del sistema
- **FinancialProduct**: Productos financieros (préstamos/ahorros)
- **ProductAccount**: Cuentas vinculadas usuario-producto
- **Transaction**: Transacciones financieras
- **TransactionTypeDetail**: Tipos de transacciones

## 🎨 Tema visual

El frontend incluye un tema personalizado con:
- Modo claro y oscuro
- Colores principales en verde esmeralda (#10b981)
- Formato de moneda colombiana
- Componentes Material-UI estilizados

## 🔄 Cron Jobs

- **Facturación diaria**: Ejecuta a las 2:00 AM
- **Generación de cuotas**: Préstamos y ahorros
- **Cálculo de multas**: Automático por retrasos

## 📝 Scripts disponibles

### Backend
- `npm run dev`: Servidor de desarrollo
- `npm run build`: Compilar TypeScript
- `npm start`: Servidor de producción
- `npx prisma studio`: Interfaz visual de la BD

### Frontend
- `npm run dev`: Servidor de desarrollo
- `npm run build`: Build de producción
- `npm run preview`: Vista previa del build

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autor

Desarrollado para la gestión de productos financieros YPG.
