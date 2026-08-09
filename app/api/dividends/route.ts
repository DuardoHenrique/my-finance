import { NextRequest, NextResponse } from 'next/server';
import { getDividends, saveDividendsForPortfolio } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ dividends: [] });
    }
    const { searchParams } = new URL(req.url);
    const portfolio = searchParams.get('portfolio') as 'brasil' | 'internacional' | null;
    
    const dividends = await getDividends(portfolio || undefined, sessionUser.id);
    return NextResponse.json({ dividends });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch dividends' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { portfolio, dividends } = body;

    if (!portfolio || !Array.isArray(dividends)) {
      return NextResponse.json({ error: 'Invalid payload. Expects { portfolio, dividends }' }, { status: 400 });
    }

    const saved = await saveDividendsForPortfolio(portfolio, dividends, sessionUser.id);
    return NextResponse.json({ success: true, dividends: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save dividends' }, { status: 500 });
  }
}
