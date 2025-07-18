-- Agregar nuevos campos al modelo FinancialProduct
ALTER TABLE "FinancialProduct" ADD COLUMN "monthlyAmount" DOUBLE PRECISION;
ALTER TABLE "FinancialProduct" ADD COLUMN "startMonth" INTEGER;
ALTER TABLE "FinancialProduct" ADD COLUMN "startYear" INTEGER;
ALTER TABLE "FinancialProduct" ADD COLUMN "endMonth" INTEGER;
ALTER TABLE "FinancialProduct" ADD COLUMN "endYear" INTEGER;
ALTER TABLE "FinancialProduct" ADD COLUMN "defaultInterest" DOUBLE PRECISION;
ALTER TABLE "FinancialProduct" ADD COLUMN "termMonths" INTEGER;

-- Migrar datos existentes (si los hay)
-- Actualizar productos de tipo AHORRO con valores por defecto basados en cuentas existentes
UPDATE "FinancialProduct" 
SET 
  "monthlyAmount" = 50000,
  "startMonth" = 1,
  "startYear" = 2025,
  "endMonth" = 12,
  "endYear" = 2025
WHERE "type" = 'AHORRO';

-- Actualizar productos de tipo PRESTAMO con valores por defecto
UPDATE "FinancialProduct" 
SET 
  "defaultInterest" = 12.0,
  "termMonths" = 12
WHERE "type" = 'PRESTAMO';

-- Eliminar campos obsoletos del modelo ProductAccount
ALTER TABLE "ProductAccount" DROP COLUMN IF EXISTS "month";
ALTER TABLE "ProductAccount" DROP COLUMN IF EXISTS "year";
