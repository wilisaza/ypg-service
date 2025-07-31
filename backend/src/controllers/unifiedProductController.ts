import { Request, Response } from 'express';
import prisma from '../models/prismaClient.js';

export class ProductController {
  
  /**
   * Crear un nuevo producto (préstamo o ahorro)
   */
  async createProduct(req: Request, res: Response) {
    try {
      const {
        name,
        type, // 'SAVINGS' | 'LOAN'
        loanType, // 'FRENCH_SYSTEM' | 'VARIABLE_CAPITAL' (solo para LOAN)
        description,
        interestRate, // Tasa anual (ej: 0.24 para 24%)
        minBalance,
        maxBalance,
        monthlyFee, // Para capital variable o cuota de manejo
        penaltyRate,
        graceDays,
        // Campos específicos para planes de ahorro
        monthlyAmount,
        billingDay,
        penaltyAmount,
        startMonth,
        endMonth,
        planYear
      } = req.body;

      console.log('📥 Datos recibidos en unifiedProductController createProduct:', req.body);

      // Validaciones básicas
      if (!name || !type) {
        return res.status(400).json({
          success: false,
          error: 'Nombre y tipo de producto son requeridos'
        });
      }

      // Validaciones específicas por tipo
      if (type === 'LOAN') {
        if (!loanType) {
          return res.status(400).json({
            success: false,
            error: 'Los productos de préstamo requieren especificar el tipo de préstamo'
          });
        }

        if (!interestRate || interestRate <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Los productos de préstamo requieren una tasa de interés válida'
          });
        }

        // Para capital variable, monthlyFee es obligatorio
        if (loanType === 'VARIABLE_CAPITAL' && (!monthlyFee || monthlyFee <= 0)) {
          return res.status(400).json({
            success: false,
            error: 'Los préstamos de capital variable requieren un monto mensual fijo'
          });
        }
      }

      if (type === 'SAVINGS') {
        if (loanType) {
          return res.status(400).json({
            success: false,
            error: 'Los productos de ahorro no pueden tener tipo de préstamo'
          });
        }
      }

      // Verificar que el nombre no existe
      const existingProduct = await prisma.product.findFirst({
        where: { name }
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe un producto con ese nombre'
        });
      }

      // Crear el producto
      const product = await prisma.product.create({
        data: {
          name,
          type,
          loanType: type === 'LOAN' ? loanType : null,
          description,
          interestRate,
          minBalance,
          maxBalance,
          monthlyFee,
          penaltyRate,
          graceDays: graceDays || 5,
          // Campos específicos para planes de ahorro
          monthlyAmount,
          billingDay,
          penaltyAmount,
          startMonth,
          endMonth,
          planYear,
          isActive: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: product
      });

    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * Listar todos los productos
   */
  async getProducts(req: Request, res: Response) {
    try {
      const { type, loanType, isActive } = req.query;

      const whereClause: any = {};

      if (type) {
        whereClause.type = type;
      }

      if (loanType) {
        whereClause.loanType = loanType;
      }

      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        orderBy: [
          { type: 'asc' },
          { name: 'asc' }
        ],
        include: {
          _count: {
            select: { accounts: true }
          }
        }
      });

      res.json({
        success: true,
        data: products.map(product => ({
          ...product,
          activeAccounts: product._count.accounts
        }))
      });

    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener un producto por ID
   */
  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: {
          _count: {
            select: { accounts: true }
          }
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          ...product,
          activeAccounts: product._count.accounts
        }
      });

    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualizar un producto
   */
  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        interestRate,
        minBalance,
        maxBalance,
        monthlyFee,
        penaltyRate,
        graceDays,
        isActive,
        loanType,
        // Campos específicos para planes de ahorro
        monthlyAmount,
        billingDay,
        penaltyAmount,
        startMonth,
        endMonth,
        planYear
      } = req.body;

      console.log('📥 Datos recibidos en unifiedProductController updateProduct:', req.body);

      const product = await prisma.product.findUnique({
        where: { id: parseInt(id) }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado'
        });
      }

      // Verificar que el nombre no esté en uso por otro producto
      if (name && name !== product.name) {
        const existingProduct = await prisma.product.findFirst({
          where: { 
            name,
            id: { not: parseInt(id) }
          }
        });

        if (existingProduct) {
          return res.status(400).json({
            success: false,
            error: 'Ya existe otro producto con ese nombre'
          });
        }
      }

      const updatedProduct = await prisma.product.update({
        where: { id: parseInt(id) },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(interestRate !== undefined && { interestRate }),
          ...(minBalance !== undefined && { minBalance }),
          ...(maxBalance !== undefined && { maxBalance }),
          ...(monthlyFee !== undefined && { monthlyFee }),
          ...(penaltyRate !== undefined && { penaltyRate }),
          ...(graceDays !== undefined && { graceDays }),
          ...(isActive !== undefined && { isActive }),
          ...(loanType !== undefined && { loanType }),
          // Campos específicos para planes de ahorro
          ...(monthlyAmount !== undefined && { monthlyAmount }),
          ...(billingDay !== undefined && { billingDay }),
          ...(penaltyAmount !== undefined && { penaltyAmount }),
          ...(startMonth !== undefined && { startMonth }),
          ...(endMonth !== undefined && { endMonth }),
          ...(planYear !== undefined && { planYear })
        }
      });

      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: updatedProduct
      });

    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * Eliminar (desactivar) un producto
   */
  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: {
          _count: {
            select: { accounts: true }
          }
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado'
        });
      }

      // Si tiene cuentas activas, solo desactivar
      if (product._count.accounts > 0) {
        const updatedProduct = await prisma.product.update({
          where: { id: parseInt(id) },
          data: { isActive: false }
        });

        return res.json({
          success: true,
          message: 'Producto desactivado (tiene cuentas asociadas)',
          data: updatedProduct
        });
      }

      // Si no tiene cuentas, se puede eliminar físicamente
      await prisma.product.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener productos por tipo específico
   */
  async getProductsByType(req: Request, res: Response) {
    try {
      const { type } = req.params; // 'SAVINGS' or 'LOAN'
      const { loanType } = req.query; // 'FRENCH_SYSTEM' or 'VARIABLE_CAPITAL'

      if (!['SAVINGS', 'LOAN'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de producto inválido. Debe ser SAVINGS o LOAN'
        });
      }

      const whereClause: any = {
        type,
        isActive: true
      };

      if (type === 'LOAN' && loanType) {
        if (!['FRENCH_SYSTEM', 'VARIABLE_CAPITAL'].includes(loanType as string)) {
          return res.status(400).json({
            success: false,
            error: 'Tipo de préstamo inválido'
          });
        }
        whereClause.loanType = loanType;
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        orderBy: { name: 'asc' }
      });

      res.json({
        success: true,
        data: products
      });

    } catch (error) {
      console.error('Error fetching products by type:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}

export const productController = new ProductController();
