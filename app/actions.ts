'use server';

import { revalidatePath } from 'next/cache';
import { getAssets, addAsset, updateAsset, deleteAsset, Asset } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function fetchAssetsAction(portfolio?: 'brasil' | 'internacional' | 'cripto' | 'all') {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return [];
  return await getAssets(portfolio, sessionUser.id);
}

export async function addAssetAction(assetData: Omit<Asset, 'id'>) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error('Não autorizado: Faça login para adicionar ativos.');
  }

  const dataWithUser: Omit<Asset, 'id'> = {
    ...assetData,
    userId: sessionUser.id,
  };

  const result = await addAsset(dataWithUser);
  revalidatePath('/');
  revalidatePath('/brasil');
  revalidatePath('/internacional');
  revalidatePath('/cripto');
  return result;
}

export async function updateAssetAction(id: string, assetData: Partial<Omit<Asset, 'id'>>) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error('Não autorizado');
  }
  const result = await updateAsset(id, assetData, sessionUser.id);
  revalidatePath('/');
  revalidatePath('/brasil');
  revalidatePath('/internacional');
  revalidatePath('/cripto');
  return result;
}

export async function deleteAssetAction(id: string) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error('Não autorizado');
  }
  const result = await deleteAsset(id, sessionUser.id);
  revalidatePath('/');
  revalidatePath('/brasil');
  revalidatePath('/internacional');
  revalidatePath('/cripto');
  return result;
}
