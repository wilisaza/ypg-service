import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../models/prismaClient.js';

const router = Router();

import { login } from '../controllers/authController.js';

router.post('/login', login);

export default router;
