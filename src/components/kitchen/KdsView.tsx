'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useApp } from '@/lib/store/AppContext';
import { Order, OrderStatus } from '@/lib/types';
import { playNotificationSound } from '@/lib/utils/sound';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Flame,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react';

export function KdsView() {
  const { orders, updateOrderStatus, setActiveView, storeSettings } = useApp();
  const [filterStatus, setFilterStatus] = useState<'NEW' | 'PREPARING' | 'READY'>('NEW');
  const knownKdsOrderIdsRef = useRef<Set<string> | null>(null);

  // Auto-play chime + 2x device vibration when new order arrives in KDS
  useEffect(() => {
    if (orders.length === 0) return;
    if (knownKdsOrderIdsRef.current === null) {
      knownKdsOrderIdsRef.current = new Set(orders.map((o) => o.id));
      return;
    }
    let hasNew = false;
    for (const ord of orders) {
      if (!knownKdsOrderIdsRef.current.has(ord.id)) {
        knownKdsOrderIdsRef.current.add(ord.id);
        if (ord.order_status === 'NEW' || ord.order_status === 'CONFIRMED') {
          hasNew = true;
        }
      }
    }
    if (hasNew) {
      playNotificationSound(true);
    }
  }, [orders]);

  // Restore saved filter tab from localStorage so refresh stays on the same tab
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bubur_khalid_kds_filter');
      if (saved && ['NEW', 'PREPARING', 'READY'].includes(saved)) {
        setFilterStatus(saved as any);
      }
    } catch {}
  }, []);

  const handleSetFilter = (status: 'NEW' | 'PREPARING' | 'READY') => {
    setFilterStatus(status);
    try {
      localStorage.setItem('bubur_khalid_kds_filter', status);
    } catch {}
  };

  // Include active orders (including PENDING transfer orders awaiting confirmation)
  const activeKitchenOrders = orders
    .filter((o) => ['NEW', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.order_status))
    .filter((o) => {
      if (filterStatus === 'NEW') return o.order_status === 'NEW' || o.order_status === 'CONFIRMED';
      return o.order_status === filterStatus;
    })
    // Strictly sort by Global FIFO sequence
    .sort((a, b) => a.global_queue_sequence - b.global_queue_sequence);

  return (
    <div className="min-h-screen bg-stone-900 text-white p-4 lg:p-6">
      
      {/* KDS Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-800/90 p-4 rounded-2xl border border-stone-700 shadow-floating mb-6">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setActiveView('admin')}
            className="w-11 h-11 rounded-xl bg-white border border-stone-600 overflow-hidden relative shadow-md flex-shrink-0 p-0.5 cursor-pointer hover:scale-105 hover:border-spicy-ember active:scale-95 transition"
            title="Kembali ke Beranda Dashboard Admin"
            aria-label="Kembali ke Dashboard Admin"
          >
            <Image
              src={storeSettings.storeLogo || '/images/logo/bubur-khalid-logo.png'}
              alt="Home Dashboard Bubur Khalid"
              fill
              className="object-cover"
            />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black tracking-wide text-noodle-cream">KDS Bubur Khalid</h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold animate-pulse">
                LIVE FIFO
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Antrean Dapur Terpadu • Urutan Global FIFO ({activeKitchenOrders.length} Pesanan)
            </p>
          </div>
        </div>

        {/* Filter Pills: Hanya 3 Menu (Menunggu, Diproses, Siap Disajikan) */}
        <div className="flex items-center space-x-1 sm:space-x-2 bg-stone-900/80 p-1.5 rounded-xl border border-stone-700">
          <button
            type="button"
            onClick={() => handleSetFilter('NEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center space-x-1.5 ${
              filterStatus === 'NEW'
                ? 'bg-spicy-ember text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>Menunggu</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filterStatus === 'NEW' ? 'bg-black/25 text-white' : 'bg-stone-800 text-stone-300'
            }`}>
              {orders.filter((o) => o.order_status === 'NEW' || o.order_status === 'CONFIRMED').length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleSetFilter('PREPARING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center space-x-1.5 ${
              filterStatus === 'PREPARING'
                ? 'bg-spicy-ember text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>Diproses</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filterStatus === 'PREPARING' ? 'bg-black/25 text-white' : 'bg-stone-800 text-stone-300'
            }`}>
              {orders.filter((o) => o.order_status === 'PREPARING').length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleSetFilter('READY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center space-x-1.5 ${
              filterStatus === 'READY'
                ? 'bg-spicy-ember text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>Siap</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filterStatus === 'READY' ? 'bg-black/25 text-white' : 'bg-stone-800 text-stone-300'
            }`}>
              {orders.filter((o) => o.order_status === 'READY').length}
            </span>
          </button>
        </div>
      </div>

      {/* Grid of Kitchen Ticket Cards */}
      {activeKitchenOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-500">
          <ChefHat className="w-16 h-16 stroke-1 text-stone-600 mb-3" />
          {orders.filter((o) => ['NEW', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.order_status)).length === 0 ? (
            <>
              <h2 className="text-lg font-bold text-stone-400">Semua Pesanan Dapur Selesai!</h2>
              <p className="text-xs text-stone-500 mt-1">Tidak ada antrean tertunda saat ini.</p>
            </>
          ) : filterStatus === 'NEW' ? (
            <>
              <h2 className="text-lg font-bold text-stone-300">Tidak Ada Antrean Menunggu</h2>
              <p className="text-xs text-stone-400 mt-1 mb-4">Semua pesanan baru sudah diteruskan untuk dimasak atau disajikan.</p>
              <div className="flex items-center gap-2">
                {orders.filter((o) => o.order_status === 'PREPARING').length > 0 && (
                  <button
                    onClick={() => handleSetFilter('PREPARING')}
                    className="px-4 py-2 bg-spicy-ember hover:bg-spicy-dark text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                  >
                    Lihat {orders.filter((o) => o.order_status === 'PREPARING').length} Pesanan Diproses &rarr;
                  </button>
                )}
                {orders.filter((o) => o.order_status === 'READY').length > 0 && (
                  <button
                    onClick={() => handleSetFilter('READY')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                  >
                    Lihat {orders.filter((o) => o.order_status === 'READY').length} Pesanan Siap &rarr;
                  </button>
                )}
              </div>
            </>
          ) : filterStatus === 'PREPARING' ? (
            <>
              <h2 className="text-lg font-bold text-stone-300">Tidak Ada Pesanan Sedang Dimasak</h2>
              <p className="text-xs text-stone-400 mt-1 mb-4">Dapur tidak sedang memasak antrean saat ini.</p>
              <div className="flex items-center gap-2">
                {orders.filter((o) => o.order_status === 'NEW' || o.order_status === 'CONFIRMED').length > 0 && (
                  <button
                    onClick={() => handleSetFilter('NEW')}
                    className="px-4 py-2 bg-spicy-ember hover:bg-spicy-dark text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                  >
                    Lihat {orders.filter((o) => o.order_status === 'NEW' || o.order_status === 'CONFIRMED').length} Pesanan Menunggu &rarr;
                  </button>
                )}
                {orders.filter((o) => o.order_status === 'READY').length > 0 && (
                  <button
                    onClick={() => handleSetFilter('READY')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                  >
                    Lihat {orders.filter((o) => o.order_status === 'READY').length} Pesanan Siap &rarr;
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-stone-300">Tidak Ada Pesanan Siap Saji</h2>
              <p className="text-xs text-stone-400 mt-1 mb-4">Semua pesanan yang siap saji sudah diserahkan ke pelanggan.</p>
              <div className="flex items-center gap-2">
                {orders.filter((o) => o.order_status === 'PREPARING').length > 0 && (
                  <button
                    onClick={() => handleSetFilter('PREPARING')}
                    className="px-4 py-2 bg-spicy-ember hover:bg-spicy-dark text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                  >
                    Lihat {orders.filter((o) => o.order_status === 'PREPARING').length} Pesanan Sedang Dimasak &rarr;
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeKitchenOrders.map((order, idx) => {
            const isOnline = order.queue_channel === 'ONLINE';
            const isPreparing = order.order_status === 'PREPARING';
            const isReady = order.order_status === 'READY';
            const isNew = order.order_status === 'NEW' || order.order_status === 'CONFIRMED';

            return (
              <div
                key={order.id}
                className={`rounded-2xl border-2 flex flex-col justify-between overflow-hidden shadow-card transition-all ${
                  isReady
                    ? 'bg-emerald-950/40 border-emerald-500/60'
                    : isPreparing
                    ? 'bg-stone-800 border-yolk-blaze shadow-lg'
                    : 'bg-stone-850 border-stone-700'
                }`}
              >
                {/* Card Header */}
                <div
                  className={`p-3.5 flex items-center justify-between border-b ${
                    isOnline
                      ? 'bg-spicy-ember/20 border-spicy-ember/30'
                      : 'bg-matcha-leaf/30 border-matcha-leaf/40'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-stone-900/90 text-stone-300 font-bold px-2 py-0.5 rounded-full border border-stone-700">
                      FIFO #{order.global_queue_sequence}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        isOnline ? 'bg-spicy-ember text-white' : 'bg-yolk-blaze text-black'
                      }`}
                    >
                      {isOnline ? 'Online (QR/Web)' : 'Kasir (Toko)'}
                    </span>
                  </div>

                  {/* Elapsed Timer Badge */}
                  <div className="flex items-center space-x-1 text-xs text-stone-300 font-mono">
                    <Clock className="w-3.5 h-3.5 text-yolk-blaze" />
                    <span>±{Math.max(1, (idx + 1) * 3)} mnt</span>
                  </div>
                </div>

                {/* Queue Number & Destination */}
                <div className="p-4 bg-stone-900/60 flex items-center justify-between border-b border-stone-800">
                  <div>
                    <div className="text-3xl font-black tracking-wider text-noodle-cream">
                      {order.queue_number}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5 font-medium">
                      {order.service_type === 'DINE_IN' ? (
                        <span className="text-emerald-400 font-bold">
                          Dine-in • {order.table_number || 'Meja'}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold">Takeaway (Bungkus)</span>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator Pill */}
                  <div className="text-right">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-extrabold inline-block ${
                        isReady
                          ? 'bg-emerald-500 text-black'
                          : isPreparing
                          ? 'bg-yolk-blaze text-black animate-pulse'
                          : 'bg-stone-700 text-stone-200'
                      }`}
                    >
                      {isReady ? 'SIAP' : isPreparing ? 'SEDANG DIMASAK' : 'MENUNGGU'}
                    </span>
                    <div className="text-[10px] text-stone-400 mt-1">{order.customer_name}</div>
                  </div>
                </div>

                {/* Items List for Kitchen */}
                <div className="p-4 flex-1 space-y-2.5">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-stone-800/80 rounded-xl border border-stone-700/60 flex items-start space-x-2.5"
                    >
                      <span className="w-6 h-6 rounded-lg bg-spicy-ember/30 text-spicy-ember border border-spicy-ember/40 font-black text-xs flex items-center justify-center flex-shrink-0">
                        {item.quantity}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-stone-100 flex items-center space-x-1.5">
                          <span>{item.product_name_snapshot}</span>
                          {item.use_cup && (
                            <span className="bg-yolk-blaze/20 text-yolk-blaze border border-yolk-blaze/40 text-[9px] px-1 py-0.2 rounded font-mono">
                              CUP
                            </span>
                          )}
                        </div>
                        {item.item_notes && (
                          <div className="text-[11px] text-amber-300 font-medium mt-0.5 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                            Catatan: {item.item_notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Global Order Note if any */}
                  {order.notes && (
                    <div className="text-[11px] text-stone-400 italic bg-stone-900/40 p-2 rounded-lg border border-stone-800">
                      Catatan Nota: {order.notes}
                    </div>
                  )}
                </div>

                {/* Kitchen Action Buttons */}
                <div className="p-3 bg-stone-850 border-t border-stone-800 grid grid-cols-1 gap-2">
                  {isNew && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING', 'Staf Dapur')}
                      className="w-full bg-yolk-blaze hover:bg-yolk-dark text-black py-2.5 rounded-xl font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 transition"
                    >
                      <Flame className="w-4 h-4" />
                      <span>
                        {order.payment_status !== 'PAID'
                          ? 'Konfirmasi Lunas & Mulai Masak'
                          : 'Mulai Masak / Diproses'}
                      </span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'READY', 'Staf Dapur')}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Siap Saji</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'COMPLETED', 'Pelayan / Kasir')}
                      className="w-full bg-stone-700 hover:bg-stone-600 text-stone-200 py-2.5 rounded-xl font-extrabold text-xs shadow-sm flex items-center justify-center space-x-2 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selesai Diserahkan</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
