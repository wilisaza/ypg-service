import { PrismaClient, TransactionType, TransactionStatus, LoanType } from '@prisma/client';
import { BusinessDaysUtil } from '../utils/businessDays.js';

const prisma = new PrismaClient();

export class VariableCapitalLoanService {
  
  /**
   * Crea un nuevo préstamo de capital variable
   * @param userId ID del usuario
   * @param productId ID del producto de crédito
   * @param principalAmount Monto del préstamo
   * @param termMonths Plazo en meses (máximo hasta nov del año actual)
   */
  async createVariableCapitalLoan(
    userId: string, 
    productId: number, 
    principalAmount: number, 
    termMonths: number
  ) {
    console.log(`💰 Creando préstamo capital variable: $${principalAmount.toLocaleString('es-CO')} por ${termMonths} meses`);
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Validar que no exceda noviembre del año actual
    const maxMaturityDate = new Date(currentYear, 10, 30); // 30 de noviembre
    const proposedMaturityDate = new Date(currentDate);
    proposedMaturityDate.setMonth(proposedMaturityDate.getMonth() + termMonths);
    
    if (proposedMaturityDate > maxMaturityDate) {
      throw new Error(`El préstamo no puede exceder el 30 de noviembre de ${currentYear}`);
    }
    
    try {
      // Obtener información del producto
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });
      
      if (!product || product.type !== 'LOAN' || product.loanType !== 'VARIABLE_CAPITAL') {
        throw new Error('Producto no válido para crédito de capital variable');
      }
      
      const monthlyInterestAmount = product.monthlyFee || 0; // Interés mensual fijo
      
      // Crear cuenta del préstamo
      const loanAccount = await prisma.account.create({
        data: {
          userId,
          productId,
          balance: principalAmount, // Balance representa deuda pendiente
          status: 'ACTIVE'
        }
      });
      
      // Crear detalles del préstamo
      const loanDetails = await prisma.loanDetails.create({
        data: {
          accountId: loanAccount.id,
          principalAmount,
          currentBalance: principalAmount,
          termMonths,
          interestRate: product.interestRate || 0,
          monthlyInterestAmount,
          disbursementDate: currentDate,
          maturityDate: proposedMaturityDate,
          loanType: LoanType.VARIABLE_CAPITAL
        }
      });
      
      // Registrar desembolso
      await prisma.transaction.create({
        data: {
          accountId: loanAccount.id,
          amount: principalAmount,
          type: TransactionType.LOAN_DISBURSEMENT,
          status: TransactionStatus.COMPLETED,
          description: `Desembolso préstamo capital variable ${termMonths} meses`
        }
      });
      
      console.log(`✅ Préstamo creado exitosamente. ID: ${loanAccount.id}`);
      
