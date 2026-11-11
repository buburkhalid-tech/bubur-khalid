'use client';

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/lib/store/AppContext';
import { DemoSwitcher } from '@/components/common/DemoSwitcher';
import { CustomerView } from '@/components/customer/CustomerView';
import { AdminView } from '@/components/admin/AdminView';
import { PosView } from '@/components/pos/PosView';
import { KdsView } from '@/components/kitchen/KdsView';
import { OwnerFinancialView } from '@/components/financial/OwnerFinancialView';

function PrototypeContent() {
  const { activeView, setActiveView } = useApp();
  const [isAdminPortal, setIsAdminPortal] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      
      // Deteksi apakah domain adalah Admin (mengandung 'admin', 'kasir', env var, atau ?admin=1)
      const isExplicitAdmin = 
        hostname.includes('admin') || 
        hostname.includes('kasir') || 
        process.env.NEXT_PUBLIC_DEFAULT_VIEW === 'admin' ||
        params.has('admin') ||
        params.get('view') === 'admin' ||
        params.get('view') === 'pos' ||
        params.get('view') === 'kds' ||
        params.get('view') === 'owner-financial';

      setIsAdminPortal(isExplicitAdmin);

      if (isExplicitAdmin) {
        const viewParam = params.get('view');
        if (viewParam && ['admin', 'pos', 'kds', 'owner-financial'].includes(viewParam)) {
          setActiveView(viewParam as any);
        } else if (activeView === 'customer') {
          setActiveView('admin');
        }
      } else {
        // Domain Pelanggan: Kunci murni ke Customer Web App
        setActiveView('customer');
      }
    }
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tofu-silkblaze">
        <div className="w-8 h-8 rounded-full border-3 border-spicy-ember border-t-transparent animate-spin" />
      </div>
    );
  }

  // JIKA DOMAIN PELANGGAN (bubur-khalid.vercel.app):
  // Murni hanya menampilkan Web App versi Mobile pelanggan (tanpa bar navigasi demo sama sekali)
  if (!isAdminPortal) {
    return (
      <main className="min-h-screen bg-stone-100 flex justify-center">
        <div className="w-full max-w-md bg-tofu-silkblaze min-h-screen shadow-2xl relative">
          <CustomerView />
        </div>
      </main>
    );
  }

  // JIKA DOMAIN ADMIN (bubur-khalid-admin.vercel.app):
  // Menampilkan SEMUA modul operasional: Admin Dashboard, POS Kasir Tablet, Dapur (KDS), dan Owner Finansial
  return (
    <div className="min-h-screen flex flex-col bg-tofu-silkblaze">
      {/* Top Operational Bar Switcher */}
      <DemoSwitcher />

      {/* Active Sub-module Container */}
      <div className="flex-1">
        {activeView === 'admin' && <AdminView />}
        {activeView === 'pos' && <PosView />}
        {activeView === 'kds' && <KdsView />}
        {activeView === 'owner-financial' && <OwnerFinancialView />}
        {activeView === 'customer' && (
          <main className="min-h-screen bg-stone-100 flex justify-center py-6">
            <div className="w-full max-w-md bg-tofu-silkblaze min-h-screen shadow-2xl relative rounded-3xl overflow-hidden border border-stone-200">
              <CustomerView />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <AppProvider>
      <PrototypeContent />
    </AppProvider>
  );
}
