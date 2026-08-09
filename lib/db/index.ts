import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import fs from 'fs/promises';
import path from 'path';
import { initPostgresDatabase } from './initDb';

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const isValidPostgresUrl = typeof databaseUrl === 'string' && databaseUrl.startsWith('postgres');

export const db = isValidPostgresUrl ? drizzle({ client: neon(databaseUrl) }) : null;

export interface Asset {
  id: string;
  userId?: string;
  name: string;
  ticker: string;
  quantity: string | number;
  averagePrice: string | number;
  currentPrice?: number;
  currency: 'BRL' | 'USD';
  category: string;
  portfolio: 'brasil' | 'internacional' | 'cripto';
  observacoes?: string;
}

export interface Dividend {
  id: string;
  userId?: string;
  portfolio: 'brasil' | 'internacional';
  ticker: string;
  type?: string;
  amount: number;
  date: string;
  observacoes?: string;
}

export interface Transaction {
  id: string;
  userId?: string;
  portfolio: 'cripto';
  ticker: string;
  type: 'Compra' | 'Venda';
  quantity: number;
  unitPriceUSD: number;
  date: string;
  observacoes?: string;
}

const DATA_FILE_PATH = path.join(process.cwd(), 'lib', 'db', 'data.json');
const DIVIDENDS_FILE_PATH = path.join(process.cwd(), 'lib', 'db', 'dividends.json');
const TRANSACTIONS_FILE_PATH = path.join(process.cwd(), 'lib', 'db', 'transactions.json');

let dbInitialized = false;

async function checkAndInitDb() {
  if (!dbInitialized && isValidPostgresUrl) {
    dbInitialized = true;
    await initPostgresDatabase();
  }
}

async function ensureFile(filePath: string) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify([], null, 2), 'utf8');
  }
}

export async function getAssets(portfolio?: 'brasil' | 'internacional' | 'cripto' | 'all', userId?: string): Promise<Asset[]> {
  await checkAndInitDb();

  if (isValidPostgresUrl) {
    try {
      const sql = neon(databaseUrl!);
      let rows: any[] = [];

      if (userId && portfolio && portfolio !== 'all') {
        rows = await sql`
          SELECT id, user_id as "userId", name, ticker, quantity, average_price as "averagePrice", currency, category, portfolio 
          FROM assets 
          WHERE user_id = ${userId} AND portfolio = ${portfolio}
        `;
      } else if (userId) {
        rows = await sql`
          SELECT id, user_id as "userId", name, ticker, quantity, average_price as "averagePrice", currency, category, portfolio 
          FROM assets 
          WHERE user_id = ${userId}
        `;
      } else if (portfolio && portfolio !== 'all') {
        rows = await sql`
          SELECT id, user_id as "userId", name, ticker, quantity, average_price as "averagePrice", currency, category, portfolio 
          FROM assets 
          WHERE portfolio = ${portfolio}
        `;
      } else {
        rows = await sql`
          SELECT id, user_id as "userId", name, ticker, quantity, average_price as "averagePrice", currency, category, portfolio 
          FROM assets
        `;
      }

      return rows as Asset[];
    } catch (err) {
      console.error('PostgreSQL getAssets error, falling back to JSON:', err);
    }
  }

  // Fallback to local JSON file
  try {
    await ensureFile(DATA_FILE_PATH);
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    let assets: Asset[] = JSON.parse(data);
    
    if (userId) {
      assets = assets.filter((asset) => asset.userId === userId);
    }
    
    if (!portfolio || portfolio === 'all') {
      return assets;
    }
    return assets.filter((asset) => asset.portfolio === portfolio);
  } catch (error) {
    return [];
  }
}

