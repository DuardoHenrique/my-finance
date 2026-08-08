'use client';

import React, { useState } from 'react';
import { Activity, Lock, Mail, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ocorreu um erro ao processar sua solicitação.');
        setIsLoading(false);
        return;
      }

      // Successful login/registration -> redirect to dashboard home
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      setError('Falha de conexão com o servidor. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090D11] text-white p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Auth Box */}
      <div className="w-full max-w-md bg-[#161B22]/80 border border-white/10 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-accent/10 border border-brand-accent/30 text-brand-accent rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.2)] mb-2">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white heading-display">MyFinance</h1>
          <p className="text-xs text-white/50">
            {isRegister ? 'Crie sua conta para gerenciar seu patrimônio isoladamente' : 'Acesse seu painel financeiro personalizado'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#0D1117] border border-white/10 p-1 rounded-xl font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              !isRegister
                ? 'bg-[#21262D] text-white shadow border border-white/10'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              isRegister
                ? 'bg-[#21262D] text-white shadow border border-white/10'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200 font-sans">
            <ShieldCheck className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegister && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider">Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-[#0D1117] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-accent transition-all font-sans"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-[#0D1117] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-accent transition-all font-sans"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0D1117] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-accent transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#238636] hover:bg-[#2ea043] border border-white/10 text-white font-semibold py-3 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-green-950/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <span>Carregando...</span>
            ) : (
              <>
                <span>{isRegister ? 'Criar minha conta' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security / Isolation Callout */}
        <div className="pt-2 border-t border-white/5 text-center flex items-center justify-center gap-1.5 text-[11px] text-white/40 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
          <span>Seus dados são 100% isolados da conta de outros usuários.</span>
        </div>

      </div>
    </div>
  );
}
