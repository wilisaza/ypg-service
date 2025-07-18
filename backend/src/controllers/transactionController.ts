import { Request, Response } from 'express';
export async function getTransactions(req: Request, res: Response) { res.json([]); }
export async function getTransaction(req: Request, res: Response) { res.json({}); }
export async function createTransaction(req: Request, res: Response) { res.status(201).json({}); }
export async function updateTransaction(req: Request, res: Response) { res.json({}); }
export async function deleteTransaction(req: Request, res: Response) { res.status(204).end(); }
