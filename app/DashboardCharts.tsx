'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useCurrency } from '@/lib/context/CurrencyContext';

interface ChartAsset {
  quantity: string;
  averagePrice: string;
  currency?: string;
  portfolio: string;
}

const CustomDonutTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0D1117] border border-[#30363D] p-3 rounded-md shadow-lg text-xs">
        <p className="font-bold text-[#E6EDF3] mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: data.fill }} />
          {data.name}
        </p>
        <p className="text-[#8B949E] font-mono">
          Valor: <span className="text-[#E6EDF3]">{data.formattedVal}</span>
        </p>
        <p className="text-[#8B949E] font-mono">
          Alocação: <span className="text-[#E6EDF3]">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export function AllocationChart({ assets }: { assets: ChartAsset[] }) {
  const { currency, exchangeRate, convertAmount, formatAmount } = useCurrency();

  // Calculate totals per segment in USD internally
  let brasil = 0;
  let internacional = 0;
  let cripto = 0;

  assets.forEach((a) => {
    const qty = parseFloat(a.quantity) || 0;
    const currentP = typeof (a as any).currentPrice === 'number' && (a as any).currentPrice > 0 ? (a as any).currentPrice : null;
    const price = currentP ?? (parseFloat(a.averagePrice) || 0);
    const nativeVal = qty * price;
    const assetCurrency = a.currency || (a.portfolio === 'brasil' ? 'BRL' : 'USD');

    let valInUSD = 0;
    if (assetCurrency === 'USD') {
      valInUSD = nativeVal;
    } else {
      valInUSD = nativeVal / exchangeRate;
    }

    if (a.portfolio === 'brasil') {
      brasil += valInUSD;
    } else if (a.portfolio === 'internacional') {
      internacional += valInUSD;
    } else if (a.portfolio === 'cripto') {
      cripto += valInUSD;
    }
  });

  const totalUSD = brasil + internacional + cripto;
  const pctBrasil = totalUSD > 0 ? (brasil / totalUSD) * 100 : 0;
  const pctIntl = totalUSD > 0 ? (internacional / totalUSD) * 100 : 0;
  const pctCripto = totalUSD > 0 ? (cripto / totalUSD) * 100 : 0;

  const chartData = [
    { name: 'Brasil', value: convertAmount(brasil), rawUSD: brasil, formattedVal: formatAmount(brasil), percentage: pctBrasil, fill: '#22c55e' },
    { name: 'Internacional', value: convertAmount(internacional), rawUSD: internacional, formattedVal: formatAmount(internacional), percentage: pctIntl, fill: '#3b82f6' },
    { name: 'Cripto', value: convertAmount(cripto), rawUSD: cripto, formattedVal: formatAmount(cripto), percentage: pctCripto, fill: '#f97316' },
  ].filter(item => item.rawUSD > 0); // Hide empty segments to keep the donut beautiful

  // If no assets yet, show empty/placeholder slice
  const displayData = chartData.length > 0 ? chartData : [
    { name: 'Sem Ativos', value: 1, rawUSD: 0, formattedVal: formatAmount(0), percentage: 0, fill: '#8B949E' }
  ];

  return (
    <div className="flex flex-col h-full justify-between gap-4">
      <div className="flex-1 min-h-[160px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={displayData} 
              innerRadius={55} 
              outerRadius={75} 
              paddingAngle={chartData.length > 1 ? 4 : 0} 
              dataKey="value" 
              stroke="none"
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomDonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend with segment name, percentage and color dot */}
      <div className="grid grid-cols-3 gap-2 border-t border-[#30363D] pt-4">
        {[
          { name: 'Brasil', percentage: pctBrasil, fill: '#22c55e' },
          { name: 'Internacional', percentage: pctIntl, fill: '#3b82f6' },
          { name: 'Cripto', percentage: pctCripto, fill: '#f97316' },
        ].map((item) => (
          <div key={item.name} className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
              <span className="text-xs font-semibold text-[#E6EDF3]">{item.name}</span>
            </div>
            <span className="text-xs font-mono text-[#8B949E]">{item.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const CustomLineTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-[#0D1117] border border-[#30363D] p-3 rounded-md shadow-lg text-xs font-mono">
        <p className="text-[#8B949E] mb-1">{payload[0].payload.timestamp}</p>
        <p className="font-bold text-[#E6EDF3]">
          {currency === 'BRL' ? 'R$' : 'US$'} {val.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export function NetWorthChart() {
  const { currency, exchangeRate } = useCurrency();

  // Internal values stored in USD
  const baseHistoryUSD = [
    { timestamp: 'Jan', valueUSD: 31200 },
    { timestamp: 'Fev', valueUSD: 32500 },
    { timestamp: 'Mar', valueUSD: 33100 },
    { timestamp: 'Abr', valueUSD: 34200 },
    { timestamp: 'Mai', valueUSD: 35100 },
    { timestamp: 'Jun', valueUSD: 36275 },
  ];

  const history = baseHistoryUSD.map((h) => ({
    timestamp: h.timestamp,
    value: currency === 'USD' ? h.valueUSD : h.valueUSD * exchangeRate,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={history}>
        <CartesianGrid strokeDasharray="2 2" stroke="#30363D" vertical={false} />
        <XAxis dataKey="timestamp" stroke="#8B949E" tick={{ fill: '#8B949E', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis 
          stroke="#8B949E" 
          tick={{ fill: '#8B949E', fontSize: 10 }} 
          axisLine={false} 
          tickLine={false} 
          tickFormatter={(v) => {
            const formatted = v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`;
            return currency === 'BRL' ? `R$ ${formatted}` : `$ ${formatted}`;
          }} 
        />
        <RechartsTooltip content={<CustomLineTooltip currency={currency} />} />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#3b82f6" 
          strokeWidth={2} 
          dot={{ fill: '#3b82f6', strokeWidth: 1, r: 3 }} 
          activeDot={{ r: 4 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
