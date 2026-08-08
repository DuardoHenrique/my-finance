import * as XLSX from 'xlsx';

export interface ExtractedInternationalAsset {
  id: string;
  ticker: string;
  name: string;
  category: 'Stocks' | 'ETFs' | 'REITs';
  quantity: number;
  averagePrice: number; // in USD
  currentPrice: number; // in USD
  totalValue: number; // in USD
  institution?: string;
  selected: boolean;
}

export interface InternationalParseResult {
  success: boolean;
  assets: ExtractedInternationalAsset[];
  warnings: string[];
  totalFound: number;
}

const STOP_WORDS = new Set([
  'TOTAL', 'NAME', 'TYPE', 'DATE', 'USD', 'BRL', 'BUY', 'SELL', 'CASH', 
  'PRICE', 'ASSET', 'VALUE', 'DATA', 'REPORTS', 'CONTA', 'SALDO', 'STOCKS', 
  'ETFS', 'REITS', 'AÇÕES', 'ACOES', 'TITULO', 'MOEDA', 'TICKER', 'SIMBOLO', 
  'SYMBOL', 'QTY', 'QUANTIDADE', 'ITEM', 'TOTALS', 'SUMMARY', 'PORTFOLIO'
]);

const KNOWN_REITS = new Set([
  'O', 'MAIN', 'STAG', 'VICI', 'AMT', 'PLD', 'EQIX', 'SPG', 'AGNC', 'NLY', 
  'ADC', 'NNN', 'WPC', 'BXP', 'ARE', 'OHI', 'EPR', 'HIW', 'STOR', 'MPW'
]);

const KNOWN_ETFS = new Set([
  'VOO', 'QQQ', 'VTI', 'SCHD', 'IVV', 'SPY', 'IWM', 'VXUS', 'BND', 'VUG', 
  'VYM', 'JEPI', 'JEPQ', 'VEA', 'VWO', 'VNQ', 'GLD', 'SLV', 'TLT', 'VT',
  'XLE', 'XLF', 'XLK', 'XLV', 'XLP', 'XLU', 'XLI', 'XLC', 'XLB', 'XRT'
]);

function isValidUsTicker(t: string): boolean {
  if (!t) return false;
  const upper = t.toUpperCase().trim();
  if (STOP_WORDS.has(upper)) return false;
  return /^[A-Z]{1,5}(\.[A-Z]{1,2}|-[A-Z]{1,2})?$/.test(upper);
}

function cleanNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = String(val).trim();
  str = str.replace(/US\$\s?|\$\s?|R\$\s?/gi, '').replace(/\s+/g, '');
  if (str === '-' || str === '') return 0;
  
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function inferCategory(ticker: string, name: string, typeStr: string = ''): 'Stocks' | 'ETFs' | 'REITs' {
  const upperTicker = ticker.toUpperCase().trim();
  const upperName = name.toUpperCase().trim();
  const upperType = typeStr.toUpperCase().trim();

  if (KNOWN_REITS.has(upperTicker) || upperName.includes('REIT') || upperName.includes('REALTY') || upperName.includes('REAL ESTATE') || upperType.includes('REIT')) {
    return 'REITs';
  }

  if (KNOWN_ETFS.has(upperTicker) || upperName.includes('ETF') || upperName.includes('INDEX') || upperName.includes('VANGUARD') || upperName.includes('ISHARES') || upperName.includes('INVESCO') || upperType.includes('ETF')) {
    return 'ETFs';
  }

  return 'Stocks';
}

function cleanName(rawName: string, ticker: string): string {
  if (!rawName || rawName.trim() === '') return ticker;
  let cleaned = rawName.trim();
  const tickerPrefixRegex = new RegExp(`^${ticker}\\s*-\\s*`, 'i');
  cleaned = cleaned.replace(tickerPrefixRegex, '').trim();
  return cleaned || ticker;
}

