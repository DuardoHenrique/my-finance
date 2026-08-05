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
  Plus, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  Calendar, 
  X, 
  ChevronRight, 
  FileSpreadsheet,
  Coins
} from 'lucide-react';
import { B3ImportModal } from '@/components/B3ImportModal';

// Interfaces
interface Asset {
  id: string;
  name: string;
  ticker: string;
  category: 'Renda Fixa' | 'Ações' | 'FIIs';
  quantity: number;
  averagePrice: number; // in BRL
  currentPrice: number; // in BRL
  observacoes?: string;
}

interface Provento {
  id: string;
  ticker: string;
  type: 'Dividendo' | 'JCP' | 'Rendimento';
  amountBRL: number;
  date: string; // YYYY-MM-DD
  observacoes?: string;
}

// Initial realistic mock data as specified
const INITIAL_ASSETS: Asset[] = [
  { id: 'b1', name: 'Tesouro Selic 2029', ticker: 'LFT2029', category: 'Renda Fixa', quantity: 1, averagePrice: 14200.00, currentPrice: 14550.00, observacoes: 'Reserva de liquidez principal' },
  { id: 'b2', name: 'CDB Banco Master 120% CDI', ticker: 'CDB-MASTER', category: 'Renda Fixa', quantity: 1, averagePrice: 20000.00, currentPrice: 21150.00, observacoes: 'IPCA+ garantido médio prazo' },
  { id: 'b3', name: 'Petrobras S.A.', ticker: 'PETR4', category: 'Ações', quantity: 150, averagePrice: 32.50, currentPrice: 38.20, observacoes: 'Foco em altos proventos e dividendos' },
  { id: 'b4', name: 'Vale S.A.', ticker: 'VALE3', category: 'Ações', quantity: 80, averagePrice: 68.00, currentPrice: 62.10, observacoes: 'Exposição global a commodities' },
  { id: 'b5', name: 'Itaú Unibanco S.A.', ticker: 'ITUB4', category: 'Ações', quantity: 120, averagePrice: 28.50, currentPrice: 33.90, observacoes: 'Excelente governança financeira' },
  { id: 'b6', name: 'CSHG Logística FII', ticker: 'HGLG11', category: 'FIIs', quantity: 30, averagePrice: 162.00, currentPrice: 166.50, observacoes: 'Ótima carteira de galpões logísticos' },
  { id: 'b7', name: 'Maxi Renda FII', ticker: 'MXRF11', category: 'FIIs', quantity: 500, averagePrice: 10.15, currentPrice: 10.45, observacoes: 'Fundo de papel de alta liquidez' }
];

