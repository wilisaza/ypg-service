import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../models/prismaClient.js';
import { logger } from '../utils/logger.js';

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      }
    });
    logger.info('Usuarios obtenidos correctamente');
    res.json({ success: true, data: users });
  } catch (error: any) {
    logger.error(`Error al obtener usuarios: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const { password, ...rest } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contraseña es obligatoria y debe tener al menos 6 caracteres.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { ...rest, password: hashedPassword },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      }
    });
    logger.info(`Usuario creado: ${user.username}`);
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    logger.error(`Error al crear usuario: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      }
    });
    if (!user) {
      logger.warn(`Usuario no encontrado: ${req.params.id}`);
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    logger.info(`Usuario obtenido: ${user.username}`);
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error(`Error al obtener usuario: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      }
    });
    logger.info(`Usuario actualizado: ${user.username}`);
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error(`Error al actualizar usuario: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    logger.info(`Usuario eliminado: ${req.params.id}`);
    res.status(204).end();
  } catch (error: any) {
    logger.error(`Error al eliminar usuario: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}
