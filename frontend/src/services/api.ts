// Configuración base de la API
const API_BASE_URL = 'http://localhost:4000/api';

// Token de autenticación global
let authToken: string | null = localStorage.getItem('authToken');

// Configuración base para fetch
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('authToken');
        authToken = null;
        window.location.href = '/login';
        throw new Error('Sesión expirada');
      }
      
      const errorData = await response.json().catch(() => ({ message: 'Error del servidor' }));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Servicios de autenticación
export const authService = {
  async login(username: string, password: string) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.success && response.token) {
      authToken = response.token;
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  logout() {
    authToken = null;
    localStorage.removeItem('authToken');
  },

  isAuthenticated() {
    return !!authToken;
  },

  getToken() {
    return authToken;
  }
};

// Servicios de usuarios
export const userService = {
  async getUsers() {
    return await apiRequest('/users');
  },

  async createUser(userData: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    role?: 'USER' | 'ADMIN';
  }) {
    return await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
};

// Servicios de productos
export const productService = {
  async getProducts() {
    return await apiRequest('/products');
  },

  async createProduct(productData: {
    name: string;
    type: 'SAVINGS' | 'LOAN';
    loanType?: 'FRENCH_SYSTEM' | 'VARIABLE_CAPITAL';
    description?: string;
    interestRate?: number;
    monthlyFee?: number;
    penaltyRate?: number;
    graceDays?: number;
  }) {
    return await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }
};

// Servicios de préstamos de capital variable
export const loanService = {
  async createVariableCapitalLoan(loanData: {
    userId: string;
    productId: number;
    principalAmount: number;
    termMonths: number;
  }) {
    return await apiRequest('/loans/variable-capital', {
      method: 'POST',
      body: JSON.stringify(loanData),
    });
  },

  async getLoanStatus(accountId: string) {
    return await apiRequest(`/loans/${accountId}/status`);
  },

  async processPayment(accountId: string, paymentAmount: number) {
    return await apiRequest(`/loans/${accountId}/payment`, {
      method: 'POST',
      body: JSON.stringify({ paymentAmount }),
    });
  },

  async generateDailyInterest() {
    return await apiRequest('/loans/generate-daily-interest', {
      method: 'POST',
    });
  }
};

// Servicios de cuentas
export const accountService = {
  async getUserAccounts(userId: string) {
    return await apiRequest(`/accounts/user/${userId}`);
  }
};

// Servicios de transacciones
export const transactionService = {
  async getAccountTransactions(accountId: string, limit = 20, offset = 0) {
    return await apiRequest(`/transactions/account/${accountId}?limit=${limit}&offset=${offset}`);
  }
};

// Servicios de administración (cron jobs)
export const adminService = {
  async getCronStatus() {
    return await apiRequest('/loans/cron/status');
  },

  async runInterestJobNow() {
    return await apiRequest('/loans/cron/run-interest-now', {
      method: 'POST',
    });
  }
};

// Tipos TypeScript para mayor seguridad
export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  type: 'SAVINGS' | 'LOAN';
  loanType?: 'FRENCH_SYSTEM' | 'VARIABLE_CAPITAL';
  description?: string;
  interestRate?: number;
  monthlyFee?: number;
  penaltyRate?: number;
  graceDays?: number;
  isActive: boolean;
}

export interface LoanStatus {
  accountId: string;
  principalAmount: number;
  currentBalance: number;
  pendingInterest: number;
  totalDebt: number;
  monthlyInterestAmount?: number;
  maturityDate?: string;
  status: string;
  daysSinceLastPayment?: number;
}

export interface Account {
  id: string;
  productId: number;
  balance: number;
  status: 'ACTIVE' | 'DORMANT' | 'CLOSED' | 'BLOCKED';
  openedAt: string;
  product: Product;
  loanDetails?: any;
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  date: string;
  description?: string;
}