export async function parseInternationalExcelFile(file: File): Promise<InternationalParseResult> {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });

    const assetsMap = new Map<string, ExtractedInternationalAsset>();
    const warnings: string[] = [];

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        assets: [],
        warnings: ['O arquivo Excel não contém planilhas com dados válidos.'],
        totalFound: 0,
      };
    }

    // Skip non-position sheets
    let validSheets = workbook.SheetNames.filter((sheetName) => {
      const norm = sheetName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      return !norm.includes('provento') &&
             !norm.includes('dividend') &&
             !norm.includes('historico') &&
             !norm.includes('statement') &&
             !norm.includes('transaction') &&
             !norm.includes('movimentac') &&
             !norm.includes('operac') &&
             !norm.includes('activity');
    });

    if (validSheets.length === 0) {
      validSheets = workbook.SheetNames;
    }

    for (const sheetName of validSheets) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;

      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
      if (rows.length === 0) continue;

      let headerRowIdx = -1;
      let colIndices = {
        ticker: -1,
        name: -1,
        quantity: -1,
        avgPrice: -1,
        currentPrice: -1,
        total: -1,
        type: -1,
        institution: -1,
      };

      for (let i = 0; i < Math.min(rows.length, 25); i++) {
        const row = rows[i];
        const rowStr = row.map(c => String(c).toLowerCase()).join(' | ');

        if (
          rowStr.includes('ticker') || rowStr.includes('symbol') || rowStr.includes('código') ||
          rowStr.includes('codigo') || rowStr.includes('ativo') || rowStr.includes('asset') ||
          rowStr.includes('quantity') || rowStr.includes('qtd') || rowStr.includes('shares')
        ) {
          headerRowIdx = i;
          row.forEach((cell, colIdx) => {
            const cStr = String(cell).toLowerCase().trim();

            // Ticker / Symbol
            if (cStr === 'ticker' || cStr === 'symbol' || cStr === 'símbolo' || cStr === 'simbolo' || cStr === 'código' || cStr === 'codigo' || cStr === 'ativo') {
              colIndices.ticker = colIdx;
            } else if (colIndices.ticker === -1 && (cStr.includes('ticker') || cStr.includes('symbol') || cStr.includes('código')) && !cStr.includes('isin')) {
              colIndices.ticker = colIdx;
            }

            // Name / Description
            if (cStr.includes('name') || cStr.includes('nome') || cStr.includes('description') || cStr.includes('descrição') || cStr.includes('empresa') || cStr.includes('security') || cStr.includes('ativo')) {
              if (colIndices.name === -1) colIndices.name = colIdx;
            }

            // Quantity / Shares
            if (cStr === 'quantity' || cStr === 'qtd' || cStr === 'shares' || cStr === 'qty' || cStr === 'posição' || cStr === 'posicao') {
              colIndices.quantity = colIdx;
            } else if (colIndices.quantity === -1 && (cStr.includes('quantity') || cStr.includes('quantidade') || cStr.includes('shares') || cStr.includes('qtd'))) {
              colIndices.quantity = colIdx;
            }

            // Average Price / Cost basis
            if (cStr.includes('preço médio') || cStr.includes('preco medio') || cStr.includes('average price') || cStr.includes('avg price') || cStr.includes('cost basis') || cStr.includes('preço de custo') || cStr.includes('custo de aquisição')) {
              colIndices.avgPrice = colIdx;
            }

            // Current Price / Closing price
            if (cStr.includes('preço atual') || cStr.includes('preco atual') || cStr.includes('current price') || cStr.includes('market price') || cStr.includes('preço de fechamento') || cStr.includes('last price')) {
              colIndices.currentPrice = colIdx;
            } else if (colIndices.avgPrice === -1 && (cStr.includes('preço') || cStr.includes('price') || cStr.includes('custo'))) {
              colIndices.avgPrice = colIdx;
            }

            // Total Value / Market Value
            if (cStr.includes('valor total') || cStr.includes('total value') || cStr.includes('market value') || cStr.includes('valor atual') || cStr.includes('posição em usd') || cStr.includes('posicao em usd') || cStr.includes('total')) {
              colIndices.total = colIdx;
            }

            // Institution / Broker
            if (cStr.includes('instituição') || cStr.includes('instituicao') || cStr.includes('corretora') || cStr.includes('broker') || cStr.includes('banco')) {
              colIndices.institution = colIdx;
            }

            // Category / Type
            if (cStr.includes('tipo') || cStr.includes('categoria') || cStr.includes('type') || cStr.includes('class')) {
              colIndices.type = colIdx;
            }
          });
          break;
        }
      }

      const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

      for (let r = startRow; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        let ticker = '';
        let name = '';
        let quantity = 0;
        let avgPrice = 0;
        let currentPrice = 0;
        let totalValue = 0;
        let institution = '';
        let typeStr = '';

        // Ticker extraction
        if (colIndices.ticker >= 0 && row[colIndices.ticker]) {
          const rawCell = String(row[colIndices.ticker]).trim();
          if (isValidUsTicker(rawCell)) {
            ticker = rawCell.toUpperCase();
          }
        }

        if (colIndices.name >= 0 && row[colIndices.name]) {
          name = String(row[colIndices.name]).trim();
          if (!ticker) {
            const parts = name.split(/[\s\-,]+/);
            for (const p of parts) {
              if (isValidUsTicker(p)) {
                ticker = p.toUpperCase();
                break;
              }
            }
          }
        }

        if (!ticker) {
          for (const cell of row) {
            const strCell = String(cell).trim();
            if (isValidUsTicker(strCell)) {
              ticker = strCell.toUpperCase();
              break;
            }
          }
        }

        if (!ticker || !isValidUsTicker(ticker)) continue;

        if (colIndices.quantity >= 0 && row[colIndices.quantity] !== undefined) {
          quantity = cleanNumber(row[colIndices.quantity]);
        }
        if (colIndices.avgPrice >= 0 && row[colIndices.avgPrice] !== undefined) {
          avgPrice = cleanNumber(row[colIndices.avgPrice]);
        }
        if (colIndices.currentPrice >= 0 && row[colIndices.currentPrice] !== undefined) {
          currentPrice = cleanNumber(row[colIndices.currentPrice]);
        }
        if (colIndices.total >= 0 && row[colIndices.total] !== undefined) {
          totalValue = cleanNumber(row[colIndices.total]);
        }
        if (colIndices.type >= 0 && row[colIndices.type]) {
          typeStr = String(row[colIndices.type]).trim();
        }
        if (colIndices.institution >= 0 && row[colIndices.institution]) {
          institution = String(row[colIndices.institution]).trim();
        }

        // Calculations & fallbacks
        if (avgPrice === 0 && totalValue > 0 && quantity > 0) {
          avgPrice = totalValue / quantity;
        }
        if (currentPrice === 0) {
          currentPrice = avgPrice;
        }
        if (totalValue === 0 && currentPrice > 0 && quantity > 0) {
          totalValue = currentPrice * quantity;
        }

        const finalName = cleanName(name, ticker);
        const category = inferCategory(ticker, finalName, typeStr);

        if (assetsMap.has(ticker)) {
          const existing = assetsMap.get(ticker)!;
          if (existing.quantity === quantity && Math.abs(existing.averagePrice - avgPrice) < 0.01) {
            continue;
          }
          const newQty = existing.quantity + quantity;
          const newTotal = existing.totalValue + totalValue;
          existing.quantity = newQty;
          existing.totalValue = parseFloat(newTotal.toFixed(2));
          existing.averagePrice = newQty > 0 ? parseFloat((newTotal / newQty).toFixed(2)) : existing.averagePrice;
          existing.currentPrice = currentPrice || existing.currentPrice;
        } else {
          assetsMap.set(ticker, {
            id: `intl-${ticker}-${Math.random().toString(36).substring(2, 7)}`,
            ticker,
            name: finalName,
            category,
            quantity,
            averagePrice: parseFloat(avgPrice.toFixed(2)),
            currentPrice: parseFloat((currentPrice || avgPrice).toFixed(2)),
            totalValue: parseFloat(totalValue.toFixed(2)),
            institution,
            selected: true,
          });
        }
      }
    }

    const extractedAssets = Array.from(assetsMap.values());

    if (extractedAssets.length === 0) {
      warnings.push('Nenhum ativo internacional foi identificado no arquivo enviado. Verifique se o relatório contém ativos como Stocks, ETFs ou REITs.');
    }

    return {
      success: extractedAssets.length > 0,
      assets: extractedAssets,
      warnings,
      totalFound: extractedAssets.length,
    };
  } catch (error: any) {
    console.error('Erro ao processar arquivo internacional:', error);
    return {
      success: false,
      assets: [],
      warnings: [`Erro ao ler arquivo Excel: ${error?.message || 'Arquivo inválido'}`],
      totalFound: 0,
    };
  }
}
