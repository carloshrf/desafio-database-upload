import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const balance = transactions.reduce(
      (accumulator: Balance, transaction: Transaction): Balance => {
        if (transaction.type === 'income') {
          accumulator.income += transaction.value;
        }

        if (transaction.type === 'outcome') {
          accumulator.outcome += transaction.value;
        }

        return accumulator;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    balance.total = balance.income - balance.outcome;

    return balance;
  }

  public async getTransactions(): Promise<Transaction[]> {
    //
    // const transactions = await this.find({
    //   select: ['id', 'title', 'value', 'type', 'category'],
    //   relations: ['category'],
    // }); // created_at e updated_at retornam
    //
    // // ==============================

    // const transactions = await this.find({
    //   join: {
    //     alias: 'transaction',
    //     innerJoinAndSelect: {
    //       code: 'transaction.category',
    //     },
    //   },
    //   select: ['id', 'title', 'value', 'type'],
    // }); // created_at e updated_at retornam
    //
    // =================================

    const transactions = await this.createQueryBuilder('transactions')
      .leftJoinAndSelect('transactions.category', 'category') // adiciona a tabela categoria de acordo com seu relacionamento, se tornando acessível na tabela transactions
      .select([
        'transactions.id',
        'transactions.title',
        'transactions.value',
        'transactions.type',
        'category.id',
        'category.title',
      ])
      .getMany(); // retorna não só um, mas todos resultados referentes da busca

    return transactions;
  }
}

export default TransactionsRepository;
