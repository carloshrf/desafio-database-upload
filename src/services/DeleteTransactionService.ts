import { getRepository } from 'typeorm';
import validate from 'uuid-validate';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    const isUuid = validate(id);

    if (!isUuid) {
      throw new AppError('Invalid UUID format');
    }

    const transaction = await transactionsRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new AppError('Do not exists a transaction with this id');
    }

    await transactionsRepository.delete({ id });
  }
}

export default DeleteTransactionService;
