'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { calculatePortfolioMetrics } from '@/lib/finance/calculations';
import { AllocationChart, NetWorthChart } from './DashboardCharts';
import { TrendingUp, TrendingDown, Wallet, Globe, Coins, ArrowUpRight } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  ticker: string;
  quantity: string;
  averagePrice: string;
  currentPrice?: number;
  currency: 'BRL' | 'USD';
  category: string;
  portfolio: 'brasil' | 'internacional' | 'cripto';
}

export default function DashboardClientPage() {
  const { currency, setCurrency, exchangeRate, formatAmount, convertAmount } = useCurrency();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await fetch('/api/assets');
        if (res.ok) {
          const data = await res.json();
          if (data && data.assets) {
            const rawAssets: Asset[] = data.assets;
            setAssets(rawAssets);

            // Fetch live B3 prices for Brasil portfolio assets
            const brasilTickers = rawAssets
              .filter((a) => a.portfolio === 'brasil' && a.ticker && !a.ticker.toUpperCase().startsWith('CDB') && !a.ticker.toUpperCase().startsWith('TESOURO') && !a.ticker.toUpperCase().includes('CDI'))
              .map((a) => a.ticker);

            if (brasilTickers.length > 0) {
              try {
                const pricesRes = await fetch(`/api/prices/b3?tickers=${encodeURIComponent(brasilTickers.join(','))}`);
                if (pricesRes.ok) {
                  const pricesData = await pricesRes.json();
                  const priceMap: Record<string, number> = pricesData.prices || {};

                  setAssets((prev) =>
                    prev.map((asset) => {
                      const fetchedPrice = priceMap[asset.ticker.toUpperCase()];
                      if (fetchedPrice && fetchedPrice > 0) {
                        return { ...asset, currentPrice: fetchedPrice };
                      }
                      return asset;
                    })
                  );
                }
              } catch (e) {
                console.error('Error fetching live prices for Overview:', e);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load assets', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, []);

  const {
    brasilUSD,
    internacionalUSD,
    criptoUSD,
    totalPortfolioUSD,
    pctBrasil,
    pctIntl,
    pctCripto,
  } = calculatePortfolioMetrics(assets, exchangeRate);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-16">
      
      {/* 1. Header with Page Title and Currency Toggle */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-white/50 text-xs font-semibold tracking-wider uppercase mb-1">
            <span>MyFinance</span>
            <span>/</span>
            <span className="text-white">Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold heading-display mb-1">Dashboard</h1>
          <p className="text-sm text-white/50">Visão geral do seu patrimônio</p>
        </div>
        
        {/* Toggle Button Container strictly preserving format/logic */}
        <div className="flex bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner rounded-md p-1 w-fit self-start sm:self-center">
          <button 
            onClick={() => setCurrency('BRL')}
            className={`px-3 py-1 rounded text-xs font-semibold shadow-sm transition-all cursor-pointer ${
              currency === 'BRL' 
                ? 'bg-[#21262d] text-white border border-white/10' 
                : 'text-white/50 hover:text-white'
            }`}
          >
            BRL
          </button>
          <button 
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1 rounded text-xs font-semibold shadow-sm transition-all cursor-pointer ${
              currency === 'USD' 
                ? 'bg-[#21262d] text-white border border-white/10' 
                : 'text-white/50 hover:text-white'
            }`}
          >
            USD
          </button>
        </div>
      </header>

      {/* 2. Total Net Worth Card (Full Width at Very Top) */}
      <div className="bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner rounded-md p-6 relative overflow-hidden group hover:border-[#388bfd]/30 transition-all shadow-sm">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Patrimônio Total</span>
          <div className="text-4xl font-bold tracking-tight text-white font-mono">
            {loading ? (
              <span className="animate-pulse bg-[#21262d] h-10 w-48 inline-block rounded" />
            ) : (
              formatAmount(totalPortfolioUSD)
            )}
          </div>
          {totalPortfolioUSD > 0 && (
            <div className="flex items-center gap-1.5 text-brand-accent text-xs font-mono font-semibold">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-bold">+2.8%</span> este mês
            </div>
          )}
        </div>
      </div>

      {/* 3. Three Segment Cards side by side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Brasil Card */}
        <Link href="/brasil" className="glass-panel p-5 relative overflow-hidden group hover:border-[#22c55e]/40 transition-all hover:-translate-y-0.5 shadow-sm block">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-[#22c55e]/10 transition-colors" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">🇧🇷</span>
                Brasil
              </h3>
              <ArrowUpRight className="w-3.5 h-3.5 text-white/50 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-semibold font-mono text-white">
                {loading ? (
                  <span className="animate-pulse bg-[#21262d] h-7 w-28 inline-block rounded" />
                ) : (
                  formatAmount(brasilUSD)
                )}
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                {brasilUSD > 0 ? (
                  <span className="text-green-500 font-semibold">+1.2% hoje</span>
                ) : (
                  <span className="text-white/30 font-semibold">-</span>
                )}
                <span className="text-white/50">{pctBrasil.toFixed(1)}% do portfólio</span>
              </div>
            </div>
          </div>
          
          {/* Subtle Progress Bar at Bottom of Card */}
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#161B22] overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-r transition-all duration-500" 
              style={{ width: `${pctBrasil}%` }} 
            />
          </div>
        </Link>

        {/* Internacional Card */}
        <Link href="/internacional" className="glass-panel p-5 relative overflow-hidden group hover:border-[#3b82f6]/40 transition-all hover:-translate-y-0.5 shadow-sm block">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-[#3b82f6]/10 transition-colors" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">🇺🇸</span>
                Internacional
              </h3>
              <ArrowUpRight className="w-3.5 h-3.5 text-white/50 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-semibold font-mono text-white">
                {loading ? (
                  <span className="animate-pulse bg-[#21262d] h-7 w-28 inline-block rounded" />
                ) : (
                  formatAmount(internacionalUSD)
                )}
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                {internacionalUSD > 0 ? (
                  <span className="text-red-400 font-semibold">-0.5% hoje</span>
                ) : (
                  <span className="text-white/30 font-semibold">-</span>
                )}
                <span className="text-white/50">{pctIntl.toFixed(1)}% do portfólio</span>
              </div>
            </div>
          </div>

          {/* Subtle Progress Bar at Bottom of Card */}
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#161B22] overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-r transition-all duration-500" 
              style={{ width: `${pctIntl}%` }} 
            />
          </div>
        </Link>

        {/* Cripto Card */}
        <Link href="/cripto" className="glass-panel p-5 relative overflow-hidden group hover:border-[#f97316]/40 transition-all hover:-translate-y-0.5 shadow-sm block">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f97316]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-[#f97316]/10 transition-colors" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">🪙</span>
                Cripto
              </h3>
              <ArrowUpRight className="w-3.5 h-3.5 text-white/50 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-semibold font-mono text-white">
                {loading ? (
                  <span className="animate-pulse bg-[#21262d] h-7 w-28 inline-block rounded" />
                ) : (
                  formatAmount(criptoUSD)
                )}
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                {criptoUSD > 0 ? (
                  <span className="text-green-500 font-semibold">+5.4% hoje</span>
                ) : (
                  <span className="text-white/30 font-semibold">-</span>
                )}
                <span className="text-white/50">{pctCripto.toFixed(1)}% do portfólio</span>
              </div>
            </div>
          </div>

          {/* Subtle Progress Bar at Bottom of Card */}
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#161B22] overflow-hidden">
            <div 
              className="h-full bg-orange-500 rounded-r transition-all duration-500" 
              style={{ width: `${pctCripto}%` }} 
            />
          </div>
        </Link>

      </div>

      {/* 4. Two Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* Left: Allocation Donut Chart */}
        <div className="glass-panel p-5 flex flex-col h-[350px]">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Alocação por Segmento</h3>
          <div className="flex-1 min-h-0 relative">
            <AllocationChart assets={assets} />
          </div>
        </div>

        {/* Right: Net Worth Evolution Line Chart */}
        <div className="glass-panel p-5 flex flex-col h-[350px]">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Evolução do Patrimônio</h3>
          <div className="flex-1 min-h-0 relative">
            <NetWorthChart />
          </div>
        </div>

      </div>

    </div>
  );
}
