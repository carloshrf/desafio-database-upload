import { Router } from 'express';
import multer from 'multer';
import { getCustomRepository } from 'typeorm';
import uploadConfig from '../config/upload';

import TransactionsRepository from '../repositories/TransactionsRepository';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import CreateTransactionService from '../services/CreateTransactionService';

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionsRepository.getTransactions();
  const balance = await transactionsRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });

  delete transaction.category.created_at;
  delete transaction.category.updated_at;

  return response.json({
    id: transaction.id,
    title,
    value,
    type,
    category,
  });
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();

  await deleteTransaction.execute(id);

  return response.status(200).json();
});

const upload = multer(uploadConfig);

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const fileName = request.file.filename;

    const importTransaction = new ImportTransactionsService();

    const transactions = await importTransaction.execute(fileName);

    return response.json(transactions);
  },
);

export default transactionsRouter;
