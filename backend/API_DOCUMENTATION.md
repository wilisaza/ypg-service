# 📖 API Documentation - YPG Service Backend

## 🏦 Sistema de Gestión Financiera YPG
**Versión:** 1.0  
**Base URL:** `http://localhost:4000/api`  
**Autenticación:** Bearer Token (JWT)

---

## 🔐 Autenticación

### 1. Login de Usuario
**Endpoint:** `POST /auth/login`  
**Descripción:** Autenticar usuario y obtener token JWT

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "usuario_test", "password": "password123"}'
```

---

## 🏭 Gestión Unificada de Productos

### 2. Crear Producto
**Endpoint:** `POST /products`  
**Descripción:** Crear un nuevo producto financiero (préstamo o ahorro)  
**Autenticación:** Requerida

**Request Body - Préstamo Sistema Francés:**
```json
{
  "name": "Préstamo Sistema Francés",
  "type": "LOAN",
  "loanType": "FRENCH_SYSTEM",
  "description": "Préstamo con cuota fija mensual",
  "interestRate": 0.18,
  "penaltyRate": 0.02,
  "graceDays": 5
}
```

**Request Body - Préstamo Capital Variable:**
```json
{
  "name": "Préstamo Capital Variable",
  "type": "LOAN",
  "loanType": "VARIABLE_CAPITAL",
  "description": "Préstamo con interés mensual fijo",
  "interestRate": 0.24,
  "monthlyFee": 50000,
  "penaltyRate": 0.02,
  "graceDays": 5
}
```

**Nota Importante:** Para préstamos de Capital Variable:
- `monthlyFee`: Es un valor fijo en pesos (no porcentaje) que se cobra mensualmente como multa
- `interestRate`: Es el porcentaje de interés anual
- `penaltyRate`: Es el porcentaje de multa por atraso

**Request Body - Plan de Ahorro:**
```json
{
  "name": "Plan de Ahorro Básico",
  "type": "SAVINGS",
  "description": "Plan de ahorro con rendimientos competitivos",
  "interestRate": 0.06,
  "minBalance": 100000,
  "maxBalance": 50000000,
  "monthlyFee": 5000
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Producto creado exitosamente",
  "data": {
    "id": 2,
    "name": "Préstamo Sistema Francés",
    "type": "LOAN",
    "loanType": "FRENCH_SYSTEM",
    "description": "Préstamo con cuota fija mensual",
    "interestRate": 0.18,
    "penaltyRate": 0.02,
    "graceDays": 5,
    "isActive": true
  }
}
```

### 3. Listar Productos
**Endpoint:** `GET /products`  
**Descripción:** Obtener todos los productos financieros  
**Autenticación:** Requerida

**Query Parameters:**
- `type`: Filtrar por tipo (`SAVINGS` | `LOAN`)
- `loanType`: Filtrar por tipo de préstamo (`FRENCH_SYSTEM` | `VARIABLE_CAPITAL`)
- `isActive`: Filtrar por estado (`true` | `false`)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Préstamo Capital Variable",
      "type": "LOAN",
      "loanType": "VARIABLE_CAPITAL",
      "description": "Préstamo con interés mensual fijo",
      "interestRate": 0.24,
      "monthlyFee": 50000,
      "penaltyRate": 0.02,
      "graceDays": 5,
      "isActive": true,
      "activeAccounts": 2
    },
    {
      "id": 2,
      "name": "Préstamo Sistema Francés",
      "type": "LOAN",
      "loanType": "FRENCH_SYSTEM",
      "description": "Préstamo con cuota fija mensual",
      "interestRate": 0.18,
      "penaltyRate": 0.02,
      "graceDays": 5,
      "isActive": true,
      "activeAccounts": 1
    },
    {
      "id": 3,
      "name": "Plan de Ahorro Básico",
      "type": "SAVINGS",
      "description": "Plan de ahorro con rendimientos competitivos",
      "interestRate": 0.06,
      "minBalance": 100000,
      "maxBalance": 50000000,
      "monthlyFee": 5000,
      "isActive": true,
      "activeAccounts": 0
    }
  ]
}
```

### 4. Obtener Productos por Tipo
**Endpoint:** `GET /products/type/{type}`  
**Descripción:** Obtener productos de un tipo específico  
**Autenticación:** Requerida

**Path Parameters:**
- `type`: Tipo de producto (`SAVINGS` | `LOAN`)

**Query Parameters:**
- `loanType`: Para productos LOAN, filtrar por tipo (`FRENCH_SYSTEM` | `VARIABLE_CAPITAL`)

**Ejemplos:**
```bash
# Obtener todos los productos de ahorro
GET /products/type/SAVINGS

# Obtener solo préstamos de sistema francés
GET /products/type/LOAN?loanType=FRENCH_SYSTEM

# Obtener solo préstamos de capital variable
GET /products/type/LOAN?loanType=VARIABLE_CAPITAL
```

---

## 👥 Gestión de Usuarios

