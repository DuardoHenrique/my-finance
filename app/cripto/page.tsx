'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { 
  Bitcoin, 
  Coins, 
  Plus, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  Calendar, 
  X, 
  ChevronRight
} from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  ticker: string;
  category: 'BTC' | 'Altcoin';
  quantity: number;
  averagePrice: number; // in USD
  currentPrice: number; // in USD
  observacoes?: string;
}

interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  ticker: string;
  type: 'Compra' | 'Venda';
  quantity: number;
  unitPriceUSD: number; // in USD
  observacoes?: string;
}

const INITIAL_ASSETS: Asset[] = [
  { id: 'c1', name: 'Bitcoin', ticker: 'BTC', category: 'BTC', quantity: 0.45, averagePrice: 42500.00, currentPrice: 65200.00, observacoes: 'Acumulação de longo prazo - Halving 2024' },
  { id: 'c2', name: 'Ethereum', ticker: 'ETH', category: 'Altcoin', quantity: 3.5, averagePrice: 2100.00, currentPrice: 3450.00, observacoes: 'Smart contracts líder de mercado' },
  { id: 'c3', name: 'Solana', ticker: 'SOL', category: 'Altcoin', quantity: 45, averagePrice: 95.00, currentPrice: 148.00, observacoes: 'Rápida e barata, dApps e NFTs' }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2025-05-10', ticker: 'BTC', type: 'Compra', quantity: 0.25, unitPriceUSD: 38500, observacoes: 'Aporte mensal' },
  { id: 't2', date: '2025-06-12', ticker: 'ETH', type: 'Compra', quantity: 2.0, unitPriceUSD: 1950, observacoes: 'Ethereum upgrade' },
  { id: 't3', date: '2025-09-05', ticker: 'BTC', type: 'Compra', quantity: 0.20, unitPriceUSD: 47500, observacoes: 'Dip buying' },
  { id: 't4', date: '2025-10-22', ticker: 'SOL', type: 'Compra', quantity: 45, unitPriceUSD: 95, observacoes: 'Entrada em SOL' },
  { id: 't5', date: '2025-11-14', ticker: 'ETH', type: 'Compra', quantity: 1.5, unitPriceUSD: 2300, observacoes: 'Aporte mensal' },
  { id: 't6', date: '2026-03-10', ticker: 'ADA', type: 'Venda', quantity: 1000, unitPriceUSD: 0.65, observacoes: 'Realização de lucro em ADA' }
];

