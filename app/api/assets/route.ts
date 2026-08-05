import { NextResponse } from 'next/server';
import { getAssets } from '@/lib/db';

export async function GET() {
  try {
    const assets = await getAssets('all');
    return NextResponse.json({ assets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch assets' }, { status: 500 });
  }
}
