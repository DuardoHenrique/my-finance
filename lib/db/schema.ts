import { pgTable, text } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
});

export const assetsTable = pgTable('assets', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  ticker: text('ticker').notNull(),
  quantity: text('quantity').notNull(),
  averagePrice: text('average_price').notNull(),
  currency: text('currency').notNull(),
  category: text('category').notNull(),
  portfolio: text('portfolio').notNull(),
  segment: text('segment'),
});

export const transactionsTable = pgTable('transactions', {
  id: text('id').primaryKey(),
  assetId: text('asset_id'),
  type: text('type'),
  quantity: text('quantity'),
  price: text('price'),
  date: text('date'),
});

export const dividendsTable = pgTable('dividends', {
  id: text('id').primaryKey(),
  assetId: text('asset_id'),
  amount: text('amount'),
  date: text('date'),
});

export const users = usersTable;
export const assets = assetsTable;
export const transactions = transactionsTable;
export const dividends = dividendsTable;
