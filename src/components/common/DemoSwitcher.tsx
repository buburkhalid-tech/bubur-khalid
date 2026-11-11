'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/lib/store/AppContext';
import {
  Smartphone,
  LayoutDashboard,
  Calculator,
  ChefHat,
  ShieldAlert,
  LogOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function DemoSwitcher() {
  const { activeView, setActiveView, isFinancialUnlocked, storeSettings, currentUser, logout } = useApp();
  
  // Sembunyikan secara default saat tidak digunakan agar layar kerja 100% penuh & bersih
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const views = [
    { id: 'admin', label: 'Admin Dashboard', icon: LayoutDashboard, tag: 'Utama' },
    { id: 'pos', label: 'POS Kasir Tablet', icon: Calculator, tag: 'Kasir' },
    { id: 'kds', label: 'Kitchen Display', icon: ChefHat, tag: 'Dapur FIFO' },
    { id: 'owner-financial', label: 'Owner Finansial', icon: ShieldAlert, tag: isFinancialUnlocked ? 'Unlocked' : 'Protected' },
  ] as const;

  const currentView = views.find((v) => v.id === activeView) || views[0];
  const CurrentIcon = currentView.icon;

  // JIKA SEDANG DISEMBUNYIKAN: Tampilkan hanya tombol mini mengambang yang ringkas & tidak mengganggu
  if (isCollapsed) {
    return (
      <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-fadeIn">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="bg-matcha-deep/90 hover:bg-matcha-deep text-noodle-cream text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg border border-matcha-surface/80 flex items-center space-x-2 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group"
          title="Klik untuk membuka menu ganti modul (Admin, Kasir, Dapur, Owner)"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <CurrentIcon className="w-3.5 h-3.5 text-yolk-blaze" />
          <span className="text-[11px] text-white/90">
            Modul: <strong className="text-white">{currentView.label}</strong>
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-yolk-blaze group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  // JIKA SEDANG DIBUKA: Tampilkan bar navigasi lengkap
  return (
    <header className="bg-matcha-deep text-tofu-silkblaze border-b border-matcha-surface px-4 py-2 sticky top-0 z-50 shadow-xl animate-slideDown">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Store Logo & Name */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-full bg-white overflow-hidden relative border border-white/40">
            <Image
              src={storeSettings.storeLogo || '/images/logo/bubur-khalid-logo.png'}
              alt="Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-extrabold text-xs text-white hidden lg:inline">
            {storeSettings.storeName}
          </span>
        </div>

        {/* View Switcher Navigation Pills */}
        <nav aria-label="Modul Prototipe" className="flex items-center flex-wrap justify-center gap-1.5 bg-matcha-leaf p-1 rounded-xl border border-matcha-surface">
          {views.map((v) => {
            const Icon = v.icon;
            const isActive = activeView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => {
                  setActiveView(v.id);
                  setIsCollapsed(true); // Otomatis sembunyikan kembali setelah memilih modul agar layar kerja langsung bersih
                }}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-spicy-ember text-white shadow-sm font-bold'
                    : 'text-noodle-cream hover:bg-matcha-surface hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{v.label}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                    isActive ? 'bg-black/20 text-white' : 'bg-black/30 text-noodle-dark'
                  }`}
                >
                  {v.tag}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right: User Profile, Minimize & Logout Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {currentUser && (
            <div className="text-right hidden sm:block">
              <div className="text-xs font-black text-white leading-tight">{currentUser.name}</div>
              <div className="text-[9px] text-yolk-blaze font-bold uppercase">{currentUser.role}</div>
            </div>
          )}

          {/* Sembunyikan Bar Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-noodle-cream hover:text-white text-xs font-bold transition border border-white/15 active:scale-95"
            title="Sembunyikan Bar Navigasi"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sembunyikan</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition shadow-sm active:scale-95"
            title="Keluar dari Akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
