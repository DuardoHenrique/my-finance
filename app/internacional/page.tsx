'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { 
  Globe, 
  Plus, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  FileText, 
  X, 
  ChevronRight, 
  FileSpreadsheet
} from 'lucide-react';

// Interfaces
interface Asset {
  id: string;
  name: string;
  ticker: string;
  category: 'Stocks' | 'ETFs' | 'REITs';
  quantity: number;
  averagePrice: number; // in USD
  currentPrice: number; // in USD
  observacoes?: string;
}

interface Dividend {
  id: string;
  ticker: string;
  amountUSD: number;
  date: string; // YYYY-MM-DD
  observacoes?: string;
}

// Initial realistic mock data as requested
const INITIAL_ASSETS: Asset[] = [
  { id: '1', name: 'Apple Inc.', ticker: 'AAPL', category: 'Stocks', quantity: 10, averagePrice: 150.00, currentPrice: 182.50, observacoes: 'Comprado na baixa' },
  { id: '2', name: 'Microsoft', ticker: 'MSFT', category: 'Stocks', quantity: 5, averagePrice: 280.00, currentPrice: 415.00, observacoes: 'Foco em inteligência artificial' },
  { id: '3', name: 'Vanguard S&P 500', ticker: 'VOO', category: 'ETFs', quantity: 8, averagePrice: 380.00, currentPrice: 512.00, observacoes: 'ETF principal global' },
  { id: '4', name: 'Invesco QQQ', ticker: 'QQQ', category: 'ETFs', quantity: 4, averagePrice: 340.00, currentPrice: 480.00, observacoes: 'Tecnologia Nasdaq' },
  { id: '5', name: 'Realty Income', ticker: 'O', category: 'REITs', quantity: 20, averagePrice: 52.00, currentPrice: 55.00, observacoes: 'Dividendos mensais consistentes' },
  { id: '6', name: 'Main Street Capital', ticker: 'MAIN', category: 'REITs', quantity: 15, averagePrice: 38.00, currentPrice: 46.00, observacoes: 'Excelente yield financeiro' }
];

const INITIAL_DIVIDENDS: Dividend[] = [
  { id: 'd1', ticker: 'VOO', amountUSD: 12.40, date: '2025-07-20', observacoes: 'Dividendo ETF' },
  { id: 'd2', ticker: 'O', amountUSD: 19.20, date: '2025-08-15', observacoes: 'Mensal REIT' },
  { id: 'd3', ticker: 'AAPL', amountUSD: 5.80, date: '2025-09-15', observacoes: 'Trimestral' },
  { id: 'd4', ticker: 'MSFT', amountUSD: 7.50, date: '2025-10-18', observacoes: 'Dividendo de Ações' },
  { id: 'd5', ticker: 'O', amountUSD: 19.20, date: '2025-11-15', observacoes: 'Distribuição mensal' },
  { id: 'd6', ticker: 'MAIN', amountUSD: 9.75, date: '2025-12-22', observacoes: 'Mensal e extraordinário' },
  { id: 'd7', ticker: 'VOO', amountUSD: 12.40, date: '2026-01-20', observacoes: 'Rendimento VOO' },
  { id: 'd8', ticker: 'AAPL', amountUSD: 5.80, date: '2026-02-15', observacoes: 'Apple Inc.' },
  { id: 'd9', ticker: 'MSFT', amountUSD: 7.50, date: '2026-03-18', observacoes: 'Dividendo' },
  { id: 'd10', ticker: 'O', amountUSD: 19.20, date: '2026-04-15', observacoes: 'O Fundo imobiliário' },
  { id: 'd11', ticker: 'VOO', amountUSD: 12.40, date: '2026-05-20', observacoes: 'ETF Dividendos' }
];