const INITIAL_PROVENTOS: Provento[] = [
  { id: 'p1', ticker: 'ITUB4', type: 'JCP', amountBRL: 28.80, date: '2025-07-01', observacoes: 'Provento recorrente mensal' },
  { id: 'p2', ticker: 'HGLG11', type: 'Rendimento', amountBRL: 33.00, date: '2025-07-15', observacoes: 'Distribuição mensal' },
  { id: 'p3', ticker: 'MXRF11', type: 'Rendimento', amountBRL: 50.00, date: '2025-07-15', observacoes: 'Rendimentos das cotas' },
  { id: 'p4', ticker: 'PETR4', type: 'Dividendo', amountBRL: 120.00, date: '2025-08-20', observacoes: 'Distribuição trimestral extraordinária' },
  { id: 'p5', ticker: 'HGLG11', type: 'Rendimento', amountBRL: 33.00, date: '2025-08-15', observacoes: 'FII HGLG11' },
  { id: 'p6', ticker: 'MXRF11', type: 'Rendimento', amountBRL: 50.00, date: '2025-08-15', observacoes: 'Cotas papel' },
  { id: 'p7', ticker: 'VALE3', type: 'Dividendo', amountBRL: 180.00, date: '2025-09-10', observacoes: 'Vale S.A. proventos' },
  { id: 'p8', ticker: 'HGLG11', type: 'Rendimento', amountBRL: 33.00, date: '2025-09-15', observacoes: 'Mensal' },
  { id: 'p9', ticker: 'MXRF11', type: 'Rendimento', amountBRL: 50.00, date: '2025-09-15', observacoes: 'Mensal' },
  { id: 'p10', ticker: 'PETR4', type: 'Dividendo', amountBRL: 145.00, date: '2025-11-20', observacoes: 'Distribuição regulamentar' },
  { id: 'p11', ticker: 'HGLG11', type: 'Rendimento', amountBRL: 33.00, date: '2025-10-15', observacoes: 'Cotas mensais' },
  { id: 'p12', ticker: 'MXRF11', type: 'Rendimento', amountBRL: 50.00, date: '2025-10-15', observacoes: 'Rendimento mensal' },
  { id: 'p13', ticker: 'ITUB4', type: 'JCP', amountBRL: 31.20, date: '2025-11-01', observacoes: 'JCP pago' },
  { id: 'p14', ticker: 'HGLG11', type: 'Rendimento', amountBRL: 33.00, date: '2025-11-15', observacoes: 'Rendimento' },
  { id: 'p15', ticker: 'MXRF11', type: 'Rendimento', amountBRL: 50.00, date: '2025-11-15', observacoes: 'Rendimento' },
  { id: 'p16', ticker: 'VALE3', type: 'Dividendo', amountBRL: 210.00, date: '2025-12-15', observacoes: 'Distribuição final de ano' },
  { id: 'p17', ticker: 'HGLG11', type: 'Rendimento', amountBRL: 33.00, date: '2025-12-15', observacoes: 'Rendimento FII' },
  { id: 'p18', ticker: 'MXRF11', type: 'Rendimento', amountBRL: 50.00, date: '2025-12-15', observacoes: 'Fechamento de ano' },
  { id: 'p19', ticker: 'HGLG11', type: 'Rendimento', amountBRL: 33.00, date: '2026-01-15', observacoes: 'Rendimento de janeiro' },
  { id: 'p20', ticker: 'MXRF11', type: 'Rendimento', amountBRL: 50.00, date: '2026-01-15', observacoes: 'MXRF11 recorrente' },
  { id: 'p21', ticker: 'PETR4', type: 'Dividendo', amountBRL: 165.00, date: '2026-02-20', observacoes: 'Extraordinário Petrobras' },
  { id: 'p22', ticker: 'HGLG11', type: 'Rendimento', amountBRL: 33.00, date: '2026-02-15', observacoes: 'Rendimento fevereiro' },
  { id: 'p23', ticker: 'MXRF11', type: 'Rendimento', amountBRL: 50.00, date: '2026-02-15', observacoes: 'Papel fevereiro' },
  { id: 'p24', ticker: 'HGLG11', type: 'Rendimento', amountBRL: 33.00, date: '2026-03-15', observacoes: 'Março' },
  { id: 'p25', ticker: 'MXRF11', type: 'Rendimento', amountBRL: 50.00, date: '2026-03-15', observacoes: 'Março' },
  { id: 'p26', ticker: 'HGLG11', type: 'Rendimento', amountBRL: 33.00, date: '2026-04-15', observacoes: 'Galpões' },
  { id: 'p27', ticker: 'MXRF11', type: 'Rendimento', amountBRL: 50.00, date: '2026-04-15', observacoes: 'CRI e debêntures' },
  { id: 'p28', ticker: 'HGLG11', type: 'Rendimento', amountBRL: 33.00, date: '2026-05-15', observacoes: 'Ativo' },
  { id: 'p29', ticker: 'MXRF11', type: 'Rendimento', amountBRL: 50.00, date: '2026-05-15', observacoes: 'Cotação' }
];

// Custom tooltip components
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

