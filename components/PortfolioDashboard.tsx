'use client';

import React, { useState } from 'react';
import { 
  Plus, Edit, Trash2, X, TrendingUp, HelpCircle, AlertCircle,
  Wallet, Bitcoin, Globe
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { addAssetAction, updateAssetAction, deleteAssetAction } from '@/app/actions';
import { Asset } from '@/lib/db';

interface PortfolioDashboardProps {
  portfolio: 'brasil' | 'internacional' | 'cripto';
  title: string;
  icon?: React.ComponentType<any>;
  currency: 'BRL' | 'USD';
  categories: string[];
  initialAssets: Asset[];
}

export function PortfolioDashboard({
  portfolio,
  title,
  icon,
  currency,
  categories,
  initialAssets
}: PortfolioDashboardProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  
  const Icon = portfolio === 'brasil' 
    ? Wallet 
    : portfolio === 'internacional' 
      ? Globe 
      : Bitcoin;
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [category, setCategory] = useState(categories[0] || '');

  const resetForm = () => {
    setName('');
    setTicker('');
    setQuantity('');
    setAveragePrice('');
    setCategory(categories[0] || '');
    setEditingAsset(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setName(asset.name);
    setTicker(asset.ticker);
    setQuantity(asset.quantity);
    setAveragePrice(asset.averagePrice);
    setCategory(asset.category);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ticker || !quantity || !averagePrice) return;

    setIsLoading(true);
    try {
      const assetData = {
        name,
        ticker: ticker.toUpperCase(),
        quantity,
        averagePrice,
        currency,
        category,
        portfolio,
      };

      if (editingAsset) {
        const updated = await updateAssetAction(editingAsset.id, assetData) as Record<string, any>;
        setAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...updated } as Asset : a));
      } else {
        const created = await addAssetAction(assetData);
        setAssets(prev => [...prev, created as Asset]);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar ativo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este ativo do seu portfólio?')) return;

    try {
      await deleteAssetAction(id);
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir ativo.');
    }
  };

  // Calculations
  const totalValue = assets.reduce(
    (acc, a) => acc + (parseFloat(a.quantity) * parseFloat(a.averagePrice)), 
    0
  );

  const formatValue = (val: number) => {
    const symbol = currency === 'BRL' ? 'R$' : 'U$';
    const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
    return `${symbol} ${val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Pie Chart calculations
  const categoryTotals: Record<string, number> = {};
  assets.forEach((a) => {
    categoryTotals[a.category] = (categoryTotals[a.category] || 0) + (parseFloat(a.quantity) * parseFloat(a.averagePrice));
  });

  const chartColors = ['#238636', '#1f6feb', '#bf8700', '#8b5cf6', '#ec4899'];
  const pieData = Object.keys(categoryTotals).map((cat, i) => ({
    name: cat,
    value: categoryTotals[cat],
    color: chartColors[i % chartColors.length]
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16 font-sans">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-sm">Dashboard</span>
          <span className="text-white/50">/</span>
          <span className="text-sm font-semibold flex items-center gap-2 text-white">
            <Icon className="w-4 h-4 text-blue-500" /> {title}
          </span>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] border border-rgba(240,246,252,0.1) text-[#FFFFFF] px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Adicionar Ativo
        </button>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner p-4 rounded-md">
          <div className="text-xs text-white/50 mb-1 uppercase tracking-wider font-bold">Total Portfólio</div>
          <div className="text-2xl font-mono text-white font-semibold">
            {formatValue(totalValue)}
          </div>
        </div>
        
        <div className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner p-4 rounded-md">
          <div className="text-xs text-white/50 mb-1 uppercase tracking-wider font-bold">Total Ativos</div>
          <div className="text-2xl font-mono text-white font-semibold">
            {assets.length}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner p-4 rounded-md flex items-center justify-between">
          <div>
            <div className="text-xs text-white/50 mb-1 uppercase tracking-wider font-bold">Retorno Geral (Anualizado)</div>
            <div className="text-2xl font-mono text-brand-accent font-semibold flex items-center gap-1">
              <TrendingUp className="w-5 h-5 text-green-500" />
              +14.8%
            </div>
          </div>
        </div>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table representation */}
        <div className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner rounded-md overflow-hidden flex flex-col font-mono lg:col-span-2">
          <div className="bg-[#161B22] border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-white/50">Ativos Custodiados</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-white/50 border-b border-white/10 bg-[#0D1117]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">ATIVO / TICKER</th>
                  <th className="px-4 py-2.5 font-medium">CATEGORIA</th>
                  <th className="px-4 py-2.5 font-medium text-right">QUANTIDADE</th>
                  <th className="px-4 py-2.5 font-medium text-right">PREÇO MÉDIO</th>
                  <th className="px-4 py-2.5 font-medium text-right">VALOR TOTAL</th>
                  <th className="px-4 py-2.5 font-medium text-center">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {assets.map((asset) => {
                  const qty = parseFloat(asset.quantity);
                  const price = parseFloat(asset.averagePrice);
                  const total = qty * price;
                  return (
                    <tr key={asset.id} className="hover:bg-[#161B22] transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-blue-400 font-semibold">{asset.name}</div>
                        <div className="text-white/50 text-[10px] font-mono">{asset.ticker}</div>
                      </td>
                      <td className="px-4 py-3 text-white">{asset.category}</td>
                      <td className="px-4 py-3 text-right">{qty.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3 text-right">{formatValue(price)}</td>
                      <td className="px-4 py-3 text-right font-medium text-white">{formatValue(total)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleOpenEditModal(asset)}
                            className="p-1.5 text-white/50 hover:text-blue-400 transition-colors bg-[#21262d] border border-white/10 rounded cursor-pointer"
                            title="Editar Ativo"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(asset.id)}
                            className="p-1.5 text-white/50 hover:text-red-400 transition-colors bg-[#21262d] border border-white/10 rounded cursor-pointer"
                            title="Remover Ativo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {assets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-white/50">
                      Nenhum ativo cadastrado neste segmento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Categories break Chart */}
        <div className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner rounded-md p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold mb-4 uppercase text-white/50 block">Alocação por Tipo</span>
            {assets.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-white/50 text-xs">
                Sem dados suficientes
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any) => formatValue(Number(value))}
                      contentStyle={{ backgroundColor: '#0D1117', borderColor: '#30363D', color: '#E6EDF3', borderRadius: '4px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {assets.length > 0 && (
            <div className="space-y-1.5 mt-4 text-xs font-mono">
              {pieData.map((cat, idx) => {
                const pct = ((cat.value / totalValue) * 100).toFixed(1);
                return (
                  <div key={idx} className="flex items-center justify-between text-white/50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="truncate max-w-[120px]">{cat.name}</span>
                    </div>
                    <span>{pct}% ({formatValue(cat.value)})</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0A0C10]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner rounded-md w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-white/10 bg-[#161B22] rounded-t-md flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {editingAsset ? 'Editar Ativo' : 'Adicionar Ativo'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-3 font-sans">
              <div>
                <label className="block text-xs font-bold text-white/50 mb-1">CUSTODIAN / NOME DA EMPRESA</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-[#0A0C10] border border-white/10 rounded p-2 text-sm text-white placeholder-[#8B949E]/70 focus:outline-none focus:border-blue-500 font-mono" 
                  placeholder="ex. Apple Inc, Weg S.A." 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-1">TICKER / SÍMBOLO</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-[#0A0C10] border border-white/10 rounded p-2 text-sm text-white placeholder-[#8B949E]/70 focus:outline-none focus:border-blue-500 uppercase font-mono" 
                    placeholder="ex. AAPL, WEGE3" 
                    value={ticker} 
                    onChange={e => setTicker(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-1">CATEGORIA</label>
                  <select 
                    className="w-full bg-[#0A0C10] border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono" 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-1">QUANTIDADE</label>
                  <input 
                    required 
                    type="number" 
                    step="any"
                    className="w-full bg-[#0A0C10] border border-white/10 rounded p-2 text-sm text-white placeholder-[#8B949E]/70 focus:outline-none focus:border-blue-500 font-mono" 
                    placeholder="0.00" 
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-1">CUSTO MÉDIO UNID. ({currency})</label>
                  <input 
                    required 
                    type="number" 
                    step="any"
                    className="w-full bg-[#0A0C10] border border-white/10 rounded p-2 text-sm text-white placeholder-[#8B949E]/70 focus:outline-none focus:border-blue-500 font-mono" 
                    placeholder="0.00" 
                    value={averagePrice} 
                    onChange={e => setAveragePrice(e.target.value)} 
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 bg-[#21262d] border border-white/10 hover:bg-[#30363D] text-white py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-[#238636] hover:bg-[#2ea043] border border-[rgba(240,246,252,0.1)] text-[#FFFFFF] py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Ativo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