### 5. Crear Usuario
**Endpoint:** `POST /users`  
**Descripción:** Registrar nuevo usuario en el sistema  
**Autenticación:** Requerida

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "fullName": "string",
  "email": "string",
  "role": "USER | ADMIN"
}
```

### 6. Obtener Usuarios
**Endpoint:** `GET /users`  
**Descripción:** Listar todos los usuarios  
**Autenticación:** Requerida

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "string",
      "fullName": "string",
      "email": "string",
      "role": "USER",
      "isActive": true,
      "createdAt": "2025-07-24T...",
      "updatedAt": "2025-07-24T..."
    }
  ]
}
```

---

## 💰 Sistema Unificado de Préstamos

### 7. Crear Préstamo (Automático)
**Endpoint:** `POST /loans`  
**Descripción:** Crear un nuevo préstamo. El sistema detecta automáticamente el tipo (francés o capital variable) según el producto seleccionado  
**Autenticación:** Requerida

**Request Body:**
```json
{
  "userId": "string (UUID)",
  "productId": 1,
  "principalAmount": 1000000,
  "termMonths": 12
}
```

**Validaciones:**
- `principalAmount` > 0
- `termMonths` entre 1 y 60 meses
- El producto debe ser de tipo `LOAN`

**Response (201) - Sistema Francés:**
```json
{
  "success": true,
  "message": "Préstamo de sistema francés creado exitosamente",
  "data": {
    "accountId": "uuid",
    "loanDetailsId": "uuid",
    "principalAmount": 1000000,
    "monthlyPayment": 91679.99,
    "termMonths": 12,
    "interestRate": 0.18,
    "maturityDate": "2026-07-25T...",
    "loanType": "FRENCH_SYSTEM",
    "productName": "Préstamo Sistema Francés",
    "paymentSchedule": [
      {
        "month": 1,
        "monthlyPayment": 91679.99,
        "principalPayment": 76679.99,
        "interestPayment": 15000,
        "remainingBalance": 923320.01
      }
    ]
  }
}
```

**Response (201) - Capital Variable:**
```json
{
  "success": true,
  "message": "Préstamo de capital variable creado exitosamente",
  "data": {
    "accountId": "uuid",
    "loanDetailsId": "uuid",
    "principalAmount": 1000000,
    "monthlyInterestAmount": 50000,
    "maturityDate": "2025-11-24T...",
    "loanType": "VARIABLE_CAPITAL",
    "productName": "Préstamo Capital Variable"
  }
}
```

**Ejemplo cURL - Sistema Francés:**
```bash
curl -X POST http://localhost:4000/api/loans \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "abb4cc4b-e1fb-4c39-8dc7-fc1ebb264395",
    "productId": 2,
    "principalAmount": 1000000,
    "termMonths": 12
  }'
```

**Ejemplo cURL - Capital Variable:**
```bash
curl -X POST http://localhost:4000/api/loans \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "abb4cc4b-e1fb-4c39-8dc7-fc1ebb264395",
    "productId": 1,
    "principalAmount": 500000,
    "termMonths": 3
  }'
```

### 5. Consultar Estado del Préstamo
**Endpoint:** `GET /loans/{accountId}/status`  
**Descripción:** Obtener información detallada del estado actual del préstamo

**Path Parameters:**
- `accountId`: UUID de la cuenta del préstamo

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accountId": "uuid",
    "principalAmount": 1000000,
    "currentBalance": 750000,
    "pendingInterest": 1666.67,
    "totalDebt": 751666.67,
    "monthlyInterestAmount": 50000,
    "maturityDate": "2025-11-24T...",
    "status": "ACTIVE",
    "daysSinceLastPayment": 5
  }
}
```

**Ejemplo cURL:**
```bash
curl -X GET http://localhost:4000/api/loans/606dcf37-d6e7-4535-81d0-3a5436dd180f/status \
  -H "Authorization: Bearer {token}"
```

### 6. Procesar Pago al Préstamo
**Endpoint:** `POST /loans/{accountId}/payment`  
**Descripción:** Realizar un pago al préstamo con priorización automática (intereses → capital)

**Path Parameters:**
- `accountId`: UUID de la cuenta del préstamo

**Request Body:**
```json
{
  "paymentAmount": 100000
}
```

**Lógica de Priorización:**
1. **Primer prioridad:** Intereses pendientes
2. **Segunda prioridad:** Abono a capital
3. Si sobra dinero, se devuelve como "remainingAmount"

**Response (200):**
```json
{
  "success": true,
  "message": "Pago procesado exitosamente",
  "data": {
    "totalPaid": 100000,
    "remainingAmount": 0,
    "processedPayments": [
      {
        "type": "INTEREST",
        "amount": 1666.67
      },
      {
        "type": "CAPITAL", 
        "amount": 98333.33
      }
    ],
    "currentBalance": 651666.67
  }
}
```

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:4000/api/loans/606dcf37-d6e7-4535-81d0-3a5436dd180f/payment \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"paymentAmount": 100000}'
```

---

## ⚙️ Administración de Cron Jobs

### 7. Generar Intereses Diarios (Manual)
**Endpoint:** `POST /loans/generate-daily-interest`  
**Descripción:** Ejecutar manualmente la generación de intereses diarios para todos los préstamos activos