export async function savePortfolioAssets(
  portfolio: 'brasil' | 'internacional' | 'cripto',
  assetsList: any[],
  userId: string
): Promise<Asset[]> {
  await checkAndInitDb();

  const formattedAssets: Asset[] = assetsList.map((a) => ({
    id: a.id || `ast_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`,
    userId,
    name: a.name,
    ticker: String(a.ticker).toUpperCase(),
    quantity: String(a.quantity),
    averagePrice: String(a.averagePrice || a.buyPrice || 0),
    currentPrice: typeof a.currentPrice === 'number' ? a.currentPrice : undefined,
    currency: a.currency || (portfolio === 'brasil' ? 'BRL' : 'USD'),
    category: a.category,
    portfolio,
    observacoes: a.observacoes || '',
  }));

  if (isValidPostgresUrl) {
    try {
      const sql = neon(databaseUrl!);
      await sql`DELETE FROM assets WHERE user_id = ${userId} AND portfolio = ${portfolio}`;
      for (const asset of formattedAssets) {
        await sql`
          INSERT INTO assets (id, user_id, name, ticker, quantity, average_price, currency, category, portfolio)
          VALUES (${asset.id}, ${userId}, ${asset.name}, ${asset.ticker}, ${asset.quantity}, ${asset.averagePrice}, ${asset.currency}, ${asset.category}, ${asset.portfolio});
        `;
      }
      return formattedAssets;
    } catch (err) {
      console.error('PostgreSQL savePortfolioAssets error, falling back to JSON:', err);
    }
  }

  // Fallback to JSON
  await ensureFile(DATA_FILE_PATH);
  const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
  let assets: Asset[] = [];
  try {
    assets = JSON.parse(data);
  } catch {
    assets = [];
  }

  const remaining = assets.filter((a) => !(a.userId === userId && a.portfolio === portfolio));
  const newFullList = [...remaining, ...formattedAssets];
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(newFullList, null, 2), 'utf8');

  return formattedAssets;
}

export async function addAsset(assetData: Omit<Asset, 'id'>): Promise<Asset> {
  await checkAndInitDb();

  const newId = `ast_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  const newAsset: Asset = {
    ...assetData,
    id: newId,
  };

  if (isValidPostgresUrl) {
    try {
      const sql = neon(databaseUrl!);
      await sql`
        INSERT INTO assets (id, user_id, name, ticker, quantity, average_price, currency, category, portfolio)
        VALUES (${newAsset.id}, ${newAsset.userId || null}, ${newAsset.name}, ${newAsset.ticker}, ${newAsset.quantity}, ${newAsset.averagePrice}, ${newAsset.currency}, ${newAsset.category}, ${newAsset.portfolio});
      `;
      return newAsset;
    } catch (err) {
      console.error('PostgreSQL addAsset error, falling back to JSON:', err);
    }
  }

  // Fallback to JSON
  await ensureFile(DATA_FILE_PATH);
  const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
  const assets: Asset[] = JSON.parse(data);
  assets.push(newAsset);
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(assets, null, 2), 'utf8');
  return newAsset;
}

export async function updateAsset(id: string, assetData: Partial<Omit<Asset, 'id'>>, userId?: string): Promise<Asset> {
  await checkAndInitDb();

  if (isValidPostgresUrl) {
    try {
      const sql = neon(databaseUrl!);
      const existing = userId 
        ? await sql`SELECT id, user_id as "userId", name, ticker, quantity, average_price as "averagePrice", currency, category, portfolio FROM assets WHERE id = ${id} AND user_id = ${userId}`
        : await sql`SELECT id, user_id as "userId", name, ticker, quantity, average_price as "averagePrice", currency, category, portfolio FROM assets WHERE id = ${id}`;
      
      if (existing.length === 0) throw new Error('Asset not found or unauthorized');

      const current = existing[0];
      const updated = {
        name: assetData.name ?? current.name,
        ticker: assetData.ticker ?? current.ticker,
        quantity: assetData.quantity ?? current.quantity,
        averagePrice: assetData.averagePrice ?? current.averagePrice,
        currency: assetData.currency ?? current.currency,
        category: assetData.category ?? current.category,
        portfolio: assetData.portfolio ?? current.portfolio,
      };

      if (userId) {
        await sql`
          UPDATE assets 
          SET name = ${updated.name}, 
              ticker = ${updated.ticker}, 
              quantity = ${updated.quantity}, 
              average_price = ${updated.averagePrice}, 
              currency = ${updated.currency}, 
              category = ${updated.category}, 
              portfolio = ${updated.portfolio}
          WHERE id = ${id} AND user_id = ${userId};
        `;
      } else {
        await sql`
          UPDATE assets 
          SET name = ${updated.name}, 
              ticker = ${updated.ticker}, 
              quantity = ${updated.quantity}, 
              average_price = ${updated.averagePrice}, 
              currency = ${updated.currency}, 
              category = ${updated.category}, 
              portfolio = ${updated.portfolio}
          WHERE id = ${id};
        `;
      }

      return {
        id,
        userId: current.userId,
        ...updated,
      } as Asset;
    } catch (err) {
      console.error('PostgreSQL updateAsset error:', err);
    }
  }

  // Fallback to JSON
  await ensureFile(DATA_FILE_PATH);
  const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
  let assets: Asset[] = JSON.parse(data);
  let updatedAsset: Asset | null = null;
  assets = assets.map((asset) => {
    if (asset.id === id && (!userId || asset.userId === userId)) {
      updatedAsset = { ...asset, ...assetData };
      return updatedAsset;
    }
    return asset;
  });
  if (!updatedAsset) throw new Error('Asset not found or unauthorized');
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(assets, null, 2), 'utf8');
  return updatedAsset;
}

export async function deleteAsset(id: string, userId?: string) {
  await checkAndInitDb();

  if (isValidPostgresUrl) {
    try {
      const sql = neon(databaseUrl!);
      if (userId) {
        await sql`DELETE FROM assets WHERE id = ${id} AND user_id = ${userId}`;
      } else {
        await sql`DELETE FROM assets WHERE id = ${id}`;
      }
      return { success: true };
    } catch (err) {
      console.error('PostgreSQL deleteAsset error:', err);
    }
  }

  // Fallback to JSON
  await ensureFile(DATA_FILE_PATH);
  const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
  const assets: Asset[] = JSON.parse(data);
  const filteredAssets = assets.filter((asset) => {
    if (asset.id !== id) return true;
    if (userId && asset.userId !== userId) return true;
    return false;
  });
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(filteredAssets, null, 2), 'utf8');
  return { success: true };
}

// Dividends Persistence
export async function getDividends(portfolio?: 'brasil' | 'internacional', userId?: string): Promise<Dividend[]> {
  await ensureFile(DIVIDENDS_FILE_PATH);
  try {
    const data = await fs.readFile(DIVIDENDS_FILE_PATH, 'utf8');
    let list: Dividend[] = JSON.parse(data);
    if (userId) list = list.filter((d) => d.userId === userId);
    if (portfolio) list = list.filter((d) => d.portfolio === portfolio);
    return list;
  } catch {
    return [];
  }
}

export async function saveDividendsForPortfolio(
  portfolio: 'brasil' | 'internacional',
  dividendsList: any[],
  userId: string
): Promise<Dividend[]> {
  await ensureFile(DIVIDENDS_FILE_PATH);
  const formatted: Dividend[] = dividendsList.map((d) => ({
    id: d.id || `div_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    portfolio,
    ticker: String(d.ticker).toUpperCase(),
    type: d.type,
    amount: Number(d.amountBRL ?? d.amountUSD ?? d.amount ?? 0),
    date: d.date,
    observacoes: d.observacoes || '',
  }));

  const data = await fs.readFile(DIVIDENDS_FILE_PATH, 'utf8');
  let list: Dividend[] = [];
  try {
    list = JSON.parse(data);
  } catch {
    list = [];
  }

  const remaining = list.filter((d) => !(d.userId === userId && d.portfolio === portfolio));
  const newFullList = [...remaining, ...formatted];
  await fs.writeFile(DIVIDENDS_FILE_PATH, JSON.stringify(newFullList, null, 2), 'utf8');

  return formatted;
}