      return {
        accountId: loanAccount.id,
        loanDetailsId: loanDetails.id,
        principalAmount,
        monthlyInterestAmount,
        maturityDate: proposedMaturityDate
      };
      
    } catch (error) {
      console.error('❌ Error creando préstamo:', error);
      throw error;
    }
  }
  
  /**
   * Genera intereses diarios para todos los préstamos de capital variable activos
   * Se ejecuta diariamente via cron job
   */
  async generateDailyInterest() {
    console.log('📊 Generando intereses diarios para préstamos capital variable...');
    
    const currentDate = new Date();
    const todayString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    try {
      // Obtener préstamos activos de capital variable
      const activeLoans = await prisma.account.findMany({
        where: {
          status: 'ACTIVE',
          product: { 
            type: 'LOAN',
            loanType: 'VARIABLE_CAPITAL'
          },
          loanDetails: {
            currentBalance: { gt: 0 } // Solo préstamos con saldo pendiente
          }
        },
        include: {
          loanDetails: true,
          product: true,
          user: true
        }
      });
      
      console.log(`💼 Encontrados ${activeLoans.length} préstamos activos`);
      
      let interestsGenerated = 0;
      
      for (const loan of activeLoans) {
        const { loanDetails, product, user } = loan;
        
        if (!loanDetails) continue;
        
        // Verificar si ya se generó interés para hoy
        const existingInterest = await prisma.transaction.findFirst({
          where: {
            accountId: loan.id,
            type: TransactionType.INTEREST_ACCRUED,
            date: {
              gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
              lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
            }
          }
        });
        
        if (existingInterest) {
          console.log(`ℹ️  Interés ya generado hoy para ${user.fullName}`);
          continue;
        }
        
        // Calcular interés diario
        const monthlyInterest = loanDetails.monthlyInterestAmount || 0;
        const dailyInterest = monthlyInterest / 30; // Simplificado: 30 días por mes
        
        if (dailyInterest > 0) {
          await prisma.transaction.create({
            data: {
              accountId: loan.id,
              amount: dailyInterest,
              type: TransactionType.INTEREST_ACCRUED,
              status: TransactionStatus.PENDING,
              description: `Interés diario ${todayString}`,
              date: currentDate
            }
          });
          
          interestsGenerated++;
          console.log(`💸 Interés generado para ${user.fullName}: $${dailyInterest.toFixed(2)}`);
        }
      }
      
      console.log(`📊 Procesamiento completado: ${interestsGenerated} intereses generados`);
      
      return { interestsGenerated };
      
    } catch (error) {
      console.error('❌ Error generando intereses diarios:', error);
      throw error;
    }
  }
  
  /**
   * Procesa un pago al préstamo de capital variable
   * Prioridad: 1) Intereses atrasados, 2) Capital
   * @param accountId ID de la cuenta del préstamo
   * @param paymentAmount Monto del pago
   */
  async processLoanPayment(accountId: string, paymentAmount: number) {
    console.log(`💳 Procesando pago préstamo capital variable: $${paymentAmount.toLocaleString('es-CO')}`);
    
    try {
      const loan = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
          loanDetails: true,
          product: true,
          user: true
        }
      });
      
      if (!loan || !loan.loanDetails) {
        throw new Error('Préstamo no encontrado');
      }
      
      const { loanDetails, user } = loan;
      let remainingPayment = paymentAmount;
      const processedPayments = [];
      
      // PASO 1: Pagar intereses pendientes (prioridad)
      const pendingInterests = await prisma.transaction.findMany({
        where: {
          accountId,
          type: TransactionType.INTEREST_ACCRUED,
          status: TransactionStatus.PENDING
        },
        orderBy: { date: 'asc' } // Más antiguos primero
      });
      
      const totalPendingInterest = pendingInterests.reduce((sum, interest) => sum + interest.amount, 0);
      console.log(`📊 Intereses pendientes: $${totalPendingInterest.toLocaleString('es-CO')}`);
      
      if (totalPendingInterest > 0 && remainingPayment > 0) {
        const interestPayment = Math.min(remainingPayment, totalPendingInterest);
        
        // Marcar intereses como pagados proporcionalmente
        let remainingInterestPayment = interestPayment;
        for (const interest of pendingInterests) {
          if (remainingInterestPayment <= 0) break;
          
          const paymentForThisInterest = Math.min(remainingInterestPayment, interest.amount);
          
          await prisma.transaction.update({
            where: { id: interest.id },
            data: { status: TransactionStatus.COMPLETED }
          });
          
          remainingInterestPayment -= paymentForThisInterest;
        }
        
        // Registrar pago de intereses
        await prisma.transaction.create({
          data: {
            accountId,
            amount: interestPayment,
            type: TransactionType.INTEREST_PAYMENT,
            status: TransactionStatus.COMPLETED,
            description: 'Pago de intereses'
          }
        });
        
        remainingPayment -= interestPayment;
        processedPayments.push({ type: 'INTEREST', amount: interestPayment });
        
        console.log(`✅ Intereses pagados: $${interestPayment.toLocaleString('es-CO')}`);
      }
      
      // PASO 2: Abonar a capital si sobra dinero
      if (remainingPayment > 0 && loanDetails.currentBalance > 0) {
        const capitalPayment = Math.min(remainingPayment, loanDetails.currentBalance);
        
        // Actualizar saldo de capital
        const newBalance = loanDetails.currentBalance - capitalPayment;
        await prisma.loanDetails.update({
          where: { id: loanDetails.id },
          data: { currentBalance: newBalance }
        });
        
        // Actualizar balance de la cuenta
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: newBalance }
        });
        
        // Registrar pago a capital
        await prisma.transaction.create({
          data: {
            accountId,
            amount: capitalPayment,
            type: TransactionType.LOAN_PAYMENT,
            status: TransactionStatus.COMPLETED,
            description: 'Abono a capital'
          }
        });
        
        remainingPayment -= capitalPayment;
        processedPayments.push({ type: 'CAPITAL', amount: capitalPayment });
        
        console.log(`✅ Capital pagado: $${capitalPayment.toLocaleString('es-CO')}`);
        console.log(`📊 Nuevo saldo: $${newBalance.toLocaleString('es-CO')}`);
        
        // Si se canceló totalmente, cerrar el préstamo
        if (newBalance === 0) {
          await prisma.account.update({
            where: { id: accountId },
            data: { status: 'CLOSED', closedAt: new Date() }
          });
          console.log(`🎉 Préstamo cancelado totalmente para ${user.fullName}`);
        }
      }
      
      const result = {
        totalPaid: paymentAmount - remainingPayment,
        remainingAmount: remainingPayment,
        processedPayments,
        currentBalance: loanDetails.currentBalance - (processedPayments.find(p => p.type === 'CAPITAL')?.amount || 0)
      };
      
      console.log('📊 Resumen del pago:');
      console.log(`   - Total aplicado: $${result.totalPaid.toLocaleString('es-CO')}`);
      console.log(`   - Sobrante: $${result.remainingAmount.toLocaleString('es-CO')}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene el estado consolidado del préstamo
   * @param accountId ID de la cuenta del préstamo
   */
  async getLoanStatus(accountId: string) {
    try {
      const loan = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
          loanDetails: true,
          product: true,
          user: true
        }
      });
      
      if (!loan || !loan.loanDetails) {
        throw new Error('Préstamo no encontrado');
      }
      
      // Calcular intereses pendientes consolidados
      const pendingInterests = await prisma.transaction.findMany({
        where: {
          accountId,
          type: TransactionType.INTEREST_ACCRUED,
          status: TransactionStatus.PENDING
        }
      });
      
      const totalPendingInterest = pendingInterests.reduce((sum, interest) => sum + interest.amount, 0);
      
      return {
        accountId,
        principalAmount: loan.loanDetails.principalAmount,
        currentBalance: loan.loanDetails.currentBalance,
        pendingInterest: totalPendingInterest,
        totalDebt: loan.loanDetails.currentBalance + totalPendingInterest,
        monthlyInterestAmount: loan.loanDetails.monthlyInterestAmount,
        maturityDate: loan.loanDetails.maturityDate,
        status: loan.status,
        daysSinceLastPayment: this.calculateDaysSinceLastPayment(accountId)
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo estado del préstamo:', error);
      throw error;
    }
  }
  
  private async calculateDaysSinceLastPayment(accountId: string): Promise<number> {
    const lastPayment = await prisma.transaction.findFirst({
      where: {
        accountId,
        type: {
          in: [TransactionType.LOAN_PAYMENT, TransactionType.INTEREST_PAYMENT]
        },
        status: TransactionStatus.COMPLETED
      },
      orderBy: { date: 'desc' }
    });
    
    if (!lastPayment) return 0;
    
    const today = new Date();
    const lastPaymentDate = new Date(lastPayment.date);
    const diffTime = Math.abs(today.getTime() - lastPaymentDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
