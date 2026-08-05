'use server';

import { db } from '@/lib/db';
import { assets, transactions, dividends } from '@/lib/db/schema';
import { eq, sum } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Mock data fallback
const mockAssets = [
  { id: '1', segment: 'brasil', name: 'Petrobras', ticker: 'PETR4', category: 'Ações', currency: 'BRL', quantity: '100', averagePrice: '25.50', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', segment: 'internacional', name: 'Apple', ticker: 'AAPL', category: 'Stocks', currency: 'USD', quantity: '10', averagePrice: '150.00', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', segment: 'cripto', name: 'Bitcoin', ticker: 'BTC', category: 'BTC', currency: 'USD', quantity: '0.5', averagePrice: '40000', notes: '', createdAt: new Date(), updatedAt: new Date() },
];

export async function getAssets(segment?: string) {
  if (!db) {
    console.log('No DB connected, using mock DB for assets');
    if (segment) return mockAssets.filter(a => a.segment === segment);
    return mockAssets;
  }
  
  if (segment) {
    return await db.select().from(assets).where(eq(assets.segment, segment)).orderBy(assets.name);
  }
  return await db.select().from(assets).orderBy(assets.name);
}

export async function addAsset(data: any) {
  if (!db) {
    console.log('No DB connected, mock asset added', data);
    return { success: true, id: Math.random().toString() };
  }

  const result = await db.insert(assets).values({
    id: Math.random().toString(36).substring(7),
    ...data,
  }).returning();
  
  revalidatePath('/');
  revalidatePath(`/${data.segment}`);
  return { success: true, data: result[0] };
}

export async function deleteAsset(id: string) {
  if (!db) {
    console.log('No DB connected, mock asset deleted', id);
    return { success: true };
  }

  await db.delete(assets).where(eq(assets.id, id));
  revalidatePath('/');
  return { success: true };
}
