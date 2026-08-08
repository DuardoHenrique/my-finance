import { calculateAssetUSDValue, calculatePortfolioMetrics } from './calculations';
import { Asset } from '@/lib/db';

function assertEqual(actual: any, expected: any, message: string) {
  if (Math.abs(Number(actual) - Number(expected)) > 0.001) {
    throw new Error(`TEST FAILED: ${message}. Expected ${expected}, got ${actual}`);
  }
}

export function runPortfolioCalculationTests() {
  const exchangeRate = 5.0; // 1 USD = 5.0 BRL

  const mockAssets: Asset[] = [
    {
      id: '1',
      userId: 'usr_1',
      name: 'Petrobras',
      ticker: 'PETR4',
      quantity: '100',
      averagePrice: '30.00', // 3000 BRL = 600 USD
      currency: 'BRL',
      category: 'Ações',
      portfolio: 'brasil',
    },
    {
      id: '2',
      userId: 'usr_1',
      name: 'Apple',
      ticker: 'AAPL',
      quantity: '10',
      averagePrice: '150.00', // 1500 USD
      currency: 'USD',
      category: 'Ações',
      portfolio: 'internacional',
    },
    {
      id: '3',
      userId: 'usr_1',
      name: 'Bitcoin',
      ticker: 'BTC',
      quantity: '0.1',
      averagePrice: '60000.00', // 6000 USD
      currency: 'USD',
      category: 'Cripto',
      portfolio: 'cripto',
    },
  ];

  // Test 1: BRL Asset USD value
  const valBrl = calculateAssetUSDValue(mockAssets[0], exchangeRate);
  assertEqual(valBrl, 600, 'BRL Asset USD conversion');

  // Test 2: USD Asset USD value
  const valUsd = calculateAssetUSDValue(mockAssets[1], exchangeRate);
  assertEqual(valUsd, 1500, 'USD Asset USD conversion');

  // Test 3: Total Portfolio Metrics
  const metrics = calculatePortfolioMetrics(mockAssets, exchangeRate);
  assertEqual(metrics.brasilUSD, 600, 'Brasil USD total');
  assertEqual(metrics.internacionalUSD, 1500, 'Internacional USD total');
  assertEqual(metrics.criptoUSD, 6000, 'Cripto USD total');
  assertEqual(metrics.totalPortfolioUSD, 8100, 'Total Portfolio USD');

  // Test 4: Percentages
  assertEqual(metrics.pctBrasil, (600 / 8100) * 100, 'Brasil percentage');
  assertEqual(metrics.pctIntl, (1500 / 8100) * 100, 'International percentage');
  assertEqual(metrics.pctCripto, (6000 / 8100) * 100, 'Cripto percentage');

  // Test 5: Empty Portfolio
  const emptyMetrics = calculatePortfolioMetrics([], exchangeRate);
  assertEqual(emptyMetrics.totalPortfolioUSD, 0, 'Empty portfolio total');
  assertEqual(emptyMetrics.pctBrasil, 0, 'Empty portfolio percentage');

  console.log('✅ All portfolio calculation tests passed successfully.');
}
