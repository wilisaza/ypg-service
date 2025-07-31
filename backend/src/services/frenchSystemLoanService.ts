import prisma from '../models/prismaClient.js';

export class FrenchSystemLoanService {
  
  /**
   * Calcula la cuota fija mensual usando la fórmula del sistema francés
   * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
   * Donde:
   * P = Principal (monto del préstamo)
   * r = Tasa de interés mensual (tasa anual / 12)
   * n = Número de pagos (meses)
   */
  private calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
    const monthlyRate = annualRate / 12;
    
    if (monthlyRate === 0) {
      return principal / termMonths; // Sin interés
    }
    
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, termMonths);
    const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;
    
    return principal * (numerator / denominator);
  }

  /**
   * Calcula el cronograma de pagos para un préstamo de sistema francés
   */
  private calculatePaymentSchedule(principal: number, annualRate: number, termMonths: number) {
    const monthlyPayment = this.calculateMonthlyPayment(principal, annualRate, termMonths);
    const monthlyRate = annualRate / 12;
    
    let remainingBalance = principal;
    const schedule = [];
    
    for (let month = 1; month <= termMonths; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;
      
      schedule.push({
        month,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        principalPayment: Math.round(principalPayment * 100) / 100,
        interestPayment: Math.round(interestPayment * 100) / 100,
        remainingBalance: Math.round(Math.max(0, remainingBalance) * 100) / 100
      });
    }
    
    return schedule;
  }

  /**
   * Crea un nuevo préstamo de sistema francés
   */
  async createFrenchSystemLoan(data: {
    userId: string;
    productId: number;
    principalAmount: number;
    termMonths: number;
  }) {
    const { userId, productId, principalAmount, termMonths } = data;

    // Validaciones básicas
    if (principalAmount <= 0) {
      throw new Error('El monto principal debe ser mayor a 0');
    }

    if (termMonths < 1 || termMonths > 60) {
      throw new Error('El plazo debe estar entre 1 y 60 meses');
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el producto existe y es un préstamo de sistema francés
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product || product.type !== 'LOAN' || product.loanType !== 'FRENCH_SYSTEM') {
      throw new Error('Producto no válido para préstamo de sistema francés');
    }

    if (!product.interestRate) {
      throw new Error('El producto debe tener una tasa de interés configurada');
    }

    const interestRate = product.interestRate;

    // Calcular fechas importantes
    const today = new Date();
    const maturityDate = new Date(today);
    maturityDate.setMonth(maturityDate.getMonth() + termMonths);

    // Calcular cuota mensual fija
    const monthlyPayment = this.calculateMonthlyPayment(
      principalAmount, 
      interestRate, 
      termMonths
    );

    // Crear la cuenta y detalles del préstamo en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear la cuenta
      const account = await tx.account.create({
        data: {
          userId,
          productId,
          balance: -principalAmount, // Negativo porque es una deuda
          status: 'ACTIVE'
        }
      });

      // Crear los detalles del préstamo
      const loanDetails = await tx.loanDetails.create({
        data: {
          accountId: account.id,
          principalAmount,
          currentBalance: principalAmount, // Saldo pendiente por pagar
          termMonths,
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          interestRate,
          maturityDate,
          loanType: 'FRENCH_SYSTEM'
        }
      });

      // Registrar el desembolso
      await tx.transaction.create({
        data: {
          accountId: account.id,
          amount: principalAmount,
          type: 'LOAN_DISBURSEMENT',
          status: 'COMPLETED',
          description: `Desembolso préstamo sistema francés`,
          date: today
        }
      });

      return { account, loanDetails };
    });

    return {
      accountId: result.account.id,
      loanDetailsId: result.loanDetails.id,
      principalAmount,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      termMonths,
      interestRate,
      maturityDate,
      paymentSchedule: this.calculatePaymentSchedule(principalAmount, interestRate, termMonths)
    };
  }

  /**
   * Obtiene el estado actual de un préstamo de sistema francés
   */
  async getLoanStatus(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        loanDetails: true,
        product: true,
        user: {
          select: { id: true, fullName: true, username: true }
        }
      }
    });

    if (!account || !account.loanDetails) {
      throw new Error('Préstamo no encontrado');
    }

    if (account.product.loanType !== 'FRENCH_SYSTEM') {
      throw new Error('Este préstamo no es de sistema francés');
    }

    if (!account.loanDetails.monthlyPayment) {
      throw new Error('El préstamo no tiene cuota mensual configurada');
    }

    // Calcular pagos realizados
    const payments = await prisma.transaction.findMany({
      where: {
        accountId,
        type: { in: ['LOAN_PAYMENT', 'INTEREST_PAYMENT'] },
        status: 'COMPLETED'
      },
      orderBy: { date: 'desc' }
    });

    const totalPaid = payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const lastPaymentDate = payments.length > 0 ? payments[0].date : null;

    // Calcular cuántos pagos se han realizado (aproximado)
    const paymentsMade = Math.floor(totalPaid / account.loanDetails.monthlyPayment);
    const remainingPayments = account.loanDetails.termMonths - paymentsMade;

    return {
      accountId: account.id,
      user: account.user,
      principalAmount: account.loanDetails.principalAmount,
      currentBalance: account.loanDetails.currentBalance,
      monthlyPayment: account.loanDetails.monthlyPayment,
      termMonths: account.loanDetails.termMonths,
      remainingPayments,
      totalPaid,
      interestRate: account.loanDetails.interestRate,
      maturityDate: account.loanDetails.maturityDate,
      lastPaymentDate,
      status: account.status,
      loanType: 'FRENCH_SYSTEM'
    };
  }

  /**
   * Procesa un pago al préstamo de sistema francés
   */
  async processLoanPayment(accountId: string, paymentAmount: number) {
    if (paymentAmount <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { loanDetails: true, product: true }
    });

    if (!account || !account.loanDetails) {
      throw new Error('Préstamo no encontrado');
    }

    if (account.product.loanType !== 'FRENCH_SYSTEM') {
      throw new Error('Este préstamo no es de sistema francés');
    }

    if (account.loanDetails.currentBalance <= 0) {
      throw new Error('Este préstamo ya está completamente pagado');
    }

    if (!account.loanDetails.monthlyPayment || !account.loanDetails.interestRate) {
      throw new Error('El préstamo no tiene configuración completa');
    }

    const currentBalance = account.loanDetails.currentBalance;
    const monthlyRate = account.loanDetails.interestRate / 12;
    
    // Calcular interés sobre el saldo actual
    const interestDue = currentBalance * monthlyRate;
    const principalDue = account.loanDetails.monthlyPayment - interestDue;
    
    let interestPayment = Math.min(paymentAmount, interestDue);
    let principalPayment = Math.min(paymentAmount - interestPayment, principalDue);
    let remainingAmount = paymentAmount - interestPayment - principalPayment;

    // Si sobra dinero después de cubrir la cuota, se abona a capital
    if (remainingAmount > 0) {
      const extraPrincipal = Math.min(remainingAmount, currentBalance - principalPayment);
      principalPayment += extraPrincipal;
      remainingAmount -= extraPrincipal;
    }

    const newBalance = currentBalance - principalPayment;

    // Procesar el pago en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar el saldo del préstamo
      await tx.loanDetails.update({
        where: { accountId },
        data: {
          currentBalance: Math.max(0, newBalance)
        }
      });

      // Actualizar el balance de la cuenta
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: -Math.max(0, newBalance), // Negativo porque es deuda
          status: newBalance <= 0 ? 'CLOSED' : 'ACTIVE'
        }
      });

      const processedPayments = [];

      // Registrar pago de intereses
      if (interestPayment > 0) {
        await tx.transaction.create({
          data: {
            accountId,
            amount: interestPayment,
            type: 'INTEREST_PAYMENT',
            status: 'COMPLETED',
            description: `Pago de intereses`,
            date: new Date()
          }
        });
        processedPayments.push({ type: 'INTEREST', amount: interestPayment });
      }

      // Registrar pago de capital
      if (principalPayment > 0) {
        await tx.transaction.create({
          data: {
            accountId,
            amount: principalPayment,
            type: 'LOAN_PAYMENT',
            status: 'COMPLETED',
            description: `Abono a capital`,
            date: new Date()
          }
        });
        processedPayments.push({ type: 'CAPITAL', amount: principalPayment });
      }

      return { processedPayments, newBalance };
    });

    return {
      totalPaid: paymentAmount - remainingAmount,
      remainingAmount,
      processedPayments: result.processedPayments,
      currentBalance: Math.max(0, result.newBalance),
      loanPaidOff: result.newBalance <= 0
    };
  }

  /**
   * Obtiene todos los préstamos de sistema francés activos
   */
  async getActiveFrenchSystemLoans() {
    const loans = await prisma.account.findMany({
      where: {
        product: {
          type: 'LOAN',
          loanType: 'FRENCH_SYSTEM'
        },
        status: 'ACTIVE',
        loanDetails: {
          currentBalance: { gt: 0 }
        }
      },
      include: {
        loanDetails: true,
        user: {
          select: { id: true, fullName: true, username: true }
        },
        product: true
      }
    });

    return loans.map(loan => ({
      accountId: loan.id,
      user: loan.user,
      principalAmount: loan.loanDetails!.principalAmount,
      currentBalance: loan.loanDetails!.currentBalance,
      monthlyPayment: loan.loanDetails!.monthlyPayment,
      maturityDate: loan.loanDetails!.maturityDate,
      productName: loan.product.name
    }));
  }
}

export const frenchSystemLoanService = new FrenchSystemLoanService();
