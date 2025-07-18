
import { Request, Response } from 'express';
import prisma from '../models/prismaClient.js';
import { logger } from '../utils/logger.js';

// Obtener todos los productos financieros
export async function getProducts(req: Request, res: Response) {
  try {
    const products = await prisma.financialProduct.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        // Campos específicos para AHORRO
        monthlyAmount: true,
        startMonth: true,
        startYear: true,
        endMonth: true,
        endYear: true,
        // Campos específicos para PRESTAMO
        defaultInterest: true,
        termMonths: true,
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
export async function getProduct(req: Request, res: Response) {
  try {
    const product = await prisma.financialProduct.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        // Campos específicos para AHORRO
        monthlyAmount: true,
        startMonth: true,
        startYear: true,
        endMonth: true,
        endYear: true,
        // Campos específicos para PRESTAMO
        defaultInterest: true,
        termMonths: true,
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
export async function createProduct(req: Request, res: Response) {
  try {
    const { 
      name, 
      type, 
      description,
      // Campos específicos para AHORRO
      monthlyAmount,
      startMonth,
      startYear,
      endMonth,
      endYear,
      // Campos específicos para PRESTAMO
      defaultInterest,
      termMonths
    } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'El nombre y el tipo son obligatorios.' });
    }

    const product = await prisma.financialProduct.create({
      data: { 
        name, 
        type, 
        description,
        // Campos específicos para AHORRO
        monthlyAmount,
        startMonth,
        startYear,
        endMonth,
        endYear,
        // Campos específicos para PRESTAMO
        defaultInterest,
        termMonths
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        // Campos específicos para AHORRO
        monthlyAmount: true,
        startMonth: true,
        startYear: true,
        endMonth: true,
        endYear: true,
        // Campos específicos para PRESTAMO
        defaultInterest: true,
        termMonths: true,
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
export async function updateProduct(req: Request, res: Response) {
  try {
    const { 
      name, 
      type, 
      description,
      // Campos específicos para AHORRO
      monthlyAmount,
      startMonth,
      startYear,
      endMonth,
      endYear,
      // Campos específicos para PRESTAMO
      defaultInterest,
      termMonths
    } = req.body;

    const product = await prisma.financialProduct.update({
      where: { id: req.params.id },
      data: { 
        name, 
        type, 
        description,
        // Campos específicos para AHORRO
        monthlyAmount,
        startMonth,
        startYear,
        endMonth,
        endYear,
        // Campos específicos para PRESTAMO
        defaultInterest,
        termMonths
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        // Campos específicos para AHORRO
        monthlyAmount: true,
        startMonth: true,
        startYear: true,
        endMonth: true,
        endYear: true,
        // Campos específicos para PRESTAMO
        defaultInterest: true,
        termMonths: true,
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
export async function deleteProduct(req: Request, res: Response) {
  try {
    await prisma.financialProduct.delete({ where: { id: req.params.id } });
    logger.info(`Producto eliminado: ${req.params.id}`);
    res.status(204).end();
  } catch (error: any) {
    logger.error(`Error al eliminar producto: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}
