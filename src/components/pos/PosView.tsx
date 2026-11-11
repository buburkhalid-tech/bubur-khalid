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
    <div className="min-h-screen bg-tofu-warm p-4 lg:p-6 text-matcha-leaf">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        
        {/* LEFT / CENTER: Touch Product Catalog Grid (65% width) */}
        <div className="flex-1 space-y-4">
          
          {/* Top Bar POS */}
          <div className="bg-white p-4 rounded-2xl shadow-soft border border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setActiveView('admin')}
                className="md:hidden flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-matcha-leaf text-tofu-silkblaze text-xs font-bold active:scale-95 transition"
                title="Kembali ke Dashboard Admin"
              >
                <span>← Admin</span>
              </button>

              <div className="w-11 h-11 rounded-xl bg-white border border-stone-200 overflow-hidden relative shadow-sm flex-shrink-0 p-0.5">
                <Image
                  src={storeSettings.storeLogo || '/images/logo/bubur-khalid-logo.png'}
                  alt="Logo Bubur Khalid"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="font-extrabold text-base text-matcha-leaf">POS Kasir Bubur Khalid</h1>
                <p className="text-xs text-stone-500">Mode Tablet Touchscreen • Antrean Order di Tempat (OT)</p>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative min-w-[240px]">
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm ${
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
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
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
                  className={`bg-white rounded-2xl p-3 shadow-soft border-2 transition-all cursor-pointer select-none active:scale-95 relative flex flex-col justify-between ${
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
                    <div className="w-full h-28 rounded-xl overflow-hidden relative mb-2 bg-tofu-silkblaze border border-stone-100">
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
                    <h3 className="font-extrabold text-xs text-matcha-leaf mt-1 line-clamp-1">{p.name}</h3>
                  </div>
                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className={`font-black text-xs ${isSoldOut ? 'text-stone-400' : 'text-spicy-ember'}`}>
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

        {/* RIGHT: Persistent Side Cart & Touch Checkout (35% width) */}
        <div className="w-full lg:w-96 bg-white rounded-2xl shadow-card border border-stone-200 flex flex-col h-[calc(100vh-6rem)] sticky top-20">
          
          {/* Cart Header */}
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-matcha-leaf text-tofu-silkblaze rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-noodle-cream" />
              <div>
                <h2 className="font-extrabold text-sm text-noodle-cream">Pesanan Kasir (OT)</h2>
                <span className="text-[10px] text-noodle-dark">Keranjang Transaksi Langsung</span>
              </div>
            </div>
            {posCart.length > 0 && (
              <button
                onClick={clearPosCart}
                className="text-[11px] bg-red-600/30 hover:bg-red-600/50 text-white px-2 py-1 rounded transition"
              >
                Reset
              </button>
            )}
          </div>

          {/* Customer Name Input */}
          <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center space-x-2">
            <User className="w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Nama Pelanggan (opsional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-transparent text-xs text-matcha-leaf font-semibold focus:outline-none w-full"
            />
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
            {posCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center py-12">
                <Receipt className="w-12 h-12 stroke-[1.5] mb-2 text-stone-300" />
                <p className="text-xs font-semibold">Keranjang Masih Kosong</p>
                <p className="text-[11px] text-stone-400 mt-0.5">Sentuh produk di sebelah kiri untuk menambahkan</p>
              </div>
            ) : (
              posCart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-stone-50 rounded-xl p-3 border border-stone-200 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-matcha-leaf">{item.product.name}</h4>
                      <div className="text-[11px] text-stone-500">
                        Rp{item.product.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="text-xs font-extrabold text-spicy-ember">
                      Rp{(item.product.price * item.quantity + (item.useCup ? CUP_FEE * item.quantity : 0)).toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* Cup Packaging Toggle for POS */}
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                    <button
                      type="button"
                      onClick={() => togglePosCartCup(item.product.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 transition ${
                        item.useCup
                          ? 'bg-spicy-ember text-white'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      <Coffee className="w-3 h-3" />
                      <span>{item.useCup ? 'Bungkus Cup (+Rp1.000)' : '+ Bungkus Cup'}</span>
                    </button>

                    {/* Stepper buttons */}
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => updatePosCartQty(item.product.id, -1)}
                        className="w-6 h-6 rounded bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center font-bold text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updatePosCartQty(item.product.id, 1)}
                        className="w-6 h-6 rounded bg-spicy-ember hover:bg-spicy-hover text-white flex items-center justify-center font-bold text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment & Checkout Section */}
          <div className="p-4 bg-stone-50 border-t border-stone-200 rounded-b-2xl space-y-3">
            
            {/* Total Details */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal ({posCartTotal.itemCount} item)</span>
                <span>Rp{posCartTotal.subtotal.toLocaleString('id-ID')}</span>
              </div>
              {posCartTotal.cupFee > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Biaya Tambahan Cup</span>
                  <span>+Rp{posCartTotal.cupFee.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-matcha-leaf pt-1 border-t border-stone-200">
                <span>Total Tagihan</span>
                <span className="text-spicy-ember">Rp{posCartTotal.total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  paymentMethod === 'CASH'
                    ? 'bg-matcha-leaf text-tofu-silkblaze shadow-sm'
                    : 'bg-white border border-stone-300 text-stone-700'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Tunai</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  paymentMethod === 'QRIS'
                    ? 'bg-matcha-leaf text-tofu-silkblaze shadow-sm'
                    : 'bg-white border border-stone-300 text-stone-700'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>QRIS Kasir</span>
              </button>
            </div>

            {/* Cash Input & Quick Bills */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-matcha-leaf">
                  <span>Uang Diterima:</span>
                  <button
                    type="button"
                    onClick={handleUangPas}
                    className="text-[11px] text-spicy-ember underline"
                  >
                    Uang Pas
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCash(amt)}
                      className="py-1 bg-white border border-stone-300 rounded-lg text-[10px] font-bold hover:bg-noodle-cream transition"
                    >
                      {amt / 1000}rb
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Nominal uang..."
                  value={cashGiven || ''}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                />
                {cashGiven >= posCartTotal.total && posCartTotal.total > 0 && (
                  <div className="flex justify-between items-center text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    <span>Kembalian:</span>
                    <span>Rp{(cashGiven - posCartTotal.total).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            )}

            {/* QRIS Kasir Manual Input */}
            {paymentMethod === 'QRIS' && (
              <div className="space-y-2.5 pt-1 bg-white p-3 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-matcha-leaf flex items-center space-x-1">
                    <QrCode className="w-3.5 h-3.5 text-spicy-ember" />
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
                        className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition ${
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
                      className="text-spicy-ember underline"
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
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">
                    No. Referensi / RRN Bukti Bayar:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: RRN-892301 / 123456"
                    value={qrisRefNumber}
                    onChange={(e) => setQrisRefNumber(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-matcha-leaf font-mono focus:outline-none focus:border-spicy-ember"
                  />
                  <p className="text-[9px] text-stone-400 mt-0.5">
                    *Masukkan RRN dari notifikasi / mutasi rekening kasir
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={posCart.length === 0}
              onClick={handleProcessTransaction}
              className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-md transition flex items-center justify-center space-x-2 ${
                posCart.length === 0
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-spicy-ember hover:bg-spicy-hover text-white active:scale-98'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
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


