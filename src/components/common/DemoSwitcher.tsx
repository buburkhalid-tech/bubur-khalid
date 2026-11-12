'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '@/lib/store/AppContext';
import {
  LayoutDashboard,
  Calculator,
  ChefHat,
  ShieldAlert,
  Eye,
  EyeOff,
} from 'lucide-react';

export function DemoSwitcher() {
  const { activeView, setActiveView, isFinancialUnlocked, storeSettings } = useApp();
  
  // Fungsi Hide / Tampil saat tidak digunakan (Default: tersembunyi agar tidak mengganggu operasional POS kasir / dapur)
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Tutup side menu dengan tombol keyboard Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const views = [
    {
      id: 'admin',
      label: 'Admin Dashboard',
      desc: 'Operasional & Laporan Toko',
      icon: LayoutDashboard,
      tag: 'Utama',
    },
    {
      id: 'pos',
      label: 'POS Kasir Tablet',
      desc: 'Kasir & Touch Checkout',
      icon: Calculator,
      tag: 'Kasir',
    },
    {
      id: 'kds',
      label: 'Kitchen Display',
      desc: 'Antrean Dapur FIFO',
      icon: ChefHat,
      tag: 'Dapur FIFO',
    },
    {
      id: 'owner-financial',
      label: 'Owner Finansial',
      desc: 'Laba Bersih & Belanja Riil',
      icon: ShieldAlert,
      tag: isFinancialUnlocked ? 'Unlocked' : 'Protected',
    },
  ] as const;

  return (
    <>
      {/* 1. TRIGGER ICON MATA (HANYA MUNCUL DI TEPI LAYAR SAAT DISENTUH/DIARAHKAN KE MENU) */}
      {!isOpen && (
        <div
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`flex items-center justify-center p-2.5 sm:p-3 rounded-r-2xl bg-matcha-deep/90 hover:bg-matcha-deep text-noodle-cream border-y-2 border-r-2 border-matcha-surface shadow-2xl backdrop-blur-md transition-all duration-300 cursor-pointer active:scale-95 group ${
              isHovered
                ? 'opacity-100 translate-x-0 ring-2 ring-yolk-blaze/50 shadow-yolk-blaze/20'
                : 'opacity-40 hover:opacity-100 -translate-x-0.5'
            }`}
            title="Sentuh ke arah menu ini untuk membuka Navigasi Modul"
            aria-label="Buka Navigasi Modul"
          >
            <Eye className="w-5 h-5 text-yolk-blaze group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* 2. OVERLAY BACKDROP UNTUK KLIK LUAR / AUTO-HIDE */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
          onClick={() => setIsOpen(false)}
          title="Klik di luar untuk menutup dan menyembunyikan menu"
        />
      )}

      {/* 3. SIDE MENU BAR MENGAMBANG (AUTO-HIDE SAAT TIDAK DIGUNAKAN) */}
      {isOpen && (
        <aside
          role="navigation"
          aria-label="Side Menu Bar Modul"
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 w-72 max-w-[85vw] bg-matcha-deep text-tofu-silkblaze p-4 sm:p-5 rounded-r-3xl border-y-2 border-r-2 border-matcha-surface shadow-floating space-y-4 animate-slideRight"
        >
          {/* Header Side Menu dengan Tombol Hide (Icon Mata Tutup) */}
          <div className="flex items-center justify-between pb-3 border-b border-matcha-surface">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden relative border border-white/40 bg-white flex-shrink-0 shadow-sm">
                <Image
                  src={storeSettings.storeLogo || '/images/logo/bubur-khalid-logo.png'}
                  alt="Logo Bubur Khalid"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white leading-tight">Side Menu Bar</h3>
                <p className="text-[10px] text-noodle-cream">Navigasi Modul Operasional</p>
              </div>
            </div>

            {/* Tombol Sembunyikan (Hide) */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-matcha-surface hover:bg-spicy-ember text-yolk-blaze hover:text-white flex items-center justify-center transition active:scale-90 cursor-pointer shadow-xs"
              title="Sembunyikan Side Menu Bar (Hide)"
              aria-label="Sembunyikan Side Menu Bar"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          {/* Daftar Modul (Vertical Side Bar) */}
          <nav className="space-y-2">
            {views.map((v) => {
              const Icon = v.icon;
              const isActive = activeView === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setActiveView(v.id);
                    setIsOpen(false); // Otomatis hide kembali setelah memilih agar layar kerja 100% bebas
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition active:scale-98 cursor-pointer ${
                    isActive
                      ? 'bg-spicy-ember text-white shadow-md ring-2 ring-white/20'
                      : 'bg-matcha-leaf/60 text-noodle-cream hover:bg-matcha-surface hover:text-white border border-matcha-surface/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-matcha-deep text-yolk-blaze'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-black text-xs leading-snug">{v.label}</div>
                      <div className="text-[10px] opacity-75">{v.desc}</div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-black/25 text-white' : 'bg-black/30 text-noodle-cream'
                    }`}
                  >
                    {v.tag}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Footer Side Menu Bar */}
          <div className="pt-2 border-t border-matcha-surface flex items-center justify-between text-[10px] text-noodle-cream/70">
            <span className="flex items-center space-x-1">
              <Eye className="w-3 h-3 text-yolk-blaze" />
              <span>Sentuh ikon mata tepi layar</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-yolk-blaze hover:underline font-bold cursor-pointer"
            >
              Sembunyikan
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
