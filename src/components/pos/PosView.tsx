'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/lib/store/AppContext';
import { CATEGORIES, CUP_FEE } from '@/lib/constants';
import { Product, Order } from '@/lib/types';
import {
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  CreditCard,
  Banknote,
  Search,
  RotateCcw,
  Receipt,
  User,
  Coffee,
  QrCode,
  X,
} from 'lucide-react';

export function PosView() {
  const {
    products,
    posCart,
    addToPosCart,
    updatePosCartQty,
    togglePosCartCup,
    clearPosCart,
    posCartTotal,
    createPosOrder,
    storeSettings,
    showToast,
    setActiveView,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('Pelanggan Toko');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS'>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Manual QRIS Input State
  const [qrisAmount, setQrisAmount] = useState<number>(0);
  const [qrisRefNumber, setQrisRefNumber] = useState<string>('');
  const [qrisProvider, setQrisProvider] = useState<string>('BCA');
  const [isQrisBarcodeOpen, setIsQrisBarcodeOpen] = useState<boolean>(false);

  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);
  const [lastChange, setLastChange] = useState<number>(0);

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const quickAmounts = [10000, 20000, 50000, 100000];

  const handleQuickCash = (amt: number) => {
    setCashGiven(amt);
  };

  const handleUangPas = () => {
    setCashGiven(posCartTotal.total);
  };

  const handleProcessTransaction = () => {
    if (posCart.length === 0) return;
    if (paymentMethod === 'CASH' && cashGiven < posCartTotal.total) {
      alert('Uang yang diterima kurang dari total belanja!');
      return;
    }

    const effectiveCash = paymentMethod === 'CASH' ? cashGiven : (qrisAmount || posCartTotal.total);
    const { order, change } = createPosOrder(
      customerName,
      paymentMethod,
      effectiveCash,
      paymentMethod === 'QRIS' ? (qrisRefNumber || `RRN-${Math.floor(100000 + Math.random() * 900000)}`) : undefined,
      paymentMethod === 'QRIS' ? qrisProvider : undefined
    );

    setLastCompletedOrder(order);
    setLastChange(change);
    setIsReceiptOpen(true);
    setCashGiven(0);
    setQrisAmount(0);
    setQrisRefNumber('');
    setCustomerName('Pelanggan Toko');
  };

  return (
    <div className="min-h-screen bg-tofu-warm p-2 sm:p-3 md:p-4 text-matcha-leaf max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 md:gap-4 lg:gap-6 items-start w-full">
        
        {/* LEFT / CENTER: Touch Product Catalog Grid (Tablet/Desktop: scrollable, flexible width) */}
        <div className="flex-1 min-w-0 w-full space-y-3">
          
          {/* Top Bar POS */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-soft border border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setActiveView('admin')}
                className="md:hidden flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-matcha-leaf text-tofu-silkblaze text-xs font-bold active:scale-95 transition"
                title="Kembali ke Dashboard Admin"
              >
                <span>← Admin</span>
              </button>

              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white border border-stone-200 overflow-hidden relative shadow-sm flex-shrink-0 p-0.5">
                <Image
                  src={storeSettings.storeLogo || '/images/logo/bubur-khalid-logo.png'}
                  alt="Logo Bubur Khalid"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="font-extrabold text-sm sm:text-base text-matcha-leaf">POS Kasir Bubur Khalid</h1>
                <p className="text-[11px] sm:text-xs text-stone-500">Mode Tablet Touchscreen • Antrean Order di Tempat (OT)</p>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-auto min-w-[200px] sm:min-w-[240px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari menu (sentuh untuk ketik)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-spicy-ember"
              />
            </div>
          </div>

          {/* Category Filter Horizontal Scroll */}
          <div className="flex space-x-2 overflow-x-auto pb-1 hide-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm select-none ${
                  selectedCategory === cat
                    ? 'bg-matcha-leaf text-tofu-silkblaze'
                    : 'bg-white text-matcha-leaf border border-stone-200 hover:bg-noodle-cream'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards Touch Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredProducts.map((p) => {
              const inCart = posCart.find((item) => item.product.id === p.id);
              const isSoldOut = !p.is_available;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    if (isSoldOut) {
                      showToast(`Menu "${p.name}" sedang HABIS. Tidak dapat ditambahkan ke transaksi.`);
                      return;
                    }
                    addToPosCart(p);
                  }}
                  className={`bg-white rounded-2xl p-2.5 sm:p-3 shadow-soft border-2 transition-all cursor-pointer select-none active:scale-95 relative flex flex-col justify-between ${
                    isSoldOut
                      ? 'opacity-65 bg-stone-50 border-stone-200 cursor-not-allowed'
                      : inCart
                      ? 'border-spicy-ember ring-2 ring-spicy-ember/20'
                      : 'border-stone-100 hover:border-noodle-dark'
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-spicy-ember text-white font-black text-xs flex items-center justify-center shadow-sm">
                      {inCart.quantity}
                    </span>
                  )}
                  <div>
                    <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden relative mb-2 bg-tofu-silkblaze border border-stone-100">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className={`object-cover ${isSoldOut ? 'grayscale contrast-75' : ''}`}
                      />
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[0.5px] flex flex-col items-center justify-center p-1">
                          <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                            Habis
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] bg-noodle-cream text-matcha-leaf font-bold px-1.5 py-0.5 rounded">
                        {p.category}
                      </span>
                      {isSoldOut && (
                        <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded border border-red-200">
                          Habis
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-matcha-leaf mt-1 line-clamp-1">{p.name}</h3>
                  </div>
                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className={`font-black text-xs sm:text-sm ${isSoldOut ? 'text-stone-400' : 'text-spicy-ember'}`}>
                      Rp{p.price.toLocaleString('id-ID')}
                    </span>
                    {isSoldOut ? (
                      <span className="text-[10px] bg-stone-200 text-stone-500 px-2 py-0.5 rounded font-bold">
                        Habis
                      </span>
                    ) : (
                      <span className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-bold">
                        + Tambah
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT: Persistent Side Cart & Touch Checkout (Tablet Optimized, fits on screen) */}
        <div className="w-full md:w-[350px] lg:w-[400px] flex-shrink-0 bg-white rounded-2xl shadow-card border-2 border-stone-200 flex flex-col md:sticky md:top-2 md:h-[calc(100vh-1rem)] max-w-full overflow-hidden">
          
          {/* Cart Header */}
          <div className="p-3.5 border-b border-stone-200 flex items-center justify-between bg-matcha-leaf text-tofu-silkblaze rounded-t-2xl flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-noodle-cream flex-shrink-0" />
              <div>
                <h2 className="font-extrabold text-sm text-noodle-cream flex items-center space-x-1.5">
                  <span>Pesanan Kasir (OT)</span>
                  {posCart.length > 0 && (
                    <span className="bg-spicy-ember text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {posCartTotal.itemCount}
                    </span>
                  )}
                </h2>
                <span className="text-[10px] text-noodle-dark">Keranjang Transaksi Langsung</span>
              </div>
            </div>
            {posCart.length > 0 && (
              <button
                type="button"
                onClick={clearPosCart}
                className="text-[11px] bg-red-600/30 hover:bg-red-600/60 active:scale-95 text-white font-bold px-2.5 py-1 rounded-lg transition"
              >
                Reset
              </button>
            )}
          </div>

          {/* Customer Name Input */}
          <div className="p-2.5 bg-stone-50 border-b border-stone-200 flex items-center space-x-2 flex-shrink-0">
            <User className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Nama Pelanggan (opsional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-transparent text-xs text-matcha-leaf font-bold focus:outline-none w-full"
            />
          </div>

          {/* Cart Items List (Scrollable, touch-friendly, high contrast) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[140px] max-h-[40vh] md:max-h-none hide-scrollbar">
            {posCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center py-8">
                <Receipt className="w-12 h-12 stroke-[1.5] mb-2 text-stone-300" />
                <p className="text-xs font-bold text-stone-500">Keranjang Masih Kosong</p>
                <p className="text-[11px] text-stone-400 mt-0.5">Sentuh produk di katalog untuk menambahkan pesanan</p>
              </div>
            ) : (
              posCart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-stone-50 rounded-xl p-2.5 sm:p-3 border border-stone-200 space-y-2"
                >
                  {/* Row 1: Item Name & Subtotal */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-xs sm:text-sm text-matcha-leaf leading-snug line-clamp-2">
                        {item.product.name}
                      </h4>
                      <div className="text-[11px] text-stone-500 font-semibold mt-0.5">
                        @Rp{item.product.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm font-black text-spicy-ember flex-shrink-0 text-right">
                      Rp{(item.product.price * item.quantity + (item.useCup ? CUP_FEE * item.quantity : 0)).toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* Row 2: Cup Packaging Toggle & Stepper Quantity */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-200/80">
                    <button
                      type="button"
                      onClick={() => togglePosCartCup(item.product.id)}
                      className={`text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-lg flex items-center space-x-1 transition select-none ${
                        item.useCup
                          ? 'bg-spicy-ember text-white shadow-xs'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span>{item.useCup ? 'Bungkus Cup (+1rb)' : '+ Bungkus Cup'}</span>
                    </button>

                    {/* Touch-Friendly Stepper */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => updatePosCartQty(item.product.id, -1)}
                        className="w-8 h-8 rounded-lg bg-stone-200 hover:bg-stone-300 active:scale-90 text-stone-800 flex items-center justify-center font-black transition text-sm"
                        title="Kurang 1"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <span className="w-7 text-center text-xs sm:text-sm font-black text-matcha-leaf select-none">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updatePosCartQty(item.product.id, 1)}
                        className="w-8 h-8 rounded-lg bg-spicy-ember hover:bg-spicy-hover active:scale-90 text-white flex items-center justify-center font-black transition text-sm shadow-xs"
                        title="Tambah 1"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment & Checkout Section (Pinned at Bottom, clearly visible) */}
          <div className="p-3 bg-stone-50 border-t-2 border-stone-200 rounded-b-2xl space-y-2 flex-shrink-0">
            
            {/* TOTAL TAGIHAN BANNER (Highlight for Tablet POS) */}
            <div className="bg-matcha-deep text-white p-2.5 sm:p-3 rounded-xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-[11px] text-noodle-cream block font-medium">Total Tagihan ({posCartTotal.itemCount} menu)</span>
                {posCartTotal.cupFee > 0 && (
                  <span className="text-[10px] text-yolk-blaze font-bold block">+Rp{posCartTotal.cupFee.toLocaleString('id-ID')} Cup</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-base sm:text-xl font-black text-yolk-blaze tracking-tight">
                  Rp{posCartTotal.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition active:scale-95 ${
                  paymentMethod === 'CASH'
                    ? 'bg-matcha-leaf text-white shadow-sm ring-2 ring-matcha-leaf/30'
                    : 'bg-white border-2 border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Banknote className="w-4 h-4 flex-shrink-0" />
                <span>💵 Tunai</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition active:scale-95 ${
                  paymentMethod === 'QRIS'
                    ? 'bg-matcha-leaf text-white shadow-sm ring-2 ring-matcha-leaf/30'
                    : 'bg-white border-2 border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <CreditCard className="w-4 h-4 flex-shrink-0" />
                <span>📱 QRIS Kasir</span>
              </button>
            </div>

            {/* Cash Input & Quick Bills */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-xs font-bold text-matcha-leaf">
                  <span className="text-[11px] text-stone-500 font-semibold">Nominal Cepat:</span>
                  <button
                    type="button"
                    onClick={handleUangPas}
                    className="text-[11px] font-black text-spicy-ember hover:underline px-2 py-0.5 rounded bg-spicy-light/40 active:scale-95 transition"
                  >
                    ⚡ Uang Pas
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCash(amt)}
                      className="py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800 hover:bg-noodle-cream active:scale-95 transition"
                    >
                      {amt / 1000}rb
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">Rp</span>
                  <input
                    type="number"
                    placeholder="Nominal uang diterima..."
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    className="w-full bg-white border-2 border-stone-300 rounded-xl pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm font-black text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                  />
                </div>
                {cashGiven >= posCartTotal.total && posCartTotal.total > 0 && (
                  <div className="flex justify-between items-center text-xs sm:text-sm font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl shadow-xs animate-fadeIn">
                    <span>Kembalian:</span>
                    <span className="text-emerald-700 text-sm sm:text-base font-black">
                      Rp{(cashGiven - posCartTotal.total).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* QRIS Kasir Manual Input */}
            {paymentMethod === 'QRIS' && (
              <div className="space-y-2 pt-1 bg-white p-2.5 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-matcha-leaf flex items-center space-x-1">
                    <QrCode className="w-3.5 h-3.5 text-spicy-ember flex-shrink-0" />
                    <span>Input QRIS Manual</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsQrisBarcodeOpen(true)}
                    className="text-[11px] font-bold text-spicy-ember hover:underline flex items-center space-x-1 bg-spicy-light/30 px-2 py-0.5 rounded-md"
                  >
                    <span>Tampilkan Barcode QR</span>
                  </button>
                </div>

                {/* Quick Provider Picker */}
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">
                    Pilih Provider / Aplikasi Pembayaran:
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {['BCA', 'Gopay', 'OVO', 'Dana', 'ShopeePay', 'Lainnya'].map((prov) => (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => setQrisProvider(prov)}
                        className={`py-1 px-1 rounded-lg text-[10px] font-bold transition ${
                          qrisProvider === prov
                            ? 'bg-matcha-leaf text-white shadow-xs'
                            : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {prov}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nominal QRIS */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 mb-1">
                    <span>Nominal QRIS Masuk:</span>
                    <button
                      type="button"
                      onClick={() => setQrisAmount(posCartTotal.total)}
                      className="text-spicy-ember underline font-bold"
                    >
                      Sesuai Tagihan
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder={`Rp${posCartTotal.total.toLocaleString('id-ID')}`}
                    value={qrisAmount || ''}
                    onChange={(e) => setQrisAmount(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                  />
                </div>

                {/* RRN / Approval Reference Number */}
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-0.5">
                    No. Referensi / RRN Bukti Bayar:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: RRN-892301 / 123456"
                    value={qrisRefNumber}
                    onChange={(e) => setQrisRefNumber(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1 text-xs text-matcha-leaf font-mono focus:outline-none focus:border-spicy-ember"
                  />
                </div>
              </div>
            )}

            {/* Submit Button (Clear, prominent, comfortable touch) */}
            <button
              type="button"
              disabled={posCart.length === 0}
              onClick={handleProcessTransaction}
              className={`w-full py-3 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2 select-none ${
                posCart.length === 0
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-spicy-ember hover:bg-spicy-hover active:scale-98 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Simpan & Terbitkan Nomor OT</span>
            </button>

          </div>

        </div>

      </div>

      {/* Digital Receipt Modal (Print preview simulation) */}
      {isReceiptOpen && lastCompletedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-floating border border-stone-200 text-matcha-leaf text-center font-mono text-xs">
            
            {/* Receipt Header */}
            <div className="border-b-2 border-dashed border-stone-300 pb-3">
              <div className="text-base font-bold font-sans">BUBUR KHALID</div>
              <div className="text-[10px] text-stone-500">Jl. Zaini No. 1c • Telp: 0812-3456-7890</div>
              <div className="text-[10px] text-stone-500">Buka Senin-Sabtu 16.00-22.00 WIB</div>
            </div>

            {/* Big OT Queue */}
            <div className="my-3 py-2 bg-noodle-cream/50 rounded-xl border border-noodle-dark">
              <div className="text-[10px] text-stone-600 font-sans">NOMOR ANTREAN TOKO</div>
              <div className="text-3xl font-black font-sans text-spicy-ember">
                {lastCompletedOrder.queue_number}
              </div>
              <div className="text-[10px] text-stone-600 font-sans">
                Urutan Dapur: #{lastCompletedOrder.global_queue_sequence} (FIFO)
              </div>
            </div>

            {/* Transaction Metadata */}
            <div className="text-left text-[11px] space-y-1 mb-3 border-b border-stone-200 pb-2">
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{new Date().toLocaleTimeString('id-ID')} WIB</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>Siska (CASHIER)</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{lastCompletedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Pembayaran:</span>
                <span>{lastCompletedOrder.payment_method} (LUNAS)</span>
              </div>
              {lastCompletedOrder.payment_method === 'QRIS' && (
                <>
                  <div className="flex justify-between text-stone-600">
                    <span>Provider:</span>
                    <span>{lastCompletedOrder.qris_provider || 'BCA / QRIS'}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>No. Ref/RRN:</span>
                    <span className="font-mono">{lastCompletedOrder.qris_reference || '-'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Items */}
            <div className="text-left text-[11px] space-y-1 mb-3 border-b-2 border-dashed border-stone-300 pb-2">
              {lastCompletedOrder.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span>
                    {it.quantity}x {it.product_name_snapshot}
                    {it.use_cup && ' (Cup)'}
                  </span>
                  <span>Rp{it.line_total.toLocaleString('id-ID')}</span>
                </div>
              ))}
              {lastCompletedOrder.cup_fee > 0 && (
                <div className="flex justify-between text-stone-500 text-[10px]">
                  <span>Biaya Bungkus Cup</span>
                  <span>Rp{lastCompletedOrder.cup_fee.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {/* Total & Change */}
            <div className="text-left text-[11px] space-y-1 mb-4 font-bold">
              <div className="flex justify-between text-xs">
                <span>TOTAL:</span>
                <span>Rp{lastCompletedOrder.total_amount.toLocaleString('id-ID')}</span>
              </div>
              {lastCompletedOrder.payment_method === 'CASH' && (
                <>
                  <div className="flex justify-between text-stone-500 font-normal">
                    <span>Tunai:</span>
                    <span>Rp{(lastCompletedOrder.total_amount + lastChange).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Kembalian:</span>
                    <span>Rp{lastChange.toLocaleString('id-ID')}</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-[10px] text-stone-400 mb-4 font-sans">
              Terima Kasih Atas Kunjungan Anda! Harap simpan struk ini untuk mengambil pesanan.
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 font-sans">
              <button
                onClick={() => {
                  alert('Perintah cetak struk dikirim ke printer thermal Bluetooth/USB.');
                }}
                className="flex-1 bg-matcha-leaf text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk</span>
              </button>
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-800 py-2 rounded-xl text-xs font-bold"
              >
                Tutup / Selesai
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Barcode QRIS Toko */}
      {isQrisBarcodeOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-floating border border-stone-200 text-center relative animate-fade-in">
            <button
              onClick={() => setIsQrisBarcodeOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-spicy-ember text-white flex items-center justify-center text-sm font-bold">
                BK
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-sm text-matcha-leaf">QRIS Kasir Bubur Khalid</h3>
                <p className="text-[10px] text-stone-500 font-mono">
                  NMID: {storeSettings.paymentMethods.qris.nmid || 'ID1020039485721'}
                </p>
              </div>
            </div>

            <div className="my-3 p-4 bg-white rounded-2xl border-2 border-stone-200 flex flex-col items-center justify-center shadow-inner">
              <div className="relative w-56 h-56">
                <Image
                  src={storeSettings.paymentMethods.qris.qrisImageUrl || '/images/qr/qris-bubur-khalid.svg'}
                  alt="QRIS Barcode Kasir"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="mt-2 text-xs font-bold text-matcha-leaf">
                Total Tagihan:{' '}
                <span className="text-spicy-ember font-black">
                  Rp{posCartTotal.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 mb-4">
              Arahkan kamera HP pelanggan ke kode QRIS di atas menggunakan GoPay, OVO, BCA, Dana, atau mobile banking apapun.
            </p>

            <button
              onClick={() => setIsQrisBarcodeOpen(false)}
              className="w-full bg-matcha-leaf hover:bg-matcha-leaf/90 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm"
            >
              Tutup & Lanjutkan Pembayaran
            </button>
          </div>
        </div>
      )}

    </div>
  );
}


