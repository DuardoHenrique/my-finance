import { Asset } from '@/lib/db';

export interface PortfolioMetrics {
  brasilUSD: number;
  internacionalUSD: number;
  criptoUSD: number;
  totalPortfolioUSD: number;
  pctBrasil: number;
  pctIntl: number;
  pctCripto: number;
}

/**
 * Calculates the USD value of a single asset based on quantity, averagePrice, native currency, and exchange rate.
 * @param asset The asset object
 * @param exchangeRate Current USD/BRL exchange rate (e.g. 5.75 means 1 USD = 5.75 BRL)
 */
export function calculateAssetUSDValue(asset: Asset, exchangeRate: number): number {
  const qty = Number(asset.quantity) || 0;
  const currentP = typeof asset.currentPrice === 'number' && asset.currentPrice > 0 ? asset.currentPrice : null;
  const price = currentP ?? (Number(asset.averagePrice) || 0);
  const nativeValue = qty * price;
  const assetCurrency = asset.currency || (asset.portfolio === 'brasil' ? 'BRL' : 'USD');

  if (assetCurrency === 'USD') {
    return nativeValue;
  }

  return exchangeRate > 0 ? nativeValue / exchangeRate : 0;
}

/**
 * Calculates metrics and segment totals in USD for a given list of assets.
 */
export function calculatePortfolioMetrics(assets: Asset[], exchangeRate: number): PortfolioMetrics {
  let brasilUSD = 0;
  let internacionalUSD = 0;
  let criptoUSD = 0;

  for (const asset of assets) {
    const valUSD = calculateAssetUSDValue(asset, exchangeRate);
    if (asset.portfolio === 'brasil') {
      brasilUSD += valUSD;
    } else if (asset.portfolio === 'internacional') {
      internacionalUSD += valUSD;
    } else if (asset.portfolio === 'cripto') {
      criptoUSD += valUSD;
    }
  }

  const totalPortfolioUSD = brasilUSD + internacionalUSD + criptoUSD;
  const pctBrasil = totalPortfolioUSD > 0 ? (brasilUSD / totalPortfolioUSD) * 100 : 0;
  const pctIntl = totalPortfolioUSD > 0 ? (internacionalUSD / totalPortfolioUSD) * 100 : 0;
  const pctCripto = totalPortfolioUSD > 0 ? (criptoUSD / totalPortfolioUSD) * 100 : 0;

  return {
    brasilUSD,
    internacionalUSD,
    criptoUSD,
    totalPortfolioUSD,
    pctBrasil,
    pctIntl,
    pctCripto,
  };
}
