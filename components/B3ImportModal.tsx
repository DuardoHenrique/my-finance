'use client';

import React, { useState } from 'react';
import { 
  FileSpreadsheet, Upload, X, Check, AlertTriangle, 
  Trash2, Layers, ArrowRight, RefreshCw, Info 
} from 'lucide-react';
import { parseB3ExcelFile, ExtractedB3Asset } from '@/lib/b3Parser';

interface B3ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedAssets: ExtractedB3Asset[]) => void;
}

export function B3ImportModal({ isOpen, onClose, onImportSuccess }: B3ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [extractedAssets, setExtractedAssets] = useState<ExtractedB3Asset[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsParsing(true);
    setWarnings([]);
    setHasParsed(false);

    const result = await parseB3ExcelFile(uploadedFile);
    
    setIsParsing(false);
    setHasParsed(true);
    setExtractedAssets(result.assets);
    setWarnings(result.warnings);
  };

  const toggleSelectAll = (selected: boolean) => {
    setExtractedAssets(prev => prev.map(a => ({ ...a, selected })));
  };

  const toggleSelectAsset = (id: string) => {
    setExtractedAssets(prev => prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a));
  };

  const handleAssetFieldChange = (id: string, field: keyof ExtractedB3Asset, value: any) => {
    setExtractedAssets(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, [field]: value };
        if (field === 'quantity' || field === 'buyPrice' || field === 'averagePrice') {
          const qty = Number(field === 'quantity' ? value : updated.quantity);
          const buyP = Number(field === 'buyPrice' ? value : updated.buyPrice);
          const avgP = Number(field === 'averagePrice' ? value : updated.averagePrice);
          const costP = buyP > 0 ? buyP : avgP;
          updated.totalValue = Number((qty * costP).toFixed(2));
        }
        return updated;
      }
      return a;
    }));
  };

  const handleRemoveAsset = (id: string) => {
    setExtractedAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleConfirmImport = async () => {
    const selectedAssets = extractedAssets.filter(a => a.selected && a.quantity > 0);
    if (selectedAssets.length === 0) {
      alert('Selecione pelo menos um ativo válido para importar.');
      return;
    }

    setIsImporting(true);
    try {
      await onImportSuccess(selectedAssets);
      onClose();
      resetState();
    } catch (error) {
      console.error(error);
      alert('Erro ao importar ativos.');
    } finally {
      setIsImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setIsParsing(false);
    setExtractedAssets([]);
    setWarnings([]);
    setHasParsed(false);
  };

  const selectedCount = extractedAssets.filter(a => a.selected).length;
  const totalSelectedValue = extractedAssets
    .filter(a => a.selected)
    .reduce((acc, a) => acc + (a.quantity * a.averagePrice), 0);

  return (
    <div className="fixed inset-0 bg-[#0A0C10]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#0D1117] border border-white/10 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#161B22] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#238636]/20 border border-[#238636]/40 rounded-lg text-[#2ea043]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Importar Relatório Consolidado B3</h2>
              <p className="text-xs text-white/50">Extração automática de Ações, FIIs e Renda Fixa de planilhas B3 (.xlsx, .xls)</p>
            </div>
          </div>
          <button 
            onClick={() => { onClose(); resetState(); }}
            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 font-sans">
          
          {/* File Upload Zone if not parsed yet or replacing file */}
          {!hasParsed ? (
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-white/20 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all rounded-xl p-8 text-center flex flex-col items-center justify-center gap-4 cursor-pointer group"
            >
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={handleFileChange} 
                className="hidden" 
                id="b3-file-input"
              />
              <label htmlFor="b3-file-input" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-full group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block mb-1">
                    Arraste o relatório da B3 aqui ou <span className="text-blue-400 underline">clique para selecionar</span>
                  </span>
                  <span className="text-xs text-white/40 block">
                    Suporta arquivos Excel da B3 (Relatório Consolidado Anual, Extrato de Custódia, Negociação)
                  </span>
                </div>
              </label>

              {isParsing && (
                <div className="flex items-center gap-2 text-xs text-blue-400 font-mono mt-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Analisando relatório B3...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* File details bar */}
              <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 px-4 py-3 rounded-lg text-xs font-mono">
                <div className="flex items-center gap-2 text-white/70 truncate">
                  <FileSpreadsheet className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="font-semibold text-white truncate">{file?.name}</span>
                  <span className="text-white/40">({extractedAssets.length} ativos identificados)</span>
                </div>
                <label htmlFor="b3-file-input" className="text-blue-400 hover:underline cursor-pointer text-[11px] font-sans">
                  Trocar arquivo
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" id="b3-file-input" />
                </label>
              </div>

              {/* Warnings if any */}
              {warnings.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    {warnings.map((w, idx) => (
                      <p key={idx}>{w}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {extractedAssets.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3 text-white/70">
                      <label className="flex items-center gap-2 cursor-pointer text-white">
                        <input 
                          type="checkbox"
                          checked={selectedCount === extractedAssets.length}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          className="rounded border-white/20 bg-[#0A0C10] text-blue-500 focus:ring-0"
                        />
                        <span>Selecionar Todos ({selectedCount}/{extractedAssets.length})</span>
                      </label>
                    </div>
                    <div className="text-white/70">
                      Total Selecionado: <span className="text-green-400 font-bold font-mono">R$ {totalSelectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="border border-white/10 rounded-lg overflow-hidden bg-[#0A0C10] max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#161B22] text-white/50 border-b border-white/10 uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="p-3 w-10 text-center">#</th>
                          <th className="p-3 w-24">Ticker</th>
                          <th className="p-3">Empresa / Ativo</th>
                          <th className="p-3 w-28">Categoria</th>
                          <th className="p-3 w-20 text-right">Qtd</th>
                          <th className="p-3 w-28 text-right">Preço Compra (R$)</th>
                          <th className="p-3 w-28 text-right">Preço Médio (R$)</th>
                          <th className="p-3 w-32 text-right">Total Investido (R$)</th>
                          <th className="p-3 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {extractedAssets.map((asset) => (
                          <tr key={asset.id} className={`hover:bg-white/[0.02] transition-colors ${!asset.selected ? 'opacity-40' : ''}`}>
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox"
                                checked={asset.selected}
                                onChange={() => toggleSelectAsset(asset.id)}
                                className="rounded border-white/20 bg-[#0A0C10] text-blue-500 focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-bold text-blue-400">
                              <input 
                                type="text"
                                value={asset.ticker}
                                onChange={(e) => handleAssetFieldChange(asset.id, 'ticker', e.target.value.toUpperCase())}
                                className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-500 text-blue-400 font-bold outline-none uppercase"
                              />
                            </td>
                            <td className="p-3 text-white">
                              <input 
                                type="text"
                                value={asset.name}
                                onChange={(e) => handleAssetFieldChange(asset.id, 'name', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-500 text-white outline-none font-sans"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={asset.category}
                                onChange={(e) => handleAssetFieldChange(asset.id, 'category', e.target.value)}
                                className="bg-[#161B22] border border-white/10 text-white rounded px-2 py-1 text-xs outline-none"
                              >
                                <option value="Ações">Ações</option>
                                <option value="FIIs">FIIs</option>
                                <option value="Renda Fixa">Renda Fixa</option>
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              <input 
                                type="number"
                                step="any"
                                value={asset.quantity}
                                onChange={(e) => handleAssetFieldChange(asset.id, 'quantity', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-500 text-right text-white outline-none font-mono"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <input 
                                type="number"
                                step="any"
                                value={asset.buyPrice || asset.averagePrice}
                                onChange={(e) => handleAssetFieldChange(asset.id, 'buyPrice', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-500 text-right text-white outline-none font-mono text-amber-300 font-semibold"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <input 
                                type="number"
                                step="any"
                                value={asset.averagePrice}
                                onChange={(e) => handleAssetFieldChange(asset.id, 'averagePrice', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-500 text-right text-white outline-none font-mono"
                              />
                            </td>
                            <td className="p-3 text-right font-bold text-white">
                              R$ {asset.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <button 
                                onClick={() => handleRemoveAsset(asset.id)}
                                className="text-white/30 hover:text-red-400 transition-colors p-1 cursor-pointer"
                                title="Remover item da lista"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 border border-white/10 rounded-lg bg-white/[0.02]">
                  <Info className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white mb-1">Nenhum ativo detectado no arquivo</p>
                  <p className="text-xs text-white/50 max-w-md mx-auto">
                    Certifique-se de que o arquivo baixado no portal da B3 é o &quot;Relatório Consolidado Anual&quot; ou o &quot;Extrato de Custódia&quot; que contém a listagem das suas ações, FIIs ou títulos.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Tutorial / Help box */}
          <div className="bg-[#161B22]/60 border border-white/10 p-4 rounded-lg text-xs space-y-2 font-sans">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-400" /> Como baixar o relatório na B3:
            </span>
            <ol className="list-decimal list-inside text-white/60 space-y-1 pl-1">
              <li>Acesse o portal <strong className="text-white">Área do Investidor B3</strong> (investidor.b3.com.br).</li>
              <li>Vá em <strong className="text-white">Relatórios</strong> &gt; <strong className="text-white">Consolidado Anual</strong> ou <strong className="text-white">Posição de Custódia</strong>.</li>
              <li>Selecione o ano desejado (a partir de 2020) e clique em <strong className="text-white">Baixar Excel (.xlsx)</strong>.</li>
            </ol>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#161B22] flex items-center justify-between">
          <button 
            onClick={() => { onClose(); resetState(); }}
            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] border border-white/10 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {hasParsed && extractedAssets.length > 0 && (
            <button 
              onClick={handleConfirmImport}
              disabled={isImporting || selectedCount === 0}
              className="px-5 py-2 bg-[#238636] hover:bg-[#2ea043] border border-[rgba(240,246,252,0.1)] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Importando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Importar {selectedCount} {selectedCount === 1 ? 'Ativo' : 'Ativos'}
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
