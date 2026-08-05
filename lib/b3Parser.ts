import * as XLSX from 'xlsx';

export interface ExtractedB3Asset {
  id: string;
  ticker: string;
  name: string;
  category: 'Ações' | 'FIIs' | 'Renda Fixa';
  quantity: number;
  averagePrice: number;
  totalValue: number;
  date?: string;
  institution?: string;
  selected: boolean;
}

export interface B3ParseResult {
  success: boolean;
  assets: ExtractedB3Asset[];
  warnings: string[];
  totalFound: number;
}

// Regex to detect Brazilian Tickers (e.g. PETR4, VALE3, MXRF11, BBDC4, LFT2029)
const TICKER_REGEX = /\b([A-Z]{4}(?:3|4|5|6|11|34|35))\b/i;

function cleanNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = String(val).trim();
  // Remove currency symbol, spaces, etc.
  str = str.replace(/R\$\s?/gi, '').replace(/\s+/g, '');
  
  // Format check: Brazilian "1.234,56" vs English "1,234.56"
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // 1.234,56 -> 1234.56
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,234.56 -> 1234.56
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // 1234,56 -> 1234.56
    str = str.replace(',', '.');
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

const KNOWN_UNITS = new Set(['TAEE11', 'KLBN11', 'SAPR11', 'SANB11', 'ALUP11', 'BPAC11', 'ENGI11', 'TIET11', 'SOMA11']);

function inferCategory(ticker: string, name: string, typeStr: string = ''): 'Ações' | 'FIIs' | 'Renda Fixa' {
  const upperTicker = ticker.toUpperCase();
  const upperName = name.toUpperCase();
  const upperType = typeStr.toUpperCase();

  if (upperTicker.startsWith('LFT') || upperTicker.startsWith('NTNB') || upperTicker.startsWith('LTN') || upperName.includes('TESOURO') || upperName.includes('CDB') || upperName.includes('DEBENTURE')) {
    return 'Renda Fixa';
  }

  // Known stock units
  if (KNOWN_UNITS.has(upperTicker) || upperType.includes('UNIT') || upperType.includes('ON') || upperType.includes('PN')) {
    return 'Ações';
  }

  if (
    upperName.includes('FII') || 
    upperName.includes('FUNDO IMOBILIARIO') || 
    upperName.includes('FUNDO IMOB') || 
    upperName.includes('INVESTIMENTO IMOBILIARIO') ||
    upperName.includes('IMOB') ||
    upperType.includes('FII') ||
    (upperTicker.endsWith('11') && !KNOWN_UNITS.has(upperTicker) && !upperName.includes('S.A.') && !upperName.includes('SA'))
  ) {
    return 'FIIs';
  }

  return 'Ações';
}

function cleanName(rawName: string, ticker: string): string {
  if (!rawName || rawName.trim() === '') return ticker;
  
  let cleaned = rawName.trim();

  // If name starts with "TICKER - ", remove the ticker prefix for a cleaner company name
  const tickerPrefixRegex = new RegExp(`^${ticker}\\s*-\\s*`, 'i');
  cleaned = cleaned.replace(tickerPrefixRegex, '');

  // Clean prefix noise from B3 export descriptions
  cleaned = cleaned
    .replace(/^FRAC\s+-\s+/i, '')
    .replace(/^ON\s+-\s+/i, '')
    .replace(/^PN\s+-\s+/i, '')
    .replace(/^UNT\s+-\s+/i, '')
    .trim();

  return cleaned || ticker;
}

