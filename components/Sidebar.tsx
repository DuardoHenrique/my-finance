'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Home, Wallet, Globe, Bitcoin, Activity, LogOut } from 'lucide-react';
import { SessionUser } from '@/lib/auth';

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (pathname !== '/login') {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.user) {
            setUser(data.user);
          }
        })
        .catch((err) => console.error('Failed to fetch session user', err));
    }
  }, [pathname]);

  if (pathname === '/login') {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  const links = [
    { href: '/', label: 'Overview', icon: Home },
    { href: '/brasil', label: 'Brasil', icon: Wallet },
    { href: '/internacional', label: 'Internacional', icon: Globe },
    { href: '/cripto', label: 'Cripto', icon: Bitcoin },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white/[0.02] border-r border-white/5 flex flex-col h-full hidden md:flex backdrop-blur-3xl z-20">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-accent rounded-lg flex items-center justify-center text-brand-bg shadow-[0_0_15px_rgba(56,189,248,0.4)]">
            <Activity className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-white text-lg heading-display">MyFinance</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 relative">
          <div className="text-[10px] uppercase font-bold text-white/40 px-3 mb-4 tracking-widest">My Portfolios</div>
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 font-medium group',
                  isActive
                    ? 'bg-brand-accent/10 border border-brand-accent/20 text-brand-accent shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                    : 'text-white/60 hover:bg-white/[0.04] hover:text-white border border-transparent'
                )}
              >
                <link.icon className={clsx("w-4 h-4 shrink-0 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile & Logout footer */}
        <div className="p-4 border-t border-white/5 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-brand-accent font-bold text-xs uppercase shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-white truncate">{user.name}</span>
                <span className="text-[10px] text-white/40 truncate">{user.email}</span>
              </div>
            </div>
          )}
          
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 font-semibold cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <span>Sair da conta</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-brand-bg/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-2 z-40 md:hidden pb-safe">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'flex flex-col items-center justify-center gap-1.5 flex-1 py-2 px-1 transition-all duration-300',
                isActive ? 'text-brand-accent' : 'text-white/50'
              )}
            >
              <div className={clsx(
                "p-1.5 rounded-full transition-all duration-300",
                isActive ? "bg-brand-accent/10 shadow-[0_0_10px_rgba(56,189,248,0.2)]" : ""
              )}>
                <link.icon className="w-5 h-5 shrink-0" />
              </div>
              <span className="text-[10px] font-semibold tracking-tight truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
