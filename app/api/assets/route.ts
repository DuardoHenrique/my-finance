import { NextRequest, NextResponse } from 'next/server';
import { getAssets, savePortfolioAssets } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ assets: [] });
    }
    const { searchParams } = new URL(req.url);
    const portfolio = searchParams.get('portfolio') as 'brasil' | 'internacional' | 'cripto' | 'all' | null;
    
    const assets = await getAssets(portfolio || 'all', sessionUser.id);
    return NextResponse.json({ assets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { portfolio, assets } = body;

    if (!portfolio || !Array.isArray(assets)) {
      return NextResponse.json({ error: 'Invalid payload. Expects { portfolio, assets }' }, { status: 400 });
    }

    const saved = await savePortfolioAssets(portfolio, assets, sessionUser.id);
    return NextResponse.json({ success: true, assets: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save assets' }, { status: 500 });
  }
}

