# Backend - Gestión de Productos Financieros

Este proyecto utiliza Node.js, Express, TypeScript, ES Modules, Prisma y PostgreSQL.

## Estructura sugerida
- src/
  - controllers/
  - middlewares/
  - models/
  - routes/
  - utils/
  - app.ts
  - server.ts
- prisma/
  - schema.prisma
- .env

## Scripts útiles
- Instalación: `npm install`
- Desarrollo: `npm run dev`
- Compilación: `npm run build`

## Requisitos
- Node.js >= 18
- PostgreSQL

## Funcionalidades
- Gestión de usuarios, productos financieros, ahorros, préstamos, transacciones y multas.
- Autenticación JWT.
- Validaciones y manejo de errores.

## Correr seed
- `npx tsc --project tsconfig.json && node --experimental-specifier-resolution=node dist/prisma/seed.js`