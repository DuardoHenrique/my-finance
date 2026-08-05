import { pgTable, text, timestamp, integer, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const assets = pgTable('assets', {
  id: text('id').primaryKey(), // using uuid or ulid
  segment: text('segment').notNull(), // 'brasil', 'internacional', 'cripto'
  name: text('name').notNull(),
  ticker: text('ticker').notNull(), // e.g. PETR4, AAPL, BTC
  category: text('category').notNull(), // e.g. Ações, FIIs, Stocks, ETFs, REITs, BTC, Altcoins
  currency: text('currency').notNull(), // 'BRL', 'USD'
  quantity: numeric('quantity').notNull().default('0'), // Can be fractional for crypto
  averagePrice: numeric('average_price').notNull().default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  assetId: text('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'BUY', 'SELL'
  quantity: numeric('quantity').notNull(),
  priceAtTransaction: numeric('price_at_transaction').notNull(),
  date: timestamp('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dividends = pgTable('dividends', {
  id: text('id').primaryKey(),
  assetId: text('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric('amount').notNull(),
  date: timestamp('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assetsRelations = relations(assets, ({ many }) => ({
  transactions: many(transactions),
  dividends: many(dividends),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  asset: one(assets, {
    fields: [transactions.assetId],
    references: [assets.id],
  }),
}));

export const dividendsRelations = relations(dividends, ({ one }) => ({
  asset: one(assets, {
    fields: [dividends.assetId],
    references: [assets.id],
  }),
}));
