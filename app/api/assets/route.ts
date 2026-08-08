import { NextResponse } from 'next/server';
import { getAssets } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ assets: [] });
    }
    const assets = await getAssets('all', sessionUser.id);
    return NextResponse.json({ assets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch assets' }, { status: 500 });
  }
}
