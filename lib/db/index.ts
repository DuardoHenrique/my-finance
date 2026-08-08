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
  quantity: string;
  averagePrice: string;
  currency: 'BRL' | 'USD';
  category: string;
  portfolio: 'brasil' | 'internacional' | 'cripto';
}

const DATA_FILE_PATH = path.join(process.cwd(), 'lib', 'db', 'data.json');

let dbInitialized = false;

async function checkAndInitDb() {
  if (!dbInitialized && isValidPostgresUrl) {
    dbInitialized = true;
    await initPostgresDatabase();
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
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    const assets: Asset[] = JSON.parse(data);
    assets.push(newAsset);
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(assets, null, 2), 'utf8');
    return newAsset;
  } catch (error) {
    throw new Error('Could not add asset to database');
  }
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