**Response (200):**
```json
{
  "success": true,
  "message": "Intereses diarios generados exitosamente",
  "data": {
    "interestsGenerated": 3
  }
}
```

### 8. Ejecutar Job de Intereses Ahora
**Endpoint:** `POST /loans/cron/run-interest-now`  
**Descripción:** Forzar ejecución inmediata del job de intereses (útil para testing)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "interestsGenerated": 2
  }
}
```

### 9. Estado de Jobs de Cron
**Endpoint:** `GET /loans/cron/status`  
**Descripción:** Obtener estado de todos los jobs de cron configurados

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "name": "dailyInterest",
      "running": true
    }
  ]
}
```

---

## 📊 Gestión de Cuentas

### 12. Listar Cuentas del Usuario
**Endpoint:** `GET /accounts/user/{userId}`  
**Descripción:** Obtener todas las cuentas de un usuario específico

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "productId": 1,
      "balance": 750000,
      "status": "ACTIVE",
      "openedAt": "2025-07-24T...",
      "product": {
        "name": "Préstamo Capital Variable",
        "type": "LOAN"
      },
      "loanDetails": {
        "principalAmount": 1000000,
        "currentBalance": 750000,
        "termMonths": 4,
        "monthlyInterestAmount": 50000
      }
    }
  ]
}
```

---

## 💳 Gestión de Transacciones

### 13. Historial de Transacciones
**Endpoint:** `GET /transactions/account/{accountId}`  
**Descripción:** Obtener historial completo de transacciones de una cuenta

**Query Parameters:**
- `limit`: Número máximo de transacciones (default: 50)
- `offset`: Número de transacciones a omitir (default: 0)
- `type`: Filtrar por tipo de transacción

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 100000,
      "type": "LOAN_PAYMENT",
      "status": "COMPLETED",
      "date": "2025-07-24T...",
      "description": "Abono a capital"
    },
    {
      "id": "uuid", 
      "amount": 1666.67,
      "type": "INTEREST_ACCRUED",
      "status": "COMPLETED",
      "date": "2025-07-24T...",
      "description": "Interés diario 2025-07-24"
    }
  ]
}
```

---

## 📋 Tipos de Datos

### Enums Importantes

**ProductType:**
- `SAVINGS`: Productos de ahorro
- `LOAN`: Productos de crédito

**LoanType:**
- `FRENCH_SYSTEM`: Sistema francés (cuota fija)
- `VARIABLE_CAPITAL`: Capital variable con interés mensual fijo

**Nota Importante sobre Campos Monetarios:**
- `interestRate` y `penaltyRate`: Siempre se envían como decimales (ej: 0.18 = 18%)
- `monthlyFee` en préstamos `VARIABLE_CAPITAL`: Valor fijo en pesos colombianos
- `minBalance`, `maxBalance`, `monthlyFee` en `SAVINGS`: Valores en pesos colombianos

**TransactionType:**
- `LOAN_DISBURSEMENT`: Desembolso de préstamo
- `LOAN_PAYMENT`: Pago de capital
- `INTEREST_PAYMENT`: Pago de intereses
- `INTEREST_ACCRUED`: Intereses devengados
- `PENALTY_FEE`: Multa por atraso

**AccountStatus:**
- `ACTIVE`: Cuenta activa
- `DORMANT`: Cuenta inactiva
- `CLOSED`: Cuenta cerrada
- `BLOCKED`: Cuenta bloqueada

---

## 🚨 Códigos de Error Comunes

**400 - Bad Request:**
- Datos faltantes o inválidos
- Validaciones de negocio fallidas

**401 - Unauthorized:**
- Token JWT inválido o expirado
- Credenciales incorrectas

**404 - Not Found:**
- Recurso no encontrado (usuario, cuenta, préstamo)

**500 - Internal Server Error:**
- Error interno del servidor
- Error de base de datos

---

## 🔧 Configuración de Entorno

**Variables de Entorno Requeridas:**
```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-secret-key"
PORT=4000
```

**Jobs de Cron Automáticos:**
- **Intereses Diarios:** Se ejecuta todos los días a las 01:00 AM (GMT-5)

---

## 📝 Notas Importantes

1. **Autenticación:** Todas las rutas (excepto login) requieren token JWT en el header Authorization
2. **Fechas:** El sistema usa timezone América/Bogotá
3. **Días Hábiles:** Se integra con feriados colombianos para cálculos precisos
4. **Intereses:** Se calculan diariamente y se acumulan hasta el pago
5. **Pagos:** Siempre priorizan intereses antes que capital
6. **Límite de Fecha:** Los préstamos no pueden exceder el 30 de noviembre del año actual

---

## 🧪 Datos de Prueba

**Usuario de Test:**
```json
{
  "username": "test_user",
  "password": "test123"
}
```

**Producto de Test (ID: 1):**
```json
{
  "name": "Préstamo Capital Variable Test",
  "type": "LOAN", 
  "loanType": "VARIABLE_CAPITAL",
  "monthlyFee": 50000
}
```
