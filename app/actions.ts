'use server';

import { revalidatePath } from 'next/cache';
import { getAssets, addAsset, updateAsset, deleteAsset, Asset } from '@/lib/db';

export async function fetchAssetsAction(portfolio?: 'brasil' | 'internacional' | 'cripto' | 'all') {
  return await getAssets(portfolio);
}

export async function addAssetAction(assetData: Omit<Asset, 'id'>) {
  const result = await addAsset(assetData);
  revalidatePath('/');
  revalidatePath('/brasil');
  revalidatePath('/internacional');
  revalidatePath('/cripto');
  return result;
}

export async function updateAssetAction(id: string, assetData: Partial<Omit<Asset, 'id'>>) {
  const result = await updateAsset(id, assetData);
  revalidatePath('/');
  revalidatePath('/brasil');
  revalidatePath('/internacional');
  revalidatePath('/cripto');
  return result;
}

export async function deleteAssetAction(id: string) {
  const result = await deleteAsset(id);
  revalidatePath('/');
  revalidatePath('/brasil');
  revalidatePath('/internacional');
  revalidatePath('/cripto');
  return result;
}
