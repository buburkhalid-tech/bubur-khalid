'use client';

import React from 'react';
import { AppProvider, useApp } from '@/lib/store/AppContext';
import { DemoSwitcher } from '@/components/common/DemoSwitcher';
import { CustomerView } from '@/components/customer/CustomerView';
import { AdminView } from '@/components/admin/AdminView';
import { PosView } from '@/components/pos/PosView';
import { KdsView } from '@/components/kitchen/KdsView';
import { OwnerFinancialView } from '@/components/financial/OwnerFinancialView';

function PrototypeContent() {
  const { activeView } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-tofu-silkblaze">
      {/* Top Demo Navigation Switcher */}
      <DemoSwitcher />

      {/* Active Sub-module Container */}
      <div className="flex-1">
        {activeView === 'customer' && <CustomerView />}
        {activeView === 'admin' && <AdminView />}
        {activeView === 'pos' && <PosView />}
        {activeView === 'kds' && <KdsView />}
        {activeView === 'owner-financial' && <OwnerFinancialView />}
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
