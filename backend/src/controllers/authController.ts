import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../models/prismaClient.js';
import { Request, Response } from 'express';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  );
  res.json({ token });
}
