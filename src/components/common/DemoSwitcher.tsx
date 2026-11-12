'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useApp } from '@/lib/store/AppContext';
import {
  LayoutDashboard,
  Calculator,
  ChefHat,
  ShieldAlert,
  X,
  GripHorizontal,
} from 'lucide-react';

export function DemoSwitcher() {
  const { activeView, setActiveView, isFinancialUnlocked, storeSettings } = useApp();
  
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
  });

  // Inisialisasi posisi awal (default: kanan bawah atau dari localStorage)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('bubur_khalid_floating_dashboard_pos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const clampedX = Math.min(Math.max(16, parsed.x), window.innerWidth - 64);
          const clampedY = Math.min(Math.max(16, parsed.y), window.innerHeight - 64);
          setPos({ x: clampedX, y: clampedY });
          return;
        }
      } catch (_) {}
    }

    // Posisi awal default di kanan bawah agar tidak bertabrakan dengan sidebar kiri atau tombol utama POS
    setPos({
      x: Math.max(16, window.innerWidth - 68),
      y: Math.max(16, window.innerHeight - 90),
    });

    const handleResize = () => {
      setPos((prev) => {
        if (!prev) return null;
        return {
          x: Math.min(Math.max(16, prev.x), window.innerWidth - 64),
          y: Math.min(Math.max(16, prev.y), window.innerHeight - 64),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Dragging
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (!pos) return;
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: pos.x,
      initialY: pos.y,
      hasMoved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging || !pos) return;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.hasMoved = true;
    }

    const nextX = Math.min(Math.max(12, dragRef.current.initialX + dx), window.innerWidth - 60);
    const nextY = Math.min(Math.max(12, dragRef.current.initialY + dy), window.innerHeight - 60);

    setPos({ x: nextX, y: nextY });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragRef.current.hasMoved && pos) {
      localStorage.setItem('bubur_khalid_floating_dashboard_pos', JSON.stringify(pos));
    } else {
      // Jika tidak digeser, berarti tap/klik -> toggle buka menu
      setIsOpen((prev) => !prev);
    }
  };

  // Keyboard Escape untuk menutup
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

  if (!pos) return null;

  // Hitung posisi popover menu agar selalu pas di layar dan tidak terpotong
  const isRightSide = pos.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 300);
  const isBottomSide = pos.y > (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);

  return (
    <>
      {/* BACKDROP KETIKA MENU DIBUKA: KLIK UNTUK CLOSE */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FLOATING ACTION ICON & EXPANDED MENU */}
      <div
        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
        className="fixed z-50 pointer-events-auto touch-none select-none"
      >
        {/* TOMBOL ICON DASHBOARD FLOATING (Saat close hanya icon ini yang tampil, bisa digeser/drag bebas) */}
        <button
          type="button"
          onMouseDown={(e) => {
            handlePointerDown(e.clientX, e.clientY);
            const onMouseMove = (moveEvent: MouseEvent) => {
              handlePointerMove(moveEvent.clientX, moveEvent.clientY);
            };
            const onMouseUp = () => {
              handlePointerUp();
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
          onTouchStart={(e) => {
            if (e.touches.length > 0) {
              handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={() => {
            handlePointerUp();
          }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-floating border-2 transition-transform cursor-grab active:cursor-grabbing active:scale-95 ${
            isOpen
              ? 'bg-spicy-ember text-white border-white ring-4 ring-spicy-ember/30 rotate-90 scale-105'
              : 'bg-matcha-deep/95 hover:bg-matcha-deep text-noodle-cream border-matcha-surface hover:scale-105'
          }`}
          title="Tombol Floating Navigasi (Klik untuk Buka / Geser untuk Pindahkan Posisi)"
          aria-label="Floating Menu Navigasi"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <div className="relative flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-yolk-blaze" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-1 ring-black/40" />
            </div>
          )}
        </button>

        {/* EXPANDED MENU: MUNCUL SEMUANYA KETIKA DIKLIK */}
        {isOpen && (
          <div
            className={`absolute z-50 w-72 max-w-[85vw] bg-matcha-deep text-tofu-silkblaze p-4 sm:p-5 rounded-3xl border-2 border-matcha-surface shadow-2xl space-y-3.5 animate-slideUp ${
              isRightSide ? 'right-0' : 'left-0'
            } ${isBottomSide ? 'bottom-14' : 'top-14'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Popup */}
            <div className="flex items-center justify-between pb-3 border-b border-matcha-surface">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden relative border border-white/40 bg-white flex-shrink-0 shadow-sm">
                  <Image
                    src={storeSettings.storeLogo || '/images/logo/bubur-khalid-logo.png'}
                    alt="Logo Bubur Khalid"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white leading-tight">Navigasi Modul</h3>
                  <p className="text-[10px] text-noodle-cream">Pilih menu kerja toko</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-matcha-surface hover:bg-matcha-leaf text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List 4 Modul Operasional */}
            <div className="space-y-1.5">
              {views.map((v) => {
                const Icon = v.icon;
                const isActive = activeView === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setActiveView(v.id);
                      setIsOpen(false); // Otomatis tutup saat modul dipilih
                    }}
                    className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl text-xs font-bold transition active:scale-98 cursor-pointer ${
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
            </div>

            {/* Hint Posisi Drag di Footer */}
            <div className="pt-2 border-t border-matcha-surface flex items-center justify-between text-[10px] text-noodle-cream/70">
              <span className="flex items-center space-x-1">
                <GripHorizontal className="w-3.5 h-3.5 text-yolk-blaze" />
                <span>Geser tombol untuk pindah posisi</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-yolk-blaze hover:underline font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