// Transactions Persistence
export async function getTransactions(portfolio: 'cripto' = 'cripto', userId?: string): Promise<Transaction[]> {
  await ensureFile(TRANSACTIONS_FILE_PATH);
  try {
    const data = await fs.readFile(TRANSACTIONS_FILE_PATH, 'utf8');
    let list: Transaction[] = JSON.parse(data);
    if (userId) list = list.filter((t) => t.userId === userId);
    if (portfolio) list = list.filter((t) => t.portfolio === portfolio);
    return list;
  } catch {
    return [];
  }
}

export async function saveTransactionsForPortfolio(
  portfolio: 'cripto',
  transactionsList: any[],
  userId: string
): Promise<Transaction[]> {
  await ensureFile(TRANSACTIONS_FILE_PATH);
  const formatted: Transaction[] = transactionsList.map((t) => ({
    id: t.id || `tx_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    portfolio,
    ticker: String(t.ticker).toUpperCase(),
    type: t.type,
    quantity: Number(t.quantity || 0),
    unitPriceUSD: Number(t.unitPriceUSD || 0),
    date: t.date,
    observacoes: t.observacoes || '',
  }));

  const data = await fs.readFile(TRANSACTIONS_FILE_PATH, 'utf8');
  let list: Transaction[] = [];
  try {
    list = JSON.parse(data);
  } catch {
    list = [];
  }

  const remaining = list.filter((t) => !(t.userId === userId && t.portfolio === portfolio));
  const newFullList = [...remaining, ...formatted];
  await fs.writeFile(TRANSACTIONS_FILE_PATH, JSON.stringify(newFullList, null, 2), 'utf8');

  return formatted;
}