// Helper components declared outside render to fix React warnings
const CustomDonutTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-panel p-3 shadow-xl text-xs">
        <p className="font-bold text-white mb-1 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.fill }} />
          {data.name}
        </p>
        <p className="text-white/50 font-mono">
          Alocação: <span className="text-white">{data.formattedValue}</span>
        </p>
        <p className="text-white/50 font-mono font-semibold">
          Proporção: <span className="text-white">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, currency }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const val = item.value;
    return (
      <div className="glass-panel p-3 shadow-xl text-xs font-mono">
        <p className="text-white/50 mb-1">{item.payload.label}</p>
        <p className="font-bold text-[#22c55e]">
          {currency === 'BRL' ? 'R$' : 'US$'} {val.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export default function InternacionalPage() {
  const { currency, exchangeRate, convertAmount, formatAmount } = useCurrency();

  // Component React State
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [dividends, setDividends] = useState<Dividend[]>(INITIAL_DIVIDENDS);

  // Modal Control States
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [showDividendModal, setShowDividendModal] = useState(false);
  const [selectedTickerForDividend, setSelectedTickerForDividend] = useState('');

  // Asset Form fields
  const [assetForm, setAssetForm] = useState({
    name: '',
    ticker: '',
    category: 'Stocks' as 'Stocks' | 'ETFs' | 'REITs',
    quantity: '',
    averagePrice: '',
    observacoes: ''
  });

  // Dividend Form fields
  const [dividendForm, setDividendForm] = useState({
    amountUSD: '',
    date: new Date().toISOString().substring(0, 10),
    observacoes: ''
  });

  // Safe client-side Escape key listener to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAssetModal(false);
        setShowDividendModal(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Compute calculated metrics
  const calculatedMetrics = useMemo(() => {
    const currentYear = new Date().getFullYear();

    // Total Portfolio Value in USD
    const totalInternacionalUSD = assets.reduce(
      (sum, item) => sum + item.quantity * item.currentPrice,
      0
    );

    // Total Dividends Lifetime in USD
    const totalDividendsLifeUSD = dividends.reduce(
      (sum, item) => sum + item.amountUSD,
      0
    );

    // Total Dividends received this current Year in USD
    const totalDividendsCurrentYearUSD = dividends
      .filter((item) => new Date(item.date).getFullYear() === currentYear)
      .reduce((sum, item) => sum + item.amountUSD, 0);

    // Distribution by category
    const categoryTotals = assets.reduce(
      (acc, item) => {
        const val = item.quantity * item.currentPrice;
        acc[item.category] += val;
        return acc;
      },
      { Stocks: 0, ETFs: 0, REITs: 0 }
    );

    return {
      totalInternacionalUSD,
      totalDividendsLifeUSD,
      totalDividendsCurrentYearUSD,
      categoryTotals,
      currentYear
    };
  }, [assets, dividends]);

  // Handle Edit Trigger
  const handleEditAssetClick = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetForm({
      name: asset.name,
      ticker: asset.ticker,
      category: asset.category,
      quantity: asset.quantity.toString(),
      averagePrice: asset.averagePrice.toString(),
      observacoes: asset.observacoes || ''
    });
    setShowAssetModal(true);
  };

  // Handle Add Asset Trigger
  const handleAddAssetClick = (category?: 'Stocks' | 'ETFs' | 'REITs') => {
    setEditingAsset(null);
    setAssetForm({
      name: '',
      ticker: '',
      category: category || 'Stocks',
      quantity: '',
      averagePrice: '',
      observacoes: ''
    });
    setShowAssetModal(true);
  };

  // Handle Delete Asset
  const handleDeleteAsset = (id: string, ticker: string) => {
    if (confirm(`Tem certeza que deseja excluir o ativo ${ticker}?`)) {
      setAssets(assets.filter((a) => a.id !== id));
      // Optionally clean up dividend logs associated with this ticker
      setDividends(dividends.filter((d) => d.ticker !== ticker));
    }
  };

  // Save Asset Form submission (Add / Edit)
  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(assetForm.quantity);
    const avgPrice = parseFloat(assetForm.averagePrice);

    if (isNaN(qty) || qty <= 0 || isNaN(avgPrice) || avgPrice < 0) {
      alert('Por favor, preencha quantidade e preço médio válidos.');
      return;
    }

    if (!assetForm.name.trim() || !assetForm.ticker.trim()) {
      alert('Por favor, digite o nome e o ticker do ativo.');
      return;
    }

    const tickerUpper = assetForm.ticker.trim().toUpperCase();

    if (editingAsset) {
      // Edit
      setAssets(
        assets.map((a) =>
          a.id === editingAsset.id
            ? {
                ...a,
                name: assetForm.name.trim(),
                ticker: tickerUpper,
                category: assetForm.category,
                quantity: qty,
                averagePrice: avgPrice,
                observacoes: assetForm.observacoes.trim()
              }
            : a
        )
      );
    } else {
      // Add new
      // Generate some simulated current price reasonably close to avgPrice for realistic preview
      const simulatedCurrentPrice = avgPrice * (1 + (Math.random() * 0.4 - 0.1)); // -10% to +30%
      const newAsset: Asset = {
        id: Math.random().toString(36).substring(2, 9),
        name: assetForm.name.trim(),
        ticker: tickerUpper,
        category: assetForm.category,
        quantity: qty,
        averagePrice: avgPrice,
        currentPrice: parseFloat(simulatedCurrentPrice.toFixed(2)),
        observacoes: assetForm.observacoes.trim()
      };
      setAssets([...assets, newAsset]);
    }

    setShowAssetModal(false);
  };

  // Trigger Add Dividend Modal
  const handleRecordDividendClick = (ticker: string) => {
    setSelectedTickerForDividend(ticker);
    setDividendForm({
      amountUSD: '',
      date: new Date().toISOString().substring(0, 10),
      observacoes: ''
    });
    setShowDividendModal(true);
  };

  // Save Dividend Entry
  const handleRegisterDividend = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(dividendForm.amountUSD);

    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Por favor, insira um valor válido de dividendo.');
      return;
    }

    const newDiv: Dividend = {
      id: `d-${Math.random().toString(36).substring(2, 9)}`,
      ticker: selectedTickerForDividend,
      amountUSD: amountVal,
      date: dividendForm.date,
      observacoes: dividendForm.observacoes.trim()
    };

    setDividends([newDiv, ...dividends]);
    setShowDividendModal(false);
  };

  // Delete Dividend receipt
  const handleDeleteDividend = (id: string) => {
    if (confirm('Deseja excluir esse lançamento de dividendo?')) {
      setDividends(dividends.filter((d) => d.id !== id));
    }
  };

  // Formatted date string to Portuguese standard
  const formatBrazilianDate = (dateString: string) => {
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  // Recharts Category Allocation Data
  const allocationChartData = useMemo(() => {
    const total = calculatedMetrics.totalInternacionalUSD;
    if (total <= 0) return [];

    return [
      {
        name: 'Stocks',
        value: convertAmount(calculatedMetrics.categoryTotals.Stocks),
        rawUSD: calculatedMetrics.categoryTotals.Stocks,
        formattedValue: formatAmount(calculatedMetrics.categoryTotals.Stocks),
        percentage: (calculatedMetrics.categoryTotals.Stocks / total) * 100,
        fill: '#3b82f6'
      },
      {
        name: 'ETFs',
        value: convertAmount(calculatedMetrics.categoryTotals.ETFs),
        rawUSD: calculatedMetrics.categoryTotals.ETFs,
        formattedValue: formatAmount(calculatedMetrics.categoryTotals.ETFs),
        percentage: (calculatedMetrics.categoryTotals.ETFs / total) * 100,
        fill: '#8b5cf6'
      },
      {
        name: 'REITs',
        value: convertAmount(calculatedMetrics.categoryTotals.REITs),
        rawUSD: calculatedMetrics.categoryTotals.REITs,
        formattedValue: formatAmount(calculatedMetrics.categoryTotals.REITs),
        percentage: (calculatedMetrics.categoryTotals.REITs / total) * 100,
        fill: '#06b6d4'
      }
    ].filter(item => item.rawUSD > 0);
  }, [calculatedMetrics, convertAmount, formatAmount]);

  // Recharts Monthly Dividends Last 12 Months
  const dividendsChartData = useMemo(() => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const today = new Date();
    
    // Generate beautiful sequential 12 months array finishing at today
    const monthsResult: { key: string; label: string; monthIndex: number; year: number; totalUSD: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      monthsResult.push({
        key: `${yr}-${String(mIdx + 1).padStart(2, '0')}`,
        label: `${monthNames[mIdx]} ${String(yr).substring(2)}`,
        monthIndex: mIdx,
        year: yr,
        totalUSD: 0
      });
    }

    // Populate each with dividends amount based on matching dates
    dividends.forEach((div) => {
      try {
        const divPart = div.date.split('-');
        if (divPart.length === 3) {
          const divYr = parseInt(divPart[0]);
          const divMo = parseInt(divPart[1]);
          const formattedKey = `${divYr}-${String(divMo).padStart(2, '0')}`;
          
          const matchMonth = monthsResult.find(m => m.key === formattedKey);
          if (matchMonth) {
            matchMonth.totalUSD += div.amountUSD;
          }
        }
      } catch (err) {
        console.error('Error parsing dividend date', err);
      }
    });

    // Output mapped in selected currency
    return monthsResult.map((m) => ({
      label: m.label,
      value: currency === 'USD' ? m.totalUSD : m.totalUSD * exchangeRate
    }));
  }, [dividends, currency, exchangeRate]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-16">
      
      {/* SECTION 1 — Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-white/50 text-xs font-semibold tracking-wider uppercase mb-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3 text-[#30363D]" />
            <span className="text-white">Internacional</span>
          </div>
          <h1 className="text-3xl font-bold heading-display mb-1 flex items-center gap-2">
            <span className="text-xl">🌍</span> Internacional
          </h1>
          <p className="text-sm text-white/50">Ações, ETFs e REITs internacionais em moeda forte</p>
        </div>
      </header>

      {/* SECTION 2 — Summary Cards Row (3 cards side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1 — Total Internacional */}
        <div className="glass-panel glass-panel-hover overflow-hidden group relative p-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#3b82f6]/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Total Internacional</span>
            <div className="text-4xl font-bold heading-display mb-1 font-mono">
              {formatAmount(calculatedMetrics.totalInternacionalUSD)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-green-500 font-semibold pt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+3.4% este mês</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#3b82f6]" />
        </div>

        {/* Card 2 — Total Dividendos Recebidos */}
        <div className="glass-panel glass-panel-hover overflow-hidden group relative p-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#22c55e]/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Dividendos Recebidos</span>
            <div className="text-4xl font-bold heading-display mb-1 font-mono">
              {formatAmount(calculatedMetrics.totalDividendsLifeUSD)}
            </div>
            <span className="text-xs text-white/50 block pt-1">histórico total</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#22c55e]" />
        </div>

        {/* Card 3 — Dividendos (Ano Atual) */}
        <div className="glass-panel glass-panel-hover overflow-hidden group relative p-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block">
              Dividendos em {calculatedMetrics.currentYear}
            </span>
            <div className="text-4xl font-bold heading-display mb-1 font-mono">
              {formatAmount(calculatedMetrics.totalDividendsCurrentYearUSD)}
            </div>
            <span className="text-xs text-white/50 block pt-1">janeiro até hoje</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#10b981]" />
        </div>

      </div>

      {/* SECTION 3 — Charts Row (2 charts side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1 Left — Allocation by Category */}
        <div className="glass-panel p-5 flex flex-col h-[360px] justify-between">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">Alocação por Categoria</h3>
          
          <div className="flex-1 min-h-0 relative">
            {allocationChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={allocationChartData} 
                    innerRadius={55} 
                    outerRadius={75} 
                    paddingAngle={allocationChartData.length > 1 ? 4 : 0} 
                    dataKey="value" 
                    stroke="none"
                  >
                    {allocationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomDonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/50 text-xs font-mono">
                Sem dados de alocação no momento
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
            {[
              { name: 'Stocks', pct: calculatedMetrics.totalInternacionalUSD > 0 ? (calculatedMetrics.categoryTotals.Stocks / calculatedMetrics.totalInternacionalUSD) * 100 : 0, fill: '#3b82f6' },
              { name: 'ETFs', pct: calculatedMetrics.totalInternacionalUSD > 0 ? (calculatedMetrics.categoryTotals.ETFs / calculatedMetrics.totalInternacionalUSD) * 100 : 0, fill: '#8b5cf6' },
              { name: 'REITs', pct: calculatedMetrics.totalInternacionalUSD > 0 ? (calculatedMetrics.categoryTotals.REITs / calculatedMetrics.totalInternacionalUSD) * 100 : 0, fill: '#06b6d4' }
            ].map((item) => (
              <div key={item.name} className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs font-semibold text-white">{item.name}</span>
                </div>
                <span className="text-xs font-mono text-white/50">{item.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2 Right — Dividends per Month (Bar chart) */}
        <div className="glass-panel p-5 flex flex-col h-[360px] justify-between">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Dividendos por Mês</h3>
          
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dividendsChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(v) => {
                    const formatted = v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`;
                    return currency === 'BRL' ? `R$${formatted}` : `$${formatted}`;
                  }} 
                />
                <RechartsTooltip content={<CustomBarTooltip currency={currency} />} />
                <Bar dataKey="value" fill="#22c55e" radius={[2, 2, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* SECTION 4 — Asset Table per Category */}
      <div className="space-y-8 pt-4">
        
        {/* Render Stocks section */}
        {(['Stocks', 'ETFs', 'REITs'] as const).map((catName) => {
          const categoryAssets = assets.filter((a) => a.category === catName);
          const categoryTotalUSD = categoryAssets.reduce((sum, item) => sum + item.quantity * item.currentPrice, 0);

          return (
            <section key={catName} className="glass-panel overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 px-5 py-4 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                    {catName === 'Stocks' ? 'Stocks' : catName === 'ETFs' ? 'ETFs' : 'REITs'}
                  </h2>
                  <span className="text-xs bg-[#21262d] border border-white/10 px-2 py-0.5 rounded text-white/50 font-mono">
                    Total: {formatAmount(categoryTotalUSD)}
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleAddAssetClick(catName)}
                  className="flex items-center gap-1.5 btn-primary text-xs text-left w-fit cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Adicionar Ativo</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-wider font-mono">
                      <th className="px-5 py-3.5">Ativo</th>
                      <th className="px-5 py-3.5 text-right w-24">Quantidade</th>
                      <th className="px-5 py-3.5 text-right w-32">Preço Médio (USD)</th>
                      <th className="px-5 py-3.5 text-right w-32">Preço Atual (USD)</th>
                      <th className="px-5 py-3.5 text-right w-36">Valor Total</th>
                      <th className="px-5 py-3.5 text-right w-36">P&L</th>
                      <th className="px-5 py-3.5 text-right w-32">Dividendos</th>
                      <th className="px-5 py-3.5 text-center w-32">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-xs font-mono">
                    {categoryAssets.length > 0 ? (
                      categoryAssets.map((asset) => {
                        const totalValUSD = asset.quantity * asset.currentPrice;
                        const investedValUSD = asset.quantity * asset.averagePrice;
                        const pAndLUSD = totalValUSD - investedValUSD;
                        const pAndLPercentage = investedValUSD > 0 ? (pAndLUSD / investedValUSD) * 100 : 0;
                        
                        // Sum total dividends for this ticker specifically
                        const assetDividendsUSD = dividends
                          .filter((d) => d.ticker.toUpperCase() === asset.ticker.toUpperCase())
                          .reduce((sum, item) => sum + item.amountUSD, 0);

                        return (
                          <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors">
                            {/* Ativo column */}
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-white font-sans text-sm">{asset.name}</span>
                                <span className="text-white/50 text-xs font-semibold tracking-wider">{asset.ticker}</span>
                              </div>
                            </td>
                            {/* Quantidade column */}
                            <td className="px-5 py-4 text-right text-white font-semibold font-mono">
                              {asset.quantity}
                            </td>
                            {/* Preço Médio in USD */}
                            <td className="px-5 py-4 text-right text-white/50 font-mono">
                              ${asset.averagePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-gray-600 block">USD</span>
                            </td>
                            {/* Preço Atual in USD */}
                            <td className="px-5 py-4 text-right text-white font-mono">
                              ${asset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-gray-600 block">USD</span>
                            </td>
                            {/* Valor Total converted */}
                            <td className="px-5 py-4 text-right text-white font-semibold font-mono">
                              {formatAmount(totalValUSD)}
                            </td>
                            {/* P&L converted and percentage */}
                            <td className="px-5 py-4 text-right font-mono">
                              <span className={`font-semibold ${pAndLUSD >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                                {pAndLUSD >= 0 ? '+' : ''}
                                {formatAmount(pAndLUSD)}
                              </span>
                              <span className={`text-[10px] block font-semibold ${pAndLUSD >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                                {pAndLUSD >= 0 ? '↑' : '↓'} {pAndLPercentage.toFixed(1)}%
                              </span>
                            </td>
                            {/* Dividendos converted */}
                            <td className="px-5 py-4 text-right text-white font-mono">
                              {formatAmount(assetDividendsUSD)}
                            </td>
                            {/* Actions Column */}
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRecordDividendClick(asset.ticker)}
                                  title="Registrar dividendo em USD"
                                  className="flex items-center gap-1 bg-[#1f6feb]/10 hover:bg-[#1f6feb]/25 border border-[#1f6feb]/30 text-brand-accent hover:text-white px-2 py-1 rounded text-[11px] font-semibold font-sans transition-all cursor-pointer"
                                >
                                  <span>$+</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditAssetClick(asset)}
                                  title="Editar ativo"
                                  className="p-1 hover:bg-white/10 border border-transparent hover:border-white/10 text-white/50 hover:text-brand-accent rounded transition-all cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAsset(asset.id, asset.ticker)}
                                  title="Excluir ativo"
                                  className="p-1 hover:bg-red-500/10 border border-transparent hover:border-[#da3633]/30 text-white/50 hover:text-red-400 rounded transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-white/50 font-medium font-sans">
                          Nenhum ativo cadastrado. Clique em <span className="text-brand-accent cursor-pointer" onClick={() => handleAddAssetClick(catName)}>&quot;+ Adicionar Ativo&quot;</span> para começar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

      </div>

      {/* SECTION 5 — Dividend History Panel */}
      <section className="glass-panel overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#22c55e]" /> Histórico de Dividendos
            </h2>
          </div>
          
          <div className="bg-[#21262d] border border-white/10 rounded-md px-3.5 py-1.5 text-xs text-white flex items-center gap-1.5 font-bold font-mono">
            <span>Total recebido:</span> 
            <span className="text-[#22c55e]">
              {formatAmount(calculatedMetrics.totalDividendsLifeUSD)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-wider font-mono">
                <th className="px-5 py-3.5 w-36">Data</th>
                <th className="px-5 py-3.5 w-32">Ativo</th>
                <th className="px-5 py-3.5 text-right w-44">Valor em moeda forte (USD)</th>
                <th className="px-5 py-3.5 text-right w-44">Valor convertido</th>
                <th className="px-5 py-3.5">Observações</th>
                <th className="px-5 py-3.5 text-center w-20">Excluir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-xs font-mono">
              {dividends.length > 0 ? (
                dividends.map((div) => {
                  return (
                    <tr key={div.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Data */}
                      <td className="px-5 py-3.5 text-white font-semibold">
                        {formatBrazilianDate(div.date)}
                      </td>
                      {/* Ativo */}
                      <td className="px-5 py-3.5 font-bold uppercase text-brand-accent">
                        {div.ticker}
                      </td>
                      {/* Valor em USD */}
                      <td className="px-5 py-3.5 text-right text-white/50">
                        ${div.amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {/* Valor Convertido */}
                      <td className="px-5 py-3.5 text-right text-green-500 font-bold">
                        {formatAmount(div.amountUSD)}
                      </td>
                      {/* Observações */}
                      <td className="px-5 py-3.5 text-white/50 truncate max-w-xs overflow-hidden font-sans">
                        {div.observacoes || '—'}
                      </td>
                      {/* Excluir button */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteDividend(div.id)}
                          title="Excluir dividendo"
                          className="p-1 hover:bg-red-500/10 border border-transparent hover:border-[#da3633]/30 text-white/50 hover:text-red-400 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-white/50 font-medium font-sans">
                    Nenhum dividendo registrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL — Add / Edit Asset */}
      {showAssetModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAssetModal(false)}
        >
          <div 
            className="glass-panel rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative block"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                {editingAsset ? 'Editar Ativo' : 'Adicionar Ativo'}
              </h3>
              <button 
                type="button"
                onClick={() => setShowAssetModal(false)}
                className="p-1 hover:bg-white/10 text-white/50 hover:text-white rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="p-5 space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Ticker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Ticker</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: AAPL"
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full font-mono font-bold tracking-widest uppercase"
                    value={assetForm.ticker}
                    onChange={(e) => setAssetForm({ ...assetForm, ticker: e.target.value })}
                  />
                </div>

                {/* Categoria */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Categoria</label>
                  <select
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white rounded-md focus:outline-none p-2 w-full cursor-pointer"
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value as any })}
                  >
                    <option value="Stocks">Stocks</option>
                    <option value="ETFs">ETFs</option>
                    <option value="REITs">REITs</option>
                  </select>
                </div>
              </div>

              {/* Nome do Ativo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50">Nome do Ativo</label>
                <input
                  required
                  type="text"
                  placeholder="ex: Apple Inc."
                  className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full font-semibold"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantidade */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Quantidade</label>
                  <input
                    required
                    type="number"
                    step="any"
                    min="0.0000001"
                    placeholder="ex: 10"
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full font-mono"
                    value={assetForm.quantity}
                    onChange={(e) => setAssetForm({ ...assetForm, quantity: e.target.value })}
                  />
                </div>

                {/* Preço Médio de Compra em USD */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Preço Médio (em USD)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-white/50 font-mono font-bold">$</span>
                    <input
                      required
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="ex: 150.00"
                      className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none pl-6 pr-2 py-2 w-full font-mono"
                      value={assetForm.averagePrice}
                      onChange={(e) => setAssetForm({ ...assetForm, averagePrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50">Observações (opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Anotações sobre a compra..."
                  className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full"
                  value={assetForm.observacoes}
                  onChange={(e) => setAssetForm({ ...assetForm, observacoes: e.target.value })}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="btn-primary text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-accent text-xs cursor-pointer"
                >
                  Salvar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL — Add Dividend */}
      {showDividendModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDividendModal(false)}
        >
          <div 
            className="glass-panel rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative block"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-green-500" /> Registrar Dividendo
              </h3>
              <button 
                type="button"
                onClick={() => setShowDividendModal(false)}
                className="p-1 hover:bg-white/10 text-white/50 hover:text-white rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterDividend} className="p-5 space-y-4 text-xs font-sans">
              
              {/* Asset ticker (pre-filled and read-only) */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-white/50">Ativo</label>
                <input
                  readOnly
                  type="text"
                  className="bg-[#161B22] border border-white/10 text-white/50 rounded-md p-2 w-full font-mono font-bold uppercase cursor-not-allowed select-none outline-none"
                  value={selectedTickerForDividend}
                />
              </div>

              {/* Valor Recebido em USD */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-white/50">Valor Recebido (em USD)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-white/50 font-mono font-bold">$</span>
                  <input
                    required
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="0.00"
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#22c55e] text-white placeholder:text-white/50/40 rounded-md focus:outline-none pl-6 pr-2 py-2 w-full font-mono"
                    value={dividendForm.amountUSD}
                    onChange={(e) => setDividendForm({ ...dividendForm, amountUSD: e.target.value })}
                  />
                </div>
              </div>

              {/* Data do Recebimento */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-white/50">Data do Recebimento</label>
                <div className="relative">
                  <input
                    required
                    type="date"
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#22c55e] text-white rounded-md focus:outline-none p-2 w-full font-mono"
                    value={dividendForm.date}
                    onChange={(e) => setDividendForm({ ...dividendForm, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-white/50">Observações (opcional)</label>
                <textarea
                  rows={2}
                  placeholder="ex: Dividendo referente ao trimestre"
                  className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#22c55e] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full"
                  value={dividendForm.observacoes}
                  onChange={(e) => setDividendForm({ ...dividendForm, observacoes: e.target.value })}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowDividendModal(false)}
                  className="btn-primary text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold rounded-md px-4 py-2 transition-all cursor-pointer"
                >
                  Registrar Dividendo
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
