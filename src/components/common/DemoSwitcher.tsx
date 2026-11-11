'use client';

import React from 'react';
import Image from 'next/image';
import { useApp } from '@/lib/store/AppContext';
import { Smartphone, LayoutDashboard, Calculator, ChefHat, ShieldAlert } from 'lucide-react';

export function DemoSwitcher() {
  const { activeView, setActiveView, isFinancialUnlocked, storeSettings } = useApp();

  const views = [
    { id: 'admin', label: 'Admin Dashboard', icon: LayoutDashboard, tag: 'Utama' },
    { id: 'pos', label: 'POS Kasir Tablet', icon: Calculator, tag: 'Kasir' },
    { id: 'kds', label: 'Kitchen Display', icon: ChefHat, tag: 'Dapur FIFO' },
    { id: 'owner-financial', label: 'Owner Finansial', icon: ShieldAlert, tag: isFinancialUnlocked ? 'Unlocked' : 'Protected' },
    { id: 'customer', label: 'Simulasi Mobile Pelanggan', icon: Smartphone, tag: 'Preview' },
  ] as const;

  return (
    <header className="bg-matcha-deep text-tofu-silkblaze border-b border-matcha-surface px-4 py-2 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        {/* View Switcher Pills */}
        <nav aria-label="Modul Protipe" className="flex items-center flex-wrap justify-center gap-1.5 bg-matcha-leaf p-1 rounded-xl border border-matcha-surface">
          {views.map((v) => {
            const Icon = v.icon;
            const isActive = activeView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
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
      </div>
    </header>
  );
}
