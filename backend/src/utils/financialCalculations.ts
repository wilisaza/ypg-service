/**
 * Utilidades para cálculos financieros
 */

export enum PaymentMode {
  CUOTAS_FIJAS = 'CUOTAS_FIJAS',
  ABONOS_LIBRES = 'ABONOS_LIBRES'
}

/**
 * Formatea un valor monetario con separadores de miles y decimales
 * @param amount - Valor a formatear
 * @param decimals - Número de decimales (por defecto 2)
 * @returns Valor formateado
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}

/**
 * Formatea un número con separadores de miles
 * @param amount - Valor a formatear
 * @param decimals - Número de decimales (por defecto 2)
 * @returns Valor formateado sin símbolo de moneda
 */
export function formatNumber(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}

/**
 * Calcula la proyección total de un préstamo (interés MENSUAL)
 * @param amount - Monto base a prestar
 * @param monthlyInterestRate - Tasa de interés mensual
 * @param termMonths - Plazo en meses
 * @returns Proyección total a pagar
 */
export function calculateLoanProjectionMonthly(
  amount: number, 
  monthlyInterestRate: number, 
  termMonths: number
): number {
  // Usar tasa mensual directamente
  const monthlyRate = monthlyInterestRate / 100;
  
  // Calcular cuota mensual usando fórmula de amortización francesa
  const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                        (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  // Proyección total = cuota mensual * número de meses (redondeado a 2 decimales)
  return Math.round((monthlyPayment * termMonths) * 100) / 100;
}

/**
 * Calcula la proyección total de un préstamo (interés ANUAL - función legacy)
 * @param amount - Monto base a prestar
 * @param interestRate - Tasa de interés anual
 * @param termMonths - Plazo en meses
 * @returns Proyección total a pagar
 */
export function calculateLoanProjection(
  amount: number, 
  interestRate: number, 
  termMonths: number
): number {
  // Convertir tasa anual a mensual
  const monthlyRate = interestRate / 100 / 12;
  
  // Calcular cuota mensual usando fórmula de amortización francesa
  const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                        (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  // Proyección total = cuota mensual * número de meses (redondeado a 2 decimales)
  return Math.round((monthlyPayment * termMonths) * 100) / 100;
}

/**
 * Calcula la cuota mensual de un préstamo (interés MENSUAL)
 * @param amount - Monto base a prestar
 * @param monthlyInterestRate - Tasa de interés mensual
 * @param termMonths - Plazo en meses
 * @returns Cuota mensual
 */
export function calculateMonthlyPaymentFromMonthly(
  amount: number, 
  monthlyInterestRate: number, 
  termMonths: number
): number {
  const monthlyRate = monthlyInterestRate / 100;
  
  const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
         (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  // Redondear a 2 decimales
  return Math.round(payment * 100) / 100;
}

/**
 * Calcula la cuota mensual de un préstamo (interés ANUAL - función legacy)
 * @param amount - Monto base a prestar
 * @param interestRate - Tasa de interés anual
 * @param termMonths - Plazo en meses
 * @returns Cuota mensual
 */
export function calculateMonthlyPayment(
  amount: number, 
  interestRate: number, 
  termMonths: number
): number {
  const monthlyRate = interestRate / 100 / 12;
  
  const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
         (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  // Redondear a 2 decimales
  return Math.round(payment * 100) / 100;
}

/**
 * Calcula los intereses totales de un préstamo
 * @param amount - Monto base a prestar
 * @param interestRate - Tasa de interés anual
 * @param termMonths - Plazo en meses
 * @returns Total de intereses
 */
export function calculateTotalInterest(
  amount: number, 
  interestRate: number, 
  termMonths: number
): number {
  const projection = calculateLoanProjection(amount, interestRate, termMonths);
  return projection - amount;
}

/**
 * Genera tabla de amortización
 * @param amount - Monto base a prestar
 * @param interestRate - Tasa de interés anual
 * @param termMonths - Plazo en meses
 * @returns Array con el detalle de cada cuota
 */
export function generateAmortizationTable(
  amount: number, 
  interestRate: number, 
  termMonths: number
): Array<{
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}> {
  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(amount, interestRate, termMonths);
  
  let balance = amount;
  const table = [];
  
  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance = balance - principalPayment;
    
    table.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance) // Evitar negativos por redondeo
    });
  }
  
  return table;
}

/**
 * Calcula el interés mensual sobre saldo adeudado (modalidad ABONOS_LIBRES) - Interés MENSUAL
 * @param outstandingBalance - Saldo pendiente actual
 * @param monthlyInterestRate - Tasa de interés mensual (por ejemplo, 1.0 para 1% mensual)
 * @returns Interés mensual a liquidar
 */
export function calculateMonthlyInterestOnBalanceFromMonthly(
  outstandingBalance: number,
  monthlyInterestRate: number
): number {
  const monthlyRate = monthlyInterestRate / 100;
  const monthlyInterest = outstandingBalance * monthlyRate;
  return Math.round(monthlyInterest * 100) / 100; // Redondear a 2 decimales
}

/**
 * Calcula el interés mensual sobre saldo adeudado (modalidad ABONOS_LIBRES) - Interés ANUAL (legacy)
 * @param outstandingBalance - Saldo pendiente actual
 * @param annualInterestRate - Tasa de interés anual (por ejemplo, 0.12 para 12%)
 * @returns Interés mensual a liquidar
 */
export function calculateMonthlyInterestOnBalance(
  outstandingBalance: number,
  annualInterestRate: number
): number {
  const monthlyRate = annualInterestRate / 12;
  const monthlyInterest = outstandingBalance * monthlyRate;
  return Math.round(monthlyInterest * 100) / 100; // Redondear a 2 decimales
}

/**
 * Aplica un abono al saldo pendiente
 * @param currentBalance - Saldo actual
 * @param paymentAmount - Monto del abono
 * @returns Nuevo saldo después del abono
 */
export function applyPaymentToBalance(
  currentBalance: number,
  paymentAmount: number
): number {
  const newBalance = currentBalance - paymentAmount;
  return Math.max(0, newBalance); // No permitir saldo negativo
}

/**
 * Calcula los días transcurridos entre dos fechas
 * @param fromDate - Fecha inicial
 * @param toDate - Fecha final
 * @returns Número de días
 */
export function calculateDaysBetween(fromDate: Date, toDate: Date): number {
  const timeDiff = toDate.getTime() - fromDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Calcula interés proporcional por días
 * @param balance - Saldo sobre el cual calcular interés
 * @param annualRate - Tasa anual (decimal)
 * @param days - Número de días
 * @returns Interés proporcional
 */
export function calculateProportionalInterest(
  balance: number,
  annualRate: number,
  days: number
): number {
  const dailyRate = annualRate / 365;
  const interest = balance * dailyRate * days;
  return Math.round(interest * 100) / 100;
}
