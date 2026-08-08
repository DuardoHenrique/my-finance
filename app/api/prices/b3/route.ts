import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get('tickers') || '';

  if (!tickersParam) {
    return NextResponse.json({ prices: {} });
  }

  const tickers = tickersParam.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);
  const prices: Record<string, number> = {};

  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        // Exclude Renda Fixa items like CDB or Tesouro Direto from Yahoo stock query
        if (ticker.startsWith('CDB') || ticker.startsWith('TESOURO') || ticker.includes('CDI')) {
          return;
        }

        const formattedTicker = ticker.endsWith('.SA') ? ticker : `${ticker}.SA`;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(formattedTicker)}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          next: { revalidate: 60 }, // Cache for 60s
        });

        if (res.ok) {
          const data = await res.json();
          const meta = data.chart?.result?.[0]?.meta;
          if (meta && typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
            prices[ticker] = meta.regularMarketPrice;
          }
        }
      } catch (err) {
        console.error(`Error fetching Yahoo price for ${ticker}:`, err);
      }
    })
  );

  return NextResponse.json({ prices });
}
