
import { Request, Response } from 'express';
import prisma from '../models/prismaClient.js';
import { logger } from '../utils/logger.js';

// Obtener todos los productos financieros
// Obtener todos los productos (modelo Product)
export async function getProducts(req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        interestRate: true,
        minBalance: true,
        maxBalance: true,
        monthlyFee: true,
        penaltyRate: true,
        graceDays: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    logger.info('Productos financieros obtenidos correctamente');
    res.json({ success: true, data: products });
  } catch (error: any) {
    logger.error(`Error al obtener productos: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Obtener un producto financiero por ID
// Obtener un producto por ID
export async function getProduct(req: Request, res: Response) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        interestRate: true,
        minBalance: true,
        maxBalance: true,
        monthlyFee: true,
        penaltyRate: true,
        graceDays: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    if (!product) {
      logger.warn(`Producto no encontrado: ${req.params.id}`);
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    logger.info(`Producto obtenido: ${product.name}`);
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error(`Error al obtener producto: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Crear un nuevo producto financiero
// Crear un nuevo producto
export async function createProduct(req: Request, res: Response) {
  try {
    const { name, type, description, interestRate, minBalance, maxBalance, monthlyFee, penaltyRate, graceDays } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'El nombre y el tipo son obligatorios.' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        type,
        description,
        interestRate,
        minBalance,
        maxBalance,
        monthlyFee,
        penaltyRate,
        graceDays,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        interestRate: true,
        minBalance: true,
        maxBalance: true,
        monthlyFee: true,
        penaltyRate: true,
        graceDays: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    logger.info(`Producto creado: ${product.name}`);
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    logger.error(`Error al crear producto: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Actualizar un producto financiero
// Actualizar producto
export async function updateProduct(req: Request, res: Response) {
  try {
    const { name, type, description, interestRate, minBalance, maxBalance, monthlyFee, penaltyRate, graceDays, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id, 10) },
      data: { 
        name,
        type,
        description,
        interestRate,
        minBalance,
        maxBalance,
        monthlyFee,
        penaltyRate,
        graceDays,
        isActive,
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        interestRate: true,
        minBalance: true,
        maxBalance: true,
        monthlyFee: true,
        penaltyRate: true,
        graceDays: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    logger.info(`Producto actualizado: ${product.name}`);
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error(`Error al actualizar producto: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Eliminar un producto financiero
// Eliminar producto
export async function deleteProduct(req: Request, res: Response) {
  try {
    // Verificar si el producto tiene cuentas asociadas
    const accountsCount = await prisma.account.count({
      where: { productId: parseInt(req.params.id, 10) }
    });

    if (accountsCount > 0) {
      return res.status(409).json({ 
        success: false, 
        error: `No se puede eliminar el producto porque tiene ${accountsCount} cuenta(s) asociada(s).` 
      });
    }

    // Verificar si el producto existe
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id, 10) }
    });

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Producto no encontrado.' 
      });
    }

    await prisma.product.delete({ 
      where: { id: parseInt(req.params.id, 10) } 
    });
    
    logger.info(`Producto eliminado exitosamente: ${req.params.id} - ${product.name}`);
    res.status(200).json({ success: true, message: 'Producto eliminado exitosamente.' });
  } catch (error: any) {
    logger.error(`Error al eliminar producto: ${error.message}`);
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: 'Producto no encontrado.' 
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(409).json({ 
        success: false, 
        error: 'No se puede eliminar el producto porque tiene registros relacionados.' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor al eliminar el producto.' 
    });
  }
}