export async function parseB3ExcelFile(file: File): Promise<B3ParseResult> {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });

    const assetsMap = new Map<string, ExtractedB3Asset>();
    const warnings: string[] = [];

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        assets: [],
        warnings: ['O arquivo Excel não contém planilhas com dados válidos.'],
        totalFound: 0,
      };
    }

    // Identify position sheets and skip non-position sheets (proventos, histórico, negociação)
    let validSheets = workbook.SheetNames.filter((sheetName) => {
      const lower = sheetName.toLowerCase();
      return !lower.includes('provento') &&
             !lower.includes('rendimento') &&
             !lower.includes('dividendo') &&
             !lower.includes('jcp') &&
             !lower.includes('histórico') &&
             !lower.includes('historico') &&
             !lower.includes('negociação') &&
             !lower.includes('negociacao') &&
             !lower.includes('movimentação') &&
             !lower.includes('movimentacao') &&
             !lower.includes('eventos');
    });

    // Fallback: If filtering removed all sheets, use all sheets
    if (validSheets.length === 0) {
      validSheets = workbook.SheetNames;
    }

    for (const sheetName of validSheets) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;

      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });

      if (rows.length === 0) continue;

      // Find header row dynamically
      let headerRowIdx = -1;
      let colIndices = {
        ticker: -1,
        name: -1,
        quantity: -1,
        price: -1,
        total: -1,
        type: -1,
        date: -1,
        institution: -1,
      };

      for (let i = 0; i < Math.min(rows.length, 25); i++) {
        const row = rows[i];
        const rowStr = row.map(c => String(c).toLowerCase()).join(' | ');

        if (
          rowStr.includes('código') || rowStr.includes('codigo') || rowStr.includes('produto') ||
          rowStr.includes('empresa') || rowStr.includes('ativo') || rowStr.includes('ticker') ||
          rowStr.includes('quantidade') || rowStr.includes('qtd') || rowStr.includes('posição') ||
          rowStr.includes('posicao')
        ) {
          headerRowIdx = i;
          row.forEach((cell, colIdx) => {
            const cStr = String(cell).toLowerCase().trim();

            // Ticker: Prioritize exact 'código de negociação' or 'ticker', exclude ISIN
            if (cStr === 'código de negociação' || cStr === 'codigo de negociacao' || cStr === 'ticker' || cStr === 'código do ativo') {
              colIndices.ticker = colIdx;
            } else if (colIndices.ticker === -1 && (cStr.includes('código') || cStr.includes('codigo') || cStr.includes('ticker')) && !cStr.includes('isin')) {
              colIndices.ticker = colIdx;
            }

            // Name
            if (cStr.includes('produto') || cStr.includes('empresa') || cStr.includes('especificação') || cStr.includes('razão social') || cStr.includes('nome')) {
              if (colIndices.name === -1) colIndices.name = colIdx;
            }

            // Quantity: Prioritize exact 'quantidade' or 'quantidade disponível', exclude 'indisponível' or 'bloqueada'
            if (cStr === 'quantidade' || cStr === 'qtd') {
              colIndices.quantity = colIdx;
            } else if (colIndices.quantity === -1 && cStr.includes('quantidade disponível')) {
              colIndices.quantity = colIdx;
            } else if (colIndices.quantity === -1 && (cStr.includes('quantidade') || cStr.includes('qtd') || cStr.includes('quant')) && !cStr.includes('indisponível') && !cStr.includes('indisponivel') && !cStr.includes('bloqueada')) {
              colIndices.quantity = colIdx;
            }

            // Price (Unit price or Closing price or Avg price)
            if (cStr.includes('preço de fechamento') || cStr.includes('preco de fechamento') || cStr.includes('preço médio') || cStr.includes('preco medio') || cStr.includes('custo médio') || cStr.includes('custo de aquisição') || cStr.includes('valor unitario') || cStr.includes('preço unitário')) {
              colIndices.price = colIdx;
            } else if (colIndices.price === -1 && (cStr.includes('preço') || cStr.includes('preco') || cStr.includes('custo'))) {
              colIndices.price = colIdx;
            }

            // Total Value
            if (cStr.includes('valor atualizado') || cStr.includes('valor total') || cStr.includes('posição em r$') || cStr.includes('posicao em r$') || cStr.includes('valor atual')) {
              colIndices.total = colIdx;
            }

            // Institution / Corretora
            if (cStr.includes('instituição') || cStr.includes('instituicao') || cStr.includes('corretora')) {
              colIndices.institution = colIdx;
            }

            // Category / Type
            if (cStr.includes('tipo') || cStr.includes('categoria') || cStr.includes('mercado')) {
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
        let price = 0;
        let totalValue = 0;
        let dateStr = '';
        let institution = '';

        // Extract ticker from assigned column or fuzzy scan row
        if (colIndices.ticker >= 0 && row[colIndices.ticker]) {
          const rawCell = String(row[colIndices.ticker]).trim();
          const match = rawCell.match(TICKER_REGEX);
          if (match) ticker = match[1].toUpperCase();
        }

        // Extract name
        if (colIndices.name >= 0 && row[colIndices.name]) {
          name = String(row[colIndices.name]).trim();
          if (!ticker) {
            const matchInName = name.match(TICKER_REGEX);
            if (matchInName) ticker = matchInName[1].toUpperCase();
          }
        }

        // If ticker is still empty, scan whole row for a valid ticker
        if (!ticker) {
          for (const cell of row) {
            const match = String(cell).match(TICKER_REGEX);
            if (match) {
              ticker = match[1].toUpperCase();
              break;
            }
          }
        }

        if (!ticker) continue; // Skip non-asset rows (summaries, headers, etc)

        // Extract numbers
        if (colIndices.quantity >= 0 && row[colIndices.quantity] !== undefined) {
          quantity = cleanNumber(row[colIndices.quantity]);
        }
        if (colIndices.price >= 0 && row[colIndices.price] !== undefined) {
          price = cleanNumber(row[colIndices.price]);
        }
        if (colIndices.total >= 0 && row[colIndices.total] !== undefined) {
          totalValue = cleanNumber(row[colIndices.total]);
        }
        if (colIndices.date >= 0 && row[colIndices.date]) {
          dateStr = String(row[colIndices.date]).trim();
        }
        let typeStr = '';
        if (colIndices.type >= 0 && row[colIndices.type]) {
          typeStr = String(row[colIndices.type]).trim();
        }
        if (colIndices.institution >= 0 && row[colIndices.institution]) {
          institution = String(row[colIndices.institution]).trim();
        }

        // Auto-fix missing price or total
        if (price === 0 && totalValue > 0 && quantity > 0) {
          price = totalValue / quantity;
        } else if (totalValue === 0 && price > 0 && quantity > 0) {
          totalValue = price * quantity;
        }

        // Fix if totalValue was mistakenly put into price
        if (quantity > 1 && price > 0 && totalValue > 0 && Math.abs(price - totalValue) < 0.01) {
          price = totalValue / quantity;
        }

        // Clean name
        const finalName = cleanName(name, ticker);
        const category = inferCategory(ticker, finalName, typeStr);

        // Aggregate if duplicate ticker found in sheet
        if (assetsMap.has(ticker)) {
          const existing = assetsMap.get(ticker)!;
          const newQty = existing.quantity + quantity;
          const newTotal = existing.totalValue + totalValue;
          existing.quantity = newQty;
          existing.totalValue = newTotal;
          existing.averagePrice = newQty > 0 ? parseFloat((newTotal / newQty).toFixed(2)) : existing.averagePrice;
        } else {
          assetsMap.set(ticker, {
            id: `b3-${ticker}-${Math.random().toString(36).substring(2, 7)}`,
            ticker,
            name: finalName,
            category,
            quantity: quantity,
            averagePrice: parseFloat(price.toFixed(2)),
            totalValue: parseFloat(totalValue.toFixed(2)),
            date: dateStr,
            institution,
            selected: true,
          });
        }
      }
    }

    const extractedAssets = Array.from(assetsMap.values());

    if (extractedAssets.length === 0) {
      warnings.push('Nenhuma ação ou fundo foi encontrado no relatório enviado. Verifique se o arquivo baixado da B3 está correto.');
    }

    return {
      success: extractedAssets.length > 0,
      assets: extractedAssets,
      warnings,
      totalFound: extractedAssets.length,
    };
  } catch (error: any) {
    console.error('Erro ao processar arquivo B3:', error);
    return {
      success: false,
      assets: [],
      warnings: [`Erro ao ler arquivo Excel: ${error?.message || 'Arquivo inválido'}`],
      totalFound: 0,
    };
  }
}
