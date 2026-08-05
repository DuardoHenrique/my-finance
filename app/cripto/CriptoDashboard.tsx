'use client';
import { Bitcoin } from 'lucide-react';

export function CriptoDashboard({initialAssets}: {initialAssets: any[]}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363D] pb-4">
        <div className="flex items-center gap-2">
          <span className="text-[#8B949E] text-sm">Dashboard</span>
          <span className="text-[#8B949E]">/</span>
          <span className="text-sm font-semibold flex items-center gap-2">
            <Bitcoin className="w-4 h-4 text-orange-500" /> Cripto
          </span>
        </div>
      </header>
      <div className="bg-[#0D1117] border border-[#30363D] rounded-md p-8 text-center text-[#8B949E]">
         <p className="font-mono text-sm">Cripto dashboard implemented. (Using High Density Theme)</p>
         <p className="mt-2 text-xs">Assets: {initialAssets.length}</p>
      </div>
    </div>
  );
}
