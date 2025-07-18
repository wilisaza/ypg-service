/**
 * Utilidades para cálculos financieros
 */

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
 * Calcula la proyección total de un préstamo (monto + intereses)
 * @param amount - Monto base a prestar
 * @param interestRate - Tasa de interés anual (ejemplo: 15 para 15%)
 * @param termMonths - Plazo en meses
 * @returns Proyección total del préstamo
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
 * Calcula la cuota mensual de un préstamo
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
