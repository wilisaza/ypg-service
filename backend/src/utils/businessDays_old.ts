import * as colombianHolidaysLib from 'colombian-holidays';

// Extraer las funciones que necesitamos
const { getHolidaysForYear, isHoliday } = colombianHolidaysLib;

/**
 * Utilidad para manejar días hábiles en Colombia
 * Considera fines de semana y feriados colombianos oficiales
 */
export class BusinessDaysUtil {
  /**
   * Verifica si una fecha es día hábil (no es fin de semana ni feriado)
   * @param date Fecha a verificar
   * @returns true si es día hábil, false si es fin de semana o feriado
   */
  static isBusinessDay(date: Date): boolean {
    // Verificar si es fin de semana (sábado = 6, domingo = 0)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // Verificar si es feriado colombiano
    const isColombianHoliday = isHoliday(date);
    return !isColombianHoliday;
  }

  /**
   * Calcula la fecha límite agregando días hábiles a partir de una fecha base
   * @param startDate Fecha de inicio
   * @param businessDaysToAdd Número de días hábiles a agregar
   * @returns Fecha límite calculada
   */
  static addBusinessDays(startDate: Date, businessDaysToAdd: number): Date {
    let currentDate = new Date(startDate);
    let remainingDays = businessDaysToAdd;

    while (remainingDays > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
      
      if (this.isBusinessDay(currentDate)) {
        remainingDays--;
      }
    }

    return currentDate;
  }

  /**
   * Calcula cuántos días hábiles hay entre dos fechas
   * @param startDate Fecha inicial
   * @param endDate Fecha final
   * @returns Número de días hábiles
   */
  static countBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (this.isBusinessDay(currentDate)) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }

  /**
   * Obtiene todos los feriados de Colombia para un año específico
   * @param year Año a consultar
   * @returns Array de fechas de feriados
   */
  static getColombianHolidays(year: number): Date[] {
    return getHolidaysForYear(year);
  }

  /**
   * Calcula la fecha límite de pago para una cuota de ahorro
   * Agrega los días hábiles configurados en el producto desde el 1 del mes
   * @param month Mes (1-12)
   * @param year Año
   * @param graceDays Días hábiles de gracia del producto
   * @returns Fecha límite de pago
   */
  static calculatePaymentDueDate(month: number, year: number, graceDays: number = 5): Date {
    // Fecha de generación de la cuota: primer día del mes
    const generationDate = new Date(year, month - 1, 1);
    
    // Calcular fecha límite agregando días hábiles
    return this.addBusinessDays(generationDate, graceDays);
  }

  /**
   * Verifica si una cuota está vencida
   * @param dueDate Fecha límite de pago
   * @param currentDate Fecha actual (opcional, por defecto hoy)
   * @returns true si está vencida
   */
  static isOverdue(dueDate: Date, currentDate: Date = new Date()): boolean {
    // Normalizar fechas para comparar solo días (sin horas)
    const normalizedDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const normalizedCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    return normalizedCurrentDate > normalizedDueDate;
  }
}

export default BusinessDaysUtil;