export default function BrasilPage() {
  const { currency, exchangeRate } = useCurrency();

  // Component React State
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [proventos, setProventos] = useState<Provento[]>(INITIAL_PROVENTOS);

  // Modal Control States
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [showProventoModal, setShowProventoModal] = useState(false);
  const [selectedTickerForProvento, setSelectedTickerForProvento] = useState('');

  const [showB3Modal, setShowB3Modal] = useState(false);

  const handleB3ImportSuccess = (importedB3Assets: any[]) => {
    setAssets((prevAssets) => {
      const updated = [...prevAssets];
      importedB3Assets.forEach((b3Item) => {
        const existingIdx = updated.findIndex((a) => a.ticker.toUpperCase() === b3Item.ticker.toUpperCase());
        const simulatedCurrentPrice = parseFloat((b3Item.averagePrice * (1 + (Math.random() * 0.15 - 0.02))).toFixed(2));
        
        if (existingIdx >= 0) {
          const newQty = updated[existingIdx].quantity + b3Item.quantity;
          const totalSpent = (updated[existingIdx].quantity * updated[existingIdx].averagePrice) + (b3Item.quantity * b3Item.averagePrice);
          const newAvgPrice = newQty > 0 ? totalSpent / newQty : b3Item.averagePrice;
          
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: newQty,
            averagePrice: parseFloat(newAvgPrice.toFixed(2)),
            currentPrice: simulatedCurrentPrice,
          };
        } else {
          updated.push({
            id: b3Item.id || `b3-${Math.random().toString(36).substring(2, 9)}`,
            name: b3Item.name,
            ticker: b3Item.ticker.toUpperCase(),
            category: b3Item.category as 'Ações' | 'FIIs' | 'Renda Fixa',
            quantity: b3Item.quantity,
            averagePrice: b3Item.averagePrice,
            currentPrice: simulatedCurrentPrice,
            observacoes: b3Item.institution ? `Importado via B3 (${b3Item.institution})` : 'Importado via B3'
          });
        }
      });
      return updated;
    });
  };

  // Asset Form fields
  const [assetForm, setAssetForm] = useState({
    name: '',
    ticker: '',
    category: 'Ações' as 'Renda Fixa' | 'Ações' | 'FIIs',
    quantity: '',
    averagePrice: '',
    observacoes: ''
  });

  // Provento Form fields
  const [proventoForm, setProventoForm] = useState({
    type: 'Dividendo' as 'Dividendo' | 'JCP' | 'Rendimento',
    amountBRL: '',
    date: new Date().toISOString().substring(0, 10),
    observacoes: ''
  });

  // Close modals on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAssetModal(false);
        setShowProventoModal(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // BRL Conversion Helpers for responsive currency toggle support 
  const convertBRLAmount = (amountBRL: number) => {
    if (currency === 'BRL') {
      return amountBRL;
    }
    return amountBRL / exchangeRate;
  };

  const formatBRLAmount = (amountBRL: number) => {
    const converted = convertBRLAmount(amountBRL);
    if (currency === 'BRL') {
      return `R$ ${converted.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `US$ ${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  // Compute calculated metrics
  const calculatedMetrics = useMemo(() => {
    const currentYear = new Date().getFullYear();

    // Total Portfolio Value in BRL
    const totalBrasilBRL = assets.reduce(
      (sum, item) => sum + item.quantity * item.currentPrice,
      0
    );

    // Total Proventos Lifetime in BRL
    const totalProventosLifeBRL = proventos.reduce(
      (sum, item) => sum + item.amountBRL,
      0
    );

    // Total Proventos received this current Year in BRL
    const totalProventosCurrentYearBRL = proventos
      .filter((item) => new Date(item.date).getFullYear() === currentYear)
      .reduce((sum, item) => sum + item.amountBRL, 0);

    // Distribution by category
    const categoryTotals = assets.reduce(
      (acc, item) => {
        const val = item.quantity * item.currentPrice;
        acc[item.category] += val;
        return acc;
      },
      { 'Renda Fixa': 0, 'Ações': 0, 'FIIs': 0 }
    );

    return {
      totalBrasilBRL,
      totalProventosLifeBRL,
      totalProventosCurrentYearBRL,
      categoryTotals,
      currentYear
    };
  }, [assets, proventos]);

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
  const handleAddAssetClick = (category?: 'Renda Fixa' | 'Ações' | 'FIIs') => {
    setEditingAsset(null);
    setAssetForm({
      name: '',
      ticker: '',
      category: category || 'Ações',
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
      // Optionally clean up proventos associated with this ticker
      setProventos(proventos.filter((d) => d.ticker !== ticker));
    }
  };

  // Save Asset Form submission (Add / Edit)
  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(assetForm.quantity);
    const avgPrice = parseFloat(assetForm.averagePrice);

    if (isNaN(qty) || qty <= 0 || isNaN(avgPrice) || avgPrice < 0) {
      alert('Por favor, preencha quantidade e preço de compra válidos.');
      return;
    }

    if (!assetForm.name.trim() || !assetForm.ticker.trim()) {
      alert('Por favor, digite o nome e o ticker/símbolo do ativo.');
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
      // Generate simulated current price close to average price for realistic behavior
      const simulatedCurrentPrice = avgPrice * (1 + (Math.random() * 0.3 - 0.05)); // -5% to +25%
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

  // Trigger Add Provento Modal
  const handleRecordProventoClick = (ticker: string) => {
    setSelectedTickerForProvento(ticker);
    setProventoForm({
      type: 'Dividendo',
      amountBRL: '',
      date: new Date().toISOString().substring(0, 10),
      observacoes: ''
    });
    setShowProventoModal(true);
  };

  // Save Provento Entry
  const handleRegisterProvento = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(proventoForm.amountBRL);

    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Por favor, insira um valor válido de provento em BRL.');
      return;
    }

    const newProv: Provento = {
      id: `p-${Math.random().toString(36).substring(2, 9)}`,
      ticker: selectedTickerForProvento,
      type: proventoForm.type,
      amountBRL: amountVal,
      date: proventoForm.date,
      observacoes: proventoForm.observacoes.trim()
    };

    setProventos([newProv, ...proventos]);
    setShowProventoModal(false);
  };

  // Delete Provento receipt
  const handleDeleteProvento = (id: string) => {
    if (confirm('Deseja excluir esse lançamento de provento?')) {
      setProventos(proventos.filter((d) => d.id !== id));
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
    const total = calculatedMetrics.totalBrasilBRL;
    if (total <= 0) return [];

    return [
      {
        name: 'Renda Fixa',
        value: convertBRLAmount(calculatedMetrics.categoryTotals['Renda Fixa']),
        rawBRL: calculatedMetrics.categoryTotals['Renda Fixa'],
        formattedValue: formatBRLAmount(calculatedMetrics.categoryTotals['Renda Fixa']),
        percentage: (calculatedMetrics.categoryTotals['Renda Fixa'] / total) * 100,
        fill: '#bf8700'
      },
      {
        name: 'Ações',
        value: convertBRLAmount(calculatedMetrics.categoryTotals.Ações),
        rawBRL: calculatedMetrics.categoryTotals.Ações,
        formattedValue: formatBRLAmount(calculatedMetrics.categoryTotals.Ações),
        percentage: (calculatedMetrics.categoryTotals.Ações / total) * 100,
        fill: '#1f6feb'
      },
      {
        name: 'FIIs',
        value: convertBRLAmount(calculatedMetrics.categoryTotals.FIIs),
        rawBRL: calculatedMetrics.categoryTotals.FIIs,
        formattedValue: formatBRLAmount(calculatedMetrics.categoryTotals.FIIs),
        percentage: (calculatedMetrics.categoryTotals.FIIs / total) * 100,
        fill: '#8b5cf6'
      }
    ].filter(item => item.rawBRL > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedMetrics]);

  // Recharts Monthly Proventos Last 12 Months
  const proventosChartData = useMemo(() => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const today = new Date();
    
    // Generate sequential 12 months array finishing at today
    const monthsResult: { key: string; label: string; monthIndex: number; year: number; totalBRL: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      monthsResult.push({
        key: `${yr}-${String(mIdx + 1).padStart(2, '0')}`,
        label: `${monthNames[mIdx]} ${String(yr).substring(2)}`,
        monthIndex: mIdx,
        year: yr,
        totalBRL: 0
      });
    }

    // Populate with proventos
    proventos.forEach((prov) => {
      try {
        const parts = prov.date.split('-');
        if (parts.length === 3) {
          const yr = parseInt(parts[0]);
          const mo = parseInt(parts[1]);
          const formattedKey = `${yr}-${String(mo).padStart(2, '0')}`;
          
          const matchMonth = monthsResult.find(m => m.key === formattedKey);
          if (matchMonth) {
            matchMonth.totalBRL += prov.amountBRL;
          }
        }
      } catch (err) {
        console.error('Error parsing provento date', err);
      }
    });

    // Output mapped in selected currency
    return monthsResult.map((m) => ({
      label: m.label,
      value: currency === 'BRL' ? m.totalBRL : m.totalBRL / exchangeRate
    }));
  }, [proventos, currency, exchangeRate]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-16">
      
      {/* SECTION 1 — Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-white/50 text-xs font-semibold tracking-wider uppercase mb-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3 text-[#30363D]" />
            <span className="text-white">Brasil</span>
          </div>
          <h1 className="text-3xl font-bold heading-display mb-1 flex items-center gap-2">
            <span className="text-xl">🇧🇷</span> Brasil
          </h1>
          <p className="text-sm text-white/50">Ativos de Renda Fixa, Ações e Fundos Imobiliários nacionais</p>
        </div>

        <button
          type="button"
          onClick={() => setShowB3Modal(true)}
          className="flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] border border-white/10 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-lg hover:shadow-green-950/30 font-sans"
        >
          <FileSpreadsheet className="w-4 h-4 text-green-300" />
          <span>Importar Relatório B3 (.xlsx)</span>
        </button>
      </header>

      {/* SECTION 2 — Summary Cards Row (3 cards side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1 — Total Brasil */}
        <div className="glass-panel glass-panel-hover overflow-hidden group relative p-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#bf8700]/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Total Brasil</span>
            <div className="text-4xl font-bold heading-display mb-1 font-mono">
              {formatBRLAmount(calculatedMetrics.totalBrasilBRL)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-green-500 font-semibold pt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+4.2% este mês</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#bf8700]" />
        </div>

        {/* Card 2 — Proventos Recebidos */}
        <div className="glass-panel glass-panel-hover overflow-hidden group relative p-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#22c55e]/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Proventos Recebidos</span>
            <div className="text-4xl font-bold heading-display mb-1 font-mono">
              {formatBRLAmount(calculatedMetrics.totalProventosLifeBRL)}
            </div>
            <span className="text-xs text-white/50 block pt-1">histórico total acumulado</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#22c55e]" />
        </div>

        {/* Card 3 — Proventos (Ano Atual) */}
        <div className="glass-panel glass-panel-hover overflow-hidden group relative p-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block">
              Proventos em {calculatedMetrics.currentYear}
            </span>
            <div className="text-4xl font-bold heading-display mb-1 font-mono">
              {formatBRLAmount(calculatedMetrics.totalProventosCurrentYearBRL)}
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
              { name: 'Renda Fixa', pct: calculatedMetrics.totalBrasilBRL > 0 ? (calculatedMetrics.categoryTotals['Renda Fixa'] / calculatedMetrics.totalBrasilBRL) * 100 : 0, fill: '#bf8700' },
              { name: 'Ações', pct: calculatedMetrics.totalBrasilBRL > 0 ? (calculatedMetrics.categoryTotals.Ações / calculatedMetrics.totalBrasilBRL) * 100 : 0, fill: '#1f6feb' },
              { name: 'FIIs', pct: calculatedMetrics.totalBrasilBRL > 0 ? (calculatedMetrics.categoryTotals.FIIs / calculatedMetrics.totalBrasilBRL) * 100 : 0, fill: '#8b5cf6' }
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

        {/* Chart 2 Right — Proventos per Month (Bar chart) */}
        <div className="glass-panel p-5 flex flex-col h-[360px] justify-between">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Proventos por Mês</h3>
          
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={proventosChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
        
        {(['Renda Fixa', 'Ações', 'FIIs'] as const).map((catName) => {
          const categoryAssets = assets.filter((a) => a.category === catName);
          const categoryTotalBRL = categoryAssets.reduce((sum, item) => sum + item.quantity * item.currentPrice, 0);

          return (
            <section key={catName} className="glass-panel overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 px-5 py-4 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                    {catName}
                  </h2>
                  <span className="text-xs bg-[#21262d] border border-white/10 px-2 py-0.5 rounded text-white/50 font-mono">
                    Total: {formatBRLAmount(categoryTotalBRL)}
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
                      <th className="px-5 py-3.5 text-right w-36">Custo Médio (BRL)</th>
                      <th className="px-5 py-3.5 text-right w-36">Preço Atual (BRL)</th>
                      <th className="px-5 py-3.5 text-right w-40">Valor Total</th>
                      <th className="px-5 py-3.5 text-right w-36">P&L</th>
                      {catName !== 'Renda Fixa' && <th className="px-5 py-3.5 text-right w-36">Proventos</th>}
                      <th className="px-5 py-3.5 text-center w-36">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-xs font-mono">
                    {categoryAssets.length > 0 ? (
                      categoryAssets.map((asset) => {
                        const totalValBRL = asset.quantity * asset.currentPrice;
                        const investedValBRL = asset.quantity * asset.averagePrice;
                        const pAndLBRL = totalValBRL - investedValBRL;
                        const pAndLPercentage = investedValBRL > 0 ? (pAndLBRL / investedValBRL) * 100 : 0;
                        
                        // Sum total proventos for this ticker
                        const assetProventosBRL = proventos
                          .filter((d) => d.ticker.toUpperCase() === asset.ticker.toUpperCase())
                          .reduce((sum, item) => sum + item.amountBRL, 0);

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
                            {/* Preço de Compra in BRL */}
                            <td className="px-5 py-4 text-right text-white/50 font-mono">
                              R$ {asset.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            {/* Preço Atual in BRL */}
                            <td className="px-5 py-4 text-right text-white font-mono">
                              R$ {asset.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            {/* Valor Total converted */}
                            <td className="px-5 py-4 text-right text-white font-semibold font-mono">
                              {formatBRLAmount(totalValBRL)}
                            </td>
                            {/* P&L converted and percentage */}
                            <td className="px-5 py-4 text-right font-mono">
                              <span className={`font-semibold ${pAndLBRL >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                                {pAndLBRL >= 0 ? '+' : ''}
                                {formatBRLAmount(pAndLBRL)}
                              </span>
                              <span className={`text-[10px] block font-semibold ${pAndLBRL >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                                {pAndLBRL >= 0 ? '↑' : '↓'} {pAndLPercentage.toFixed(1)}%
                              </span>
                            </td>
                            {/* Proventos converted with column excluded for Renda Fixa */}
                            {catName !== 'Renda Fixa' && (
                              <td className="px-5 py-4 text-right text-white font-mono">
                                {formatBRLAmount(assetProventosBRL)}
                              </td>
                            )}
                            {/* Actions Column */}
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {catName !== 'Renda Fixa' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRecordProventoClick(asset.ticker)}
                                    title="Registrar provento em BRL"
                                    className="flex items-center gap-1 bg-[#1f6feb]/10 hover:bg-[#1f6feb]/25 border border-[#1f6feb]/30 text-brand-accent hover:text-white px-2 py-1 rounded text-[11px] font-semibold font-sans transition-all cursor-pointer"
                                  >
                                    <span>R$+</span>
                                  </button>
                                )}
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
                        <td colSpan={catName === 'Renda Fixa' ? 7 : 8} className="px-5 py-12 text-center text-white/50 font-medium font-sans">
                          Nenhum ativo cadastrado. Clique em &quot;+ Adicionar Ativo&quot; para começar.
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

      {/* SECTION 5 — Proventos History Panel */}
      <section className="glass-panel overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#22c55e]" /> Histórico de Proventos
            </h2>
          </div>
          
          <div className="bg-[#21262d] border border-white/10 rounded-md px-3.5 py-1.5 text-xs text-white flex items-center gap-1.5 font-bold font-mono">
            <span>Total recebido:</span> 
            <span className="text-[#22c55e]">
              {formatBRLAmount(calculatedMetrics.totalProventosLifeBRL)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-wider font-mono">
                <th className="px-5 py-3.5 w-36">Data</th>
                <th className="px-5 py-3.5 w-32">Ativo</th>
                <th className="px-5 py-3.5 w-32 text-center">Tipo</th>
                <th className="px-5 py-3.5 text-right w-44">Valor Nacional (BRL)</th>
                <th className="px-5 py-3.5 text-right w-44">Valor Convertido</th>
                <th className="px-5 py-3.5">Observações</th>
                <th className="px-5 py-3.5 text-center w-20">Excluir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-xs font-mono">
              {proventos.length > 0 ? (
                proventos.map((prov) => {
                  return (
                    <tr key={prov.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Data */}
                      <td className="px-5 py-3.5 text-white font-semibold">
                        {formatBrazilianDate(prov.date)}
                      </td>
                      {/* Ativo */}
                      <td className="px-5 py-3.5 font-bold uppercase text-brand-accent">
                        {prov.ticker}
                      </td>
                      {/* Tipo */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="bg-[#21262d] border border-white/10 text-white/50 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                          {prov.type}
                        </span>
                      </td>
                      {/* Valor em BRL */}
                      <td className="px-5 py-3.5 text-right text-white/50">
                        R$ {prov.amountBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {/* Valor Convertido */}
                      <td className="px-5 py-3.5 text-right text-green-500 font-bold">
                        {formatBRLAmount(prov.amountBRL)}
                      </td>
                      {/* Observações */}
                      <td className="px-5 py-3.5 text-white/50 truncate max-w-xs overflow-hidden font-sans">
                        {prov.observacoes || '—'}
                      </td>
                      {/* Excluir button */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteProvento(prov.id)}
                          title="Excluir lançamento"
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
                  <td colSpan={7} className="px-5 py-12 text-center text-white/50 font-medium font-sans">
                    Nenhum provento registrado ainda.
                    <br />
                    Para registrar, use o botão <span className="bg-[#1f6feb]/10 text-brand-accent px-1.5 py-0.5 rounded text-[10px] font-bold">R$+</span> na tabela de Ações ou FIIs.
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
            className="glass-panel rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative block animate-in fade-in zoom-in-95 duration-150"
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
                {/* Ticker / Símbolo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Ticker / Símbolo</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: PETR4"
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
                    <option value="Renda Fixa">Renda Fixa</option>
                    <option value="Ações">Ações</option>
                    <option value="FIIs">FIIs</option>
                  </select>
                </div>
              </div>

              {/* Nome do Ativo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50">Nome do Ativo</label>
                <input
                  required
                  type="text"
                  placeholder="ex: Petrobras S.A."
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
                    placeholder="ex: 150"
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full font-mono"
                    value={assetForm.quantity}
                    onChange={(e) => setAssetForm({ ...assetForm, quantity: e.target.value })}
                  />
                </div>

                {/* Custo Médio em BRL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Custo Médio / Unid (BRL)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-white/50 font-mono font-bold">R$</span>
                    <input
                      required
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="ex: 32.50"
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
                  placeholder="Anotações sobre a compra desso ativo..."
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

      {/* MODAL — Add Provento (Dividend/JCP/Rendimento Entry) */}
      {showProventoModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowProventoModal(false)}
        >
          <div 
            className="glass-panel rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative block animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5 animate-pulse">
                💰 Registrar Provento ({selectedTickerForProvento})
              </h3>
              <button 
                type="button"
                onClick={() => setShowProventoModal(false)}
                className="p-1 hover:bg-white/10 text-white/50 hover:text-white rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterProvento} className="p-5 space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-2 gap-4 text-left">
                {/* Tipo de Provento */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-white/50">Tipo de Distribuição</label>
                  <select
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white rounded-md focus:outline-none p-2 w-full cursor-point"
                    value={proventoForm.type}
                    onChange={(e) => setProventoForm({ ...proventoForm, type: e.target.value as any })}
                  >
                    <option value="Dividendo">Dividendo</option>
                    <option value="JCP">JCP (Juros sobre Capital Próprio)</option>
                    <option value="Rendimento">Rendimento (FII)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Valor em BRL */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-white/50">Valor Recebido (em BRL)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-white/50 font-mono font-bold">R$</span>
                    <input
                      required
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="ex: 120.00"
                      className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none pl-8 pr-2 py-2 w-full font-mono"
                      value={proventoForm.amountBRL}
                      onChange={(e) => setProventoForm({ ...proventoForm, amountBRL: e.target.value })}
                    />
                  </div>
                </div>

                {/* Data do pagamento */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-white/50 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" /> Data do Pagamento
                  </label>
                  <input
                    required
                    type="date"
                    className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white rounded-md focus:outline-none p-2 w-full font-mono cursor-pointer"
                    value={proventoForm.date}
                    onChange={(e) => setProventoForm({ ...proventoForm, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-white/50">Observações (opcional)</label>
                <textarea
                  rows={2}
                  placeholder="ex: Rendimento das 500 cotas"
                  className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner focus:border-[#3b82f6] text-white placeholder:text-white/50/40 rounded-md focus:outline-none p-2 w-full"
                  value={proventoForm.observacoes}
                  onChange={(e) => setProventoForm({ ...proventoForm, observacoes: e.target.value })}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowProventoModal(false)}
                  className="btn-primary text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#22c55e] hover:bg-[#1f9b4c] text-white text-xs font-bold rounded-md px-4 py-2 transition-all cursor-pointer"
                >
                  Registrar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* B3 Excel Import Modal */}
      <B3ImportModal
        isOpen={showB3Modal}
        onClose={() => setShowB3Modal(false)}
        onImportSuccess={handleB3ImportSuccess}
      />

    </div>
  );
}
