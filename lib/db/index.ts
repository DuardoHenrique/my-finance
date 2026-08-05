import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import fs from 'fs/promises';
import path from 'path';

// Parse and strictly validate DATABASE_URL to avoid malformed connection failures
const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const isValidPostgresUrl = typeof databaseUrl === 'string' && databaseUrl.startsWith('postgres');

export const db = isValidPostgresUrl ? drizzle({ client: neon(databaseUrl) }) : null;

export interface Asset {
  id: string;
  name: string;
  ticker: string;
  quantity: string;
  averagePrice: string;
  currency: 'BRL' | 'USD';
  category: string;
  portfolio: 'brasil' | 'internacional' | 'cripto';
}

const DATA_FILE_PATH = path.join(process.cwd(), 'lib', 'db', 'data.json');

const INITIAL_ASSETS: Asset[] = [
  {
    id: 'b1',
    name: 'Weg S.A.',
    ticker: 'WEGE3',
    quantity: '100',
    averagePrice: '38.50',
    currency: 'BRL',
    category: 'Ações',
    portfolio: 'brasil',
  },
  {
    id: 'b2',
    name: 'Maxi Renda FII',
    ticker: 'MXRF11',
    quantity: '500',
    averagePrice: '10.15',
    currency: 'BRL',
    category: 'FIIs',
    portfolio: 'brasil',
  },
  {
    id: 'i1',
    name: 'Apple Inc.',
    ticker: 'AAPL',
    quantity: '15',
    averagePrice: '175.20',
    currency: 'USD',
    category: 'Stocks',
    portfolio: 'internacional',
  },
  {
    id: 'i2',
    name: 'Vanguard S&P 500 ETF',
    ticker: 'VOO',
    quantity: '8',
    averagePrice: '420.00',
    currency: 'USD',
    category: 'ETFs',
    portfolio: 'internacional',
  },
  {
    id: 'c1',
    name: 'Bitcoin',
    ticker: 'BTC',
    quantity: '0.45',
    averagePrice: '45000.00',
    currency: 'USD',
    category: 'BTC',
    portfolio: 'cripto',
  },
  {
    id: 'c2',
    name: 'Ethereum',
    ticker: 'ETH',
    quantity: '3.5',
    averagePrice: '2400.00',
    currency: 'USD',
    category: 'Altcoin',
    portfolio: 'cripto',
  },
];

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE_PATH);
  } catch {
    // File doesn't exist, create it with initial seed assets
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(INITIAL_ASSETS, null, 2), 'utf8');
  }
}

export async function getAssets(portfolio?: 'brasil' | 'internacional' | 'cripto' | 'all') {
  await ensureDataFile();
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    const assets: Asset[] = JSON.parse(data);
    if (!portfolio || portfolio === 'all') {
      return assets;
    }
    return assets.filter((asset) => asset.portfolio === portfolio);
  } catch (error) {
    console.error('Failed to read assets database:', error);
    return [];
  }
}

export async function addAsset(assetData: Omit<Asset, 'id'>) {
  await ensureDataFile();
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    const assets: Asset[] = JSON.parse(data);
    const newAsset: Asset = {
      ...assetData,
      id: Math.random().toString(36).substring(2, 9),
    };
    assets.push(newAsset);
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(assets, null, 2), 'utf8');
    return newAsset;
  } catch (error) {
    console.error('Failed to add asset:', error);
    throw new Error('Could not add asset to database');
  }
}

export async function updateAsset(id: string, assetData: Partial<Omit<Asset, 'id'>>) {
  await ensureDataFile();
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    let assets: Asset[] = JSON.parse(data);
    let updatedAsset: Asset | null = null;
    assets = assets.map((asset) => {
      if (asset.id === id) {
        updatedAsset = { ...asset, ...assetData };
        return updatedAsset;
      }
      return asset;
    });
    if (!updatedAsset) {
      throw new Error('Asset not found');
    }
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(assets, null, 2), 'utf8');
    return updatedAsset;
  } catch (error) {
    console.error('Failed to update asset:', error);
    throw new Error('Could not update asset in database');
  }
}

export async function deleteAsset(id: string) {
  await ensureDataFile();
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    const assets: Asset[] = JSON.parse(data);
    const filteredAssets = assets.filter((asset) => asset.id !== id);
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(filteredAssets, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete asset:', error);
    throw new Error('Could not delete asset from database');
  }
}