const MOCK_BTC_HISTORY = [
  { label: 'Jul 25', priceUSD: 58000 },
  { label: 'Ago 25', priceUSD: 59500 },
  { label: 'Set 25', priceUSD: 64000 },
  { label: 'Out 25', priceUSD: 62500 },
  { label: 'Nov 25', priceUSD: 68000 },
  { label: 'Dez 25', priceUSD: 72500 },
  { label: 'Jan 26', priceUSD: 69000 },
  { label: 'Fev 26', priceUSD: 67500 },
  { label: 'Mar 26', priceUSD: 71000 },
  { label: 'Abr 26', priceUSD: 66000 },
  { label: 'Mai 26', priceUSD: 68500 },
  { label: 'Jun 26', priceUSD: 65200 }
];

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
          Valor: <span className="text-white">{data.formattedValue}</span>
        </p>
        <p className="text-white/50 font-mono font-semibold">
          Proporção: <span className="text-white">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomLineTooltip = ({ active, payload, currency }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const val = item.value;
    return (
      <div className="glass-panel p-3 shadow-xl text-xs font-mono">
        <p className="text-white/50 mb-1">{item.payload.label}</p>
        <p className="font-bold text-[#f97316]">
          {currency === 'BRL' ? 'R$' : 'US$'} {val.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export default function CriptoPage() {
  const { currency, exchangeRate, convertAmount, formatAmount } = useCurrency();

  // State Management
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Modals Visibility
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);

  // Focus properties
  const [isBTCModal, setIsBTCModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Forms
  const [assetForm, setAssetForm] = useState({
    name: '',
    ticker: '',
    quantity: '',
    averagePrice: '',
    observacoes: ''
  });

  const [txForm, setTxForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    ticker: '',
    type: 'Compra' as 'Compra' | 'Venda',
    quantity: '',
    unitPriceUSD: '',
    observacoes: ''
  });

  // Hotkey close handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAssetModal(false);
        setShowTxModal(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Compute calculated values
  const metrics = useMemo(() => {
    const btcAsset = assets.find((a) => a.ticker === 'BTC');
    const btcTotalUSD = btcAsset ? btcAsset.quantity * btcAsset.currentPrice : 0;

    const altcoinsTotalUSD = assets
      .filter((a) => a.category === 'Altcoin')
      .reduce((sum, a) => sum + a.quantity * a.currentPrice, 0);

    const totalCriptoUSD = btcTotalUSD + altcoinsTotalUSD;

    const btcPct = totalCriptoUSD > 0 ? (btcTotalUSD / totalCriptoUSD) * 100 : 0;
    const altPct = totalCriptoUSD > 0 ? (altcoinsTotalUSD / totalCriptoUSD) * 100 : 0;

    return {
      btcTotalUSD,
      altcoinsTotalUSD,
      totalCriptoUSD,
      btcPct,
      altPct
    };
  }, [assets]);

  // Asset Modal Actions
  const handleBTCButtonClicked = () => {
    const btcAsset = assets.find((a) => a.ticker === 'BTC');
    setIsBTCModal(true);
    setEditingAsset(btcAsset || null);
    setAssetForm({
      name: 'Bitcoin',
      ticker: 'BTC',
      quantity: btcAsset ? btcAsset.quantity.toString() : '',
      averagePrice: btcAsset ? btcAsset.averagePrice.toString() : '',
      observacoes: btcAsset ? btcAsset.observacoes || '' : ''
    });
    setShowAssetModal(true);
  };

  const handleAltcoinButtonClicked = () => {
    setIsBTCModal(false);
    setEditingAsset(null);
    setAssetForm({
      name: '',
      ticker: '',
      quantity: '',
      averagePrice: '',
      observacoes: ''
    });
    setShowAssetModal(true);
  };

  const handleEditAssetClicked = (asset: Asset) => {
    const isBtc = asset.ticker === 'BTC';
    setIsBTCModal(isBtc);
    setEditingAsset(asset);
    setAssetForm({
      name: asset.name,
      ticker: asset.ticker,
      quantity: asset.quantity.toString(),
      averagePrice: asset.averagePrice.toString(),
      observacoes: asset.observacoes || ''
    });
    setShowAssetModal(true);
  };

  const handleDeleteAsset = (id: string, ticker: string) => {
    if (confirm(`Tem certeza que deseja excluir a posição em ${ticker}?`)) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(assetForm.quantity);
    const avgPrice = parseFloat(assetForm.averagePrice);

    if (isNaN(qty) || qty <= 0 || isNaN(avgPrice) || avgPrice < 0) {
      alert('Por favor, preencha quantidade e preço médio válidos.');
      return;
    }

    if (isBTCModal) {
      const existingBTC = assets.find((a) => a.ticker === 'BTC');
      if (existingBTC) {
        setAssets((prev) =>
          prev.map((a) =>
            a.id === existingBTC.id
              ? {
                  ...a,
                  quantity: qty,
                  averagePrice: avgPrice,
                  observacoes: assetForm.observacoes.trim()
                }
              : a
          )
        );
      } else {
        const newBTC: Asset = {
          id: Math.random().toString(36).substring(2, 9),
          name: 'Bitcoin',
          ticker: 'BTC',
          category: 'BTC',
          quantity: qty,
          averagePrice: avgPrice,
          currentPrice: 65200.00,
          observacoes: assetForm.observacoes.trim()
        };
        setAssets((prev) => [...prev, newBTC]);
      }
    } else {
      if (!assetForm.name.trim() || !assetForm.ticker.trim()) {
        alert('Por favor, digite o nome e o ticker do ativo.');
        return;
      }
      const tickerUpper = assetForm.ticker.trim().toUpperCase();

      if (editingAsset) {
        setAssets((prev) =>
          prev.map((a) =>
            a.id === editingAsset.id
              ? {
                  ...a,
                  name: assetForm.name.trim(),
                  ticker: tickerUpper,
                  quantity: qty,
                  averagePrice: avgPrice,
                  observacoes: assetForm.observacoes.trim()
                }
              : a
          )
        );
      } else {
        const simulatedCurrentPrice = avgPrice * (1 + (Math.random() * 0.4 - 0.1));
        const newAsset: Asset = {
          id: Math.random().toString(36).substring(2, 9),
          name: assetForm.name.trim(),
          ticker: tickerUpper,
          category: 'Altcoin',
          quantity: qty,
          averagePrice: avgPrice,
          currentPrice: parseFloat(simulatedCurrentPrice.toFixed(2)),
          observacoes: assetForm.observacoes.trim()
        };
        setAssets((prev) => [...prev, newAsset]);
      }
    }

    setShowAssetModal(false);
  };

  // Transaction Actions
  const handleAddTxClicked = () => {
    setEditingTx(null);
    setTxForm({
      date: new Date().toISOString().substring(0, 10),
      ticker: '',
      type: 'Compra',
      quantity: '',
      unitPriceUSD: '',
      observacoes: ''
    });
    setShowTxModal(true);
  };

  const handleDeleteTx = (id: string) => {
    if (confirm('Deseja excluir este lançamento de transação?')) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(txForm.quantity);
    const unitPrice = parseFloat(txForm.unitPriceUSD);

    if (isNaN(qty) || qty <= 0 || isNaN(unitPrice) || unitPrice < 0) {
      alert('Por favor, preencha quantidade e preço unitário válidos.');
      return;
    }

    if (!txForm.ticker.trim()) {
      alert('Por favor, especifique o ticker.');
      return;
    }

    const tickerUpper = txForm.ticker.trim().toUpperCase();

    const newTx: Transaction = {
      id: editingTx ? editingTx.id : `tx-${Math.random().toString(36).substring(2, 9)}`,
      date: txForm.date,
      ticker: tickerUpper,
      type: txForm.type,
      quantity: qty,
      unitPriceUSD: unitPrice,
      observacoes: txForm.observacoes.trim()
    };

    if (editingTx) {
      setTransactions((prev) => prev.map((t) => (t.id === editingTx.id ? newTx : t)));
    } else {
      setTransactions((prev) => [newTx, ...prev]);
    }

    setShowTxModal(false);
  };

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

  // Recharts calculations
  const donutData = useMemo(() => {
    if (metrics.totalCriptoUSD <= 0) return [];
    return [
      {
        name: 'Bitcoin (BTC)',
        value: convertAmount(metrics.btcTotalUSD),
        rawUSD: metrics.btcTotalUSD,
        formattedValue: formatAmount(metrics.btcTotalUSD),
        percentage: metrics.btcPct,
        fill: '#f97316'
      },
      {
        name: 'Altcoins',
        value: convertAmount(metrics.altcoinsTotalUSD),
        rawUSD: metrics.altcoinsTotalUSD,
        formattedValue: formatAmount(metrics.altcoinsTotalUSD),
        percentage: metrics.altPct,
        fill: '#3b82f6'
      }
    ].filter((item) => item.rawUSD > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics]);

  const priceHistoryData = useMemo(() => {
    return MOCK_BTC_HISTORY.map((h) => ({
      label: h.label,
      value: convertAmount(h.priceUSD)
    }));
  }, [convertAmount]);

  // Asset classifications
  const btcAsset = assets.find((a) => a.category === 'BTC');
  const altcoinAssets = assets.filter((a) => a.category === 'Altcoin');

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-16">
      
      {/* SECTION 1 — Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-white/50 text-xs font-semibold tracking-wider uppercase mb-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3 text-[#30363D]" />
            <span className="text-white">Cripto</span>
          </div>
          <h1 className="text-3xl font-bold heading-display mb-1 flex items-center gap-2">
            <Bitcoin className="w-6 h-6 text-[#f97316]" /> Cripto
          </h1>
          <p className="text-sm text-white/50">Bitcoin e Altcoins</p>
        </div>
      </header>

      {/* SECTION 2 — Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="glass-panel glass-panel-hover overflow-hidden group relative p-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#f97316]/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Total Cripto</span>
            <div className="text-4xl font-bold heading-display mb-1 font-mono">
              {formatAmount(metrics.totalCriptoUSD)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-green-500 font-semibold pt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+5.8% este mês</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#f97316]" />
        </div>

        {/* Card 2 */}
        <div className="glass-panel glass-panel-hover overflow-hidden group relative p-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#f97316]/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Bitcoin (BTC)</span>
            <div className="text-4xl font-bold heading-display mb-1 font-mono">
              {formatAmount(metrics.btcTotalUSD)}
            </div>
            <span className="text-xs text-white/50 block pt-1 font-mono">{metrics.btcPct.toFixed(1)}% do portfólio cripto</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#f97316]" />
        </div>

        {/* Card 3 */}
        <div className="glass-panel glass-panel-hover overflow-hidden group relative p-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#3b82f6]/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Altcoins</span>
            <div className="text-4xl font-bold heading-display mb-1 font-mono">
              {formatAmount(metrics.altcoinsTotalUSD)}
            </div>
            <span className="text-xs text-white/50 block pt-1 font-mono">{metrics.altPct.toFixed(1)}% do portfólio cripto</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#3b82f6]" />
        </div>
      </div>

      {/* SECTION 3 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart */}
        <div className="glass-panel p-5 flex flex-col h-[360px] justify-between">
          <div>
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">BTC vs Altcoins</h3>
          </div>
          <div className="flex-1 min-h-0 relative">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={donutData} 
                    innerRadius={55} 
                    outerRadius={75} 
                    paddingAngle={donutData.length > 1 ? 4 : 0} 
                    dataKey="value" 
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
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
          <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
            {[
              { name: 'Bitcoin (BTC)', pct: metrics.btcPct, value: metrics.btcTotalUSD, fill: '#f97316' },
              { name: 'Altcoins', pct: metrics.altPct, value: metrics.altcoinsTotalUSD, fill: '#3b82f6' }
            ].map((item) => (
              <div key={item.name} className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs font-semibold text-white">{item.name}</span>
                </div>
                <span className="text-xs font-mono text-white/50">{item.pct.toFixed(1)}% ({formatAmount(item.value)})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Chart */}
        <div className="glass-panel p-5 flex flex-col h-[360px] justify-between">
          <div>
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">Histórico de Preço — BTC</h3>
            <p className="text-[10px] text-white/50 font-medium uppercase font-sans">últimos 12 meses</p>
          </div>
          <div className="flex-1 min-h-0 relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistoryData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
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
                <RechartsTooltip content={<CustomLineTooltip currency={currency} />} />
                <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 4 — BTC Section */}
      <section className="glass-panel overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 px-5 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
              <span className="text-[#f97316]">₿</span> Bitcoin
            </h2>
            <span className="text-xs bg-[#21262d] border border-white/10 px-2 py-0.5 rounded text-white/50 font-mono">
              Total: {formatAmount(metrics.btcTotalUSD)}
            </span>
          </div>
          
          <button
            type="button"
            onClick={handleBTCButtonClicked}
            className="flex items-center gap-1.5 btn-primary text-xs text-left w-fit cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#f97316]" />
            <span>Adicionar / Editar BTC</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-wider font-mono">
                <th className="px-5 py-3.5">Ativo</th>
                <th className="px-5 py-3.5 text-right w-28">Quantidade</th>
                <th className="px-5 py-3.5 text-right w-36">Preço Médio (USD)</th>
                <th className="px-5 py-3.5 text-right w-36">Preço Atual (USD)</th>
                <th className="px-5 py-3.5 text-right w-40">Valor Total</th>
                <th className="px-5 py-3.5 text-right w-36">P&L</th>
                <th className="px-5 py-3.5 text-center w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-xs font-mono">
              {btcAsset ? (
                (() => {
                  const btcCurrentVal = btcAsset.quantity * btcAsset.currentPrice;
                  const btcInvestedVal = btcAsset.quantity * btcAsset.averagePrice;
                  const pLVal = btcCurrentVal - btcInvestedVal;
                  const pLPct = btcInvestedVal > 0 ? (pLVal / btcInvestedVal) * 100 : 0;
                  return (
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-white font-sans text-sm">{btcAsset.name}</span>
                          <span className="text-white/50 text-xs font-semibold tracking-wider">{btcAsset.ticker}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-white font-semibold">
                        {btcAsset.quantity}
                      </td>
                      <td className="px-5 py-4 text-right text-white/50">
                        USD {btcAsset.averagePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-right text-white">
                        USD {btcAsset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-right text-white font-semibold">
                        {formatAmount(btcCurrentVal)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`font-semibold ${pLVal >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                          {pLVal >= 0 ? '+' : ''}
                          {formatAmount(pLVal)}
                        </span>
                        <span className={`text-[10px] block font-semibold ${pLVal >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                          {pLVal >= 0 ? '↑' : '↓'} {pLPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditAssetClicked(btcAsset)}
                            title="Editar BTC"
                            className="p-1 hover:bg-white/10 border border-transparent hover:border-white/10 text-white/50 hover:text-[#f97316] rounded transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(btcAsset.id, btcAsset.ticker)}
                            title="Excluir BTC"
                            className="p-1 hover:bg-red-500/10 border border-transparent hover:border-[#da3633]/30 text-white/50 hover:text-red-400 rounded transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })()
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-white/50 font-medium font-sans">
                    Nenhuma posição em Bitcoin cadastrada. Clique em &quot;+ Adicionar / Editar BTC&quot; para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 5 — Altcoins Section */}
      <section className="glass-panel overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 px-5 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
              Altcoins
            </h2>
            <span className="text-xs bg-[#21262d] border border-white/10 px-2 py-0.5 rounded text-white/50 font-mono">
              Total: {formatAmount(metrics.altcoinsTotalUSD)}
            </span>
          </div>
          
          <button
            type="button"
            onClick={handleAltcoinButtonClicked}
            className="flex items-center gap-1.5 btn-primary text-xs text-left w-fit cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>Adicionar Ativo</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-wider font-mono">
                <th className="px-5 py-3.5">Ativo</th>
                <th className="px-5 py-3.5 text-right w-28">Quantidade</th>
                <th className="px-5 py-3.5 text-right w-36">Preço Médio (USD)</th>
                <th className="px-5 py-3.5 text-right w-36">Preço Atual (USD)</th>
                <th className="px-5 py-3.5 text-right w-40">Valor Total</th>
                <th className="px-5 py-3.5 text-right w-36">P&L</th>
                <th className="px-5 py-3.5 text-center w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-xs font-mono">
              {altcoinAssets.length > 0 ? (
                altcoinAssets.map((asset) => {
                  const altCurrentVal = asset.quantity * asset.currentPrice;
                  const altInvestedVal = asset.quantity * asset.averagePrice;
                  const pLVal = altCurrentVal - altInvestedVal;
                  const pLPct = altInvestedVal > 0 ? (pLVal / altInvestedVal) * 100 : 0;
                  return (
                    <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-white font-sans text-sm">{asset.name}</span>
                          <span className="text-white/50 text-xs font-semibold tracking-wider">{asset.ticker}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-white font-semibold">
                        {asset.quantity}
                      </td>
                      <td className="px-5 py-4 text-right text-white/50">
                        USD {asset.averagePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-right text-white">
                        USD {asset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-right text-white font-semibold">
                        {formatAmount(altCurrentVal)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`font-semibold ${pLVal >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                          {pLVal >= 0 ? '+' : ''}
                          {formatAmount(pLVal)}
                        </span>
                        <span className={`text-[10px] block font-semibold ${pLVal >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                          {pLVal >= 0 ? '↑' : '↓'} {pLPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditAssetClicked(asset)}
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
                  <td colSpan={7} className="px-5 py-12 text-center text-white/50 font-medium font-sans">
                    Nenhuma altcoin cadastrada. Clique em &quot;+ Adicionar Ativo&quot; para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 6 — Transaction History Panel */}
      <section className="glass-panel overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <Coins className="w-4 h-4 text-brand-accent" /> Histórico de Transações
            </h2>
          </div>
          
          <button
            type="button"
            onClick={handleAddTxClicked}
            className="flex items-center gap-1.5 btn-primary text-xs text-left w-fit cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-brand-accent" />
            <span>Adicionar Transação</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-wider font-mono">
                <th className="px-5 py-3.5 w-36">Data</th>
                <th className="px-5 py-3.5 w-32">Ativo</th>
                <th className="px-5 py-3.5 w-32 text-center">Tipo</th>
                <th className="px-5 py-3.5 text-right w-32">Quantidade</th>
                <th className="px-5 py-3.5 text-right w-40">Preço Unitário (USD)</th>
                <th className="px-5 py-3.5 text-right w-44">Valor Total</th>
                <th className="px-5 py-3.5">Observações</th>
                <th className="px-5 py-3.5 text-center w-20">Excluir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-xs font-mono">
              {transactions.length > 0 ? (
                transactions.map((tx) => {
                  const txTotalUSD = tx.quantity * tx.unitPriceUSD;
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-white font-semibold">
                        {formatBrazilianDate(tx.date)}
                      </td>
                      <td className="px-5 py-3.5 font-bold uppercase text-brand-accent">
                        {tx.ticker}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {tx.type === 'Compra' ? (
                          <span className="bg-[#22c55e]/10 border border-[#22c55e]/30 text-green-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                            Compra
                          </span>
                        ) : (
                          <span className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                            Venda
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right text-white">
                        {tx.quantity}
                      </td>
                      <td className="px-5 py-3.5 text-right text-white/50">
                        USD {tx.unitPriceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right text-green-500 font-bold">
                        {formatAmount(txTotalUSD)}
                      </td>
                      <td className="px-5 py-3.5 text-white/50 truncate max-w-xs font-sans">
                        {tx.observacoes || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteTx(tx.id)}
                          title="Excluir transação"
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
                  <td colSpan={8} className="px-5 py-12 text-center text-white/50 font-medium font-sans">
                    Nenhuma transação registrada ainda.
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowAssetModal(false)}
        >
          <div 
            className="glass-panel rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative block animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                {isBTCModal ? 'Adicionar / Editar BTC' : editingAsset ? 'Editar Altcoin' : 'Adicionar Altcoin'}
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
                  <label className="text-xs font-semibold text-white/50">Ticker / Símbolo</label>
                  <input
                    required
                    readOnly={isBTCModal}
                    type="text"
                    placeholder="ex: ETH"
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full font-mono font-bold tracking-widest uppercase disabled:opacity-50"
                    value={assetForm.ticker}
                    onChange={(e) => setAssetForm({ ...assetForm, ticker: e.target.value })}
                  />
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Nome</label>
                  <input
                    required
                    readOnly={isBTCModal}
                    type="text"
                    placeholder="ex: Ethereum"
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full font-semibold disabled:opacity-50"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Quantidade</label>
                  <input
                    required
                    type="number"
                    step="any"
                    min="0.0000001"
                    placeholder="ex: 0.15"
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full font-mono"
                    value={assetForm.quantity}
                    onChange={(e) => setAssetForm({ ...assetForm, quantity: e.target.value })}
                  />
                </div>

                {/* Average Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Custo Médio (USD)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-white/50 font-mono font-bold">U$</span>
                    <input
                      required
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="em USD"
                      className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none pl-8 pr-2 py-2 w-full font-mono"
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
                  placeholder="Anotações sobre a carteira desso ativo..."
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

      {/* MODAL — Add / Edit Transaction */}
      {showTxModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowTxModal(false)}
        >
          <div 
            className="glass-panel rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative block animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                ⚙️ {editingTx ? 'Editar Transação' : 'Registrar Transação'}
              </h3>
              <button 
                type="button"
                onClick={() => setShowTxModal(false)}
                className="p-1 hover:bg-white/10 text-white/50 hover:text-white rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTx} className="p-5 space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Data */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-white/50">Data da Operação</label>
                  <input
                    required
                    type="date"
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white rounded-md focus:outline-none p-2 w-full font-mono font-bold"
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Ticker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Ativo (Ticker)</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: ETH"
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full font-mono font-bold uppercase"
                    value={txForm.ticker}
                    onChange={(e) => setTxForm({ ...txForm, ticker: e.target.value })}
                  />
                </div>

                {/* Tipo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Operação</label>
                  <select
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white rounded-md focus:outline-none p-2 w-full cursor-pointer font-bold"
                    value={txForm.type}
                    onChange={(e) => setTxForm({ ...txForm, type: e.target.value as any })}
                  >
                    <option value="Compra">Compra</option>
                    <option value="Venda">Venda</option>
                  </select>
                </div>
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
                    placeholder="ex: 2.5"
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full font-mono"
                    value={txForm.quantity}
                    onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })}
                  />
                </div>

                {/* Preço Unitário em USD */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Preço Unitário (USD)</label>
                  <input
                    required
                    type="number"
                    step="any"
                    min="0.00001"
                    placeholder="em USD"
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full font-mono"
                    value={txForm.unitPriceUSD}
                    onChange={(e) => setTxForm({ ...txForm, unitPriceUSD: e.target.value })}
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50">Observações (opcional)</label>
                <textarea
                  rows={2}
                  placeholder="ex: taxa de rede inclusa..."
                  className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full"
                  value={txForm.observacoes}
                  onChange={(e) => setTxForm({ ...txForm, observacoes: e.target.value })}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
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

    </div>
  );
}
