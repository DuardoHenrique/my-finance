import * as XLSX from 'xlsx';

export interface ExtractedB3Asset {
  id: string;
  ticker: string;
  name: string;
  category: 'Ações' | 'FIIs' | 'Renda Fixa';
  quantity: number;
  buyPrice: number;
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

    // Identify position sheets and skip non-position sheets (proventos, histórico, movimentações, operações)
    let validSheets = workbook.SheetNames.filter((sheetName) => {
      const norm = sheetName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      return !norm.includes('provento') &&
             !norm.includes('rendimento') &&
             !norm.includes('dividendo') &&
             !norm.includes('jcp') &&
             !norm.includes('historico') &&
             !norm.includes('negociac') &&
             !norm.includes('movimentac') &&
             !norm.includes('operac') &&
             !norm.includes('compra') &&
             !norm.includes('venda') &&
             !norm.includes('extrato') &&
             !norm.includes('evento') &&
             !norm.includes('fluxo') &&
             !norm.includes('history') &&
             !norm.includes('transaction') &&
             !norm.includes('trade') &&
             !norm.includes('order');
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
        avgPrice: -1,
        buyPrice: -1,
        total: -1,
        type: -1,
        date: -1,
        institution: -1,
      };

      for (let i = 0; i < Math.min(rows.length, 25); i++) {
        const row = rows[i];
        const rowStr = row.map(c => String(c).toLowerCase()).join(' | ');

        // Skip transaction/operations header rows
        if (rowStr.includes('tipo de operação') || rowStr.includes('tipo de operacao') || rowStr.includes('valor da operação') || rowStr.includes('valor da operacao') || rowStr.includes('taxas')) {
          continue;
        }

        if (
          rowStr.includes('código') || rowStr.includes('codigo') || rowStr.includes('produto') ||
          rowStr.includes('empresa') || rowStr.includes('ativo') || rowStr.includes('ticker') ||
          rowStr.includes('quantidade') || rowStr.includes('qtd') || rowStr.includes('posição') ||
          rowStr.includes('posicao')
        ) {
          headerRowIdx = i;
          row.forEach((cell, colIdx) => {
            const cStr = String(cell).toLowerCase().trim();

            // Ticker: Prioritize exact 'código de negociação', 'ticker', 'código do ativo', or 'ativo'
            if (cStr === 'código de negociação' || cStr === 'codigo de negociacao' || cStr === 'ticker' || cStr === 'código do ativo' || cStr === 'código' || cStr === 'codigo') {
              colIndices.ticker = colIdx;
            } else if (colIndices.ticker === -1 && (cStr === 'ativo' || cStr.includes('código') || cStr.includes('codigo') || cStr.includes('ticker')) && !cStr.includes('isin')) {
              colIndices.ticker = colIdx;
            }

            // Name
            if (cStr.includes('produto') || cStr.includes('empresa') || cStr.includes('especificação') || cStr.includes('razão social') || cStr === 'nome' || cStr.includes('nome do ativo')) {
              if (colIndices.name === -1) colIndices.name = colIdx;
            }

            // Quantity
            if (cStr === 'quantidade' || cStr === 'qtd') {
              colIndices.quantity = colIdx;
            } else if (colIndices.quantity === -1 && cStr.includes('quantidade disponível')) {
              colIndices.quantity = colIdx;
            } else if (colIndices.quantity === -1 && (cStr.includes('quantidade') || cStr.includes('qtd') || cStr.includes('quant')) && !cStr.includes('indisponível') && !cStr.includes('indisponivel') && !cStr.includes('bloqueada')) {
              colIndices.quantity = colIdx;
            }

            // Preço Médio (Prioritário para custo médio do investidor se presente)
            if (cStr.includes('preço médio') || cStr.includes('preco medio') || cStr.includes('custo médio') || cStr.includes('custo medio') || cStr.includes('preço medio')) {
              colIndices.avgPrice = colIdx;
            }

            // Preço de Compra (Custo unitário de aquisição)
            if (cStr.includes('preço de compra') || cStr.includes('preco de compra') || cStr.includes('custo de aquisição') || cStr.includes('custo aquisicao') || cStr.includes('valor unitario') || cStr.includes('preço unitário') || cStr.includes('preco unitario')) {
              colIndices.buyPrice = colIdx;
            }

            // Total Value (Apenas valor total de aplicação/custo se presente)
            if (cStr.includes('valor investido') || cStr.includes('valor de aplicação') || cStr.includes('custo total')) {
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
          if (match) {
            ticker = match[1].toUpperCase();
          } else if (rawCell.length > 0) {
            ticker = rawCell;
          }
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

        let avgPriceVal = colIndices.avgPrice >= 0 && row[colIndices.avgPrice] !== undefined ? cleanNumber(row[colIndices.avgPrice]) : 0;
        let buyPriceVal = colIndices.buyPrice >= 0 && row[colIndices.buyPrice] !== undefined ? cleanNumber(row[colIndices.buyPrice]) : 0;
        let totalVal = colIndices.total >= 0 && row[colIndices.total] !== undefined ? cleanNumber(row[colIndices.total]) : 0;

        let buyPrice = buyPriceVal > 0 ? buyPriceVal : avgPriceVal;
        let averagePrice = avgPriceVal > 0 ? avgPriceVal : buyPriceVal;

        // Effective cost price for total calculation (prioritize buyPrice if present)
        let effectiveCostPrice = buyPrice > 0 ? buyPrice : averagePrice;

        // Calculate total value: prioritize explicit totalVal column, or fallback to effectiveCostPrice * quantity
        if (totalVal > 0) {
          totalValue = totalVal;
        } else if (effectiveCostPrice > 0 && quantity > 0) {
          totalValue = effectiveCostPrice * quantity;
        }

        // Auto-fix missing price or total if needed
        if (buyPrice === 0 && totalValue > 0 && quantity > 0) {
          buyPrice = totalValue / quantity;
        }
        if (averagePrice === 0) {
          averagePrice = buyPrice;
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

        // Clean name
        const finalName = cleanName(name, ticker);
        const category = inferCategory(ticker, finalName, typeStr);

        // Aggregate if duplicate ticker found in sheet, but guard against duplicate row/sheet reads
        if (assetsMap.has(ticker)) {
          const existing = assetsMap.get(ticker)!;
          // If exact duplicate (same quantity and same price), skip to prevent double counting
          if (existing.quantity === quantity && Math.abs(existing.buyPrice - buyPrice) < 0.01) {
            continue;
          }
          const newQty = existing.quantity + quantity;
          const newTotal = existing.totalValue + totalValue;
          existing.quantity = newQty;
          existing.totalValue = parseFloat(newTotal.toFixed(2));
          existing.buyPrice = newQty > 0 ? parseFloat((newTotal / newQty).toFixed(2)) : existing.buyPrice;
          existing.averagePrice = averagePrice || existing.averagePrice;
        } else {
          assetsMap.set(ticker, {
            id: `b3-${ticker}-${Math.random().toString(36).substring(2, 7)}`,
            ticker,
            name: finalName,
            category,
            quantity: quantity,
            buyPrice: parseFloat(buyPrice.toFixed(2)),
            averagePrice: parseFloat(averagePrice.toFixed(2)),
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
