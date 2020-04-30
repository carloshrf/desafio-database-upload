import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getRepository, getCustomRepository, In } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVData {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  public async execute(fileName: string): Promise<Transaction[]> {
    const csvFilePath = path.resolve(
      __dirname,
      '..',
      '..',
      'tmp',
      `${fileName}`,
    );

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transaction: CSVData[] = [];
    const categories: string[] = [];

    parseCSV.on('data', line => {
      categories.push(line[3]);

      transaction.push({
        title: String(line[0]),
        type: line[1],
        value: Number(line[2]),
        category: String(line[3]),
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    // valida o valor
    let { total } = await transactionsRepository.getBalance();

    transaction.forEach(({ type, value }) => {
      if (type === 'income') {
        total += value;
      }

      if (type === 'outcome') {
        total -= value;
      }

      if (total < 0) {
        throw new AppError('Not enough cash stranger', 400);
      }
    });

    // busca todas categorias contidas no array categories
    const existscategories = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    // cria uma string com todas categorias existentes no banco de dados no type Category
    const existentCategoriesTitles = existscategories.map(
      category => category.title,
    );

    // busca as categorias que não existem
    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);
    // no segundo filter, é retornado o valor do vetor onde se confere o index do primeiro elemento único

    // adiciona as categorias a serem adicionadas
    const newCategories = categoryRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    // recria a array de categorias já no tipo Category
    const allCategories = [...newCategories, ...existscategories];

    const createdTransactions = transactionsRepository.create(
      transaction.map(transact => ({
        title: transact.title,
        type: transact.type,
        value: transact.value,
        category: allCategories.find(
          category => category.title === transact.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
