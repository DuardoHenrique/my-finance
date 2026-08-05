import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids') || 'bitcoin';
  const vs_currencies = searchParams.get('vs_currencies') || 'usd';

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}`, {
        next: { revalidate: 120 } // Cache for 2 mins (120s)
    });
    
    if (!res.ok) {
        throw new Error('Failed to fetch from CoinGecko');
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}
