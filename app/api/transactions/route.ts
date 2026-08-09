import { NextRequest, NextResponse } from 'next/server';
import { getTransactions, saveTransactionsForPortfolio } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ transactions: [] });
    }
    const { searchParams } = new URL(req.url);
    const portfolio = (searchParams.get('portfolio') as 'cripto') || 'cripto';
    
    const transactions = await getTransactions(portfolio, sessionUser.id);
    return NextResponse.json({ transactions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { portfolio, transactions } = body;

    if (!portfolio || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Invalid payload. Expects { portfolio, transactions }' }, { status: 400 });
    }

    const saved = await saveTransactionsForPortfolio(portfolio, transactions, sessionUser.id);
    return NextResponse.json({ success: true, transactions: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save transactions' }, { status: 500 });
  }
}
