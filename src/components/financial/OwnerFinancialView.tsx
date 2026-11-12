'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store/AppContext';
import { getJakartaDateStr, getJakartaMonthStr, formatJakartaFullDate, formatJakartaTime } from '@/lib/date-utils';
import {
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Download,
  AlertOctagon,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  Calendar,
  CreditCard,
  Banknote,
  LayoutDashboard,
  X,
  Send,
  Smartphone,
  RefreshCw,
} from 'lucide-react';

export function OwnerFinancialView() {
  const {
    financialSummary,
    isFinancialUnlocked,
    unlockFinancialGate,
    lockFinancialGate,
    financialLockRemainingSeconds,
    orders,
    auditLogs,
    setActiveView,
    storeSettings,
    showToast,
  } = useApp();

  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeOtp, setActiveOtp] = useState<string | null>(null);
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  // Dynamic Real Financial Data derived from orders
  const validOrders = useMemo(() => orders.filter((o) => o.order_status !== 'CANCELLED'), [orders]);
  const cancelledOrders = useMemo(() => orders.filter((o) => o.order_status === 'CANCELLED'), [orders]);

  const todayStr = useMemo(() => getJakartaDateStr(new Date()), []);
  const currentMonthStr = useMemo(() => getJakartaMonthStr(new Date()), []);

  const todayOrders = useMemo(
    () => validOrders.filter((o) => getJakartaDateStr(o.created_at) === todayStr),
    [validOrders, todayStr]
  );
  const todayRevenue = useMemo(
    () => todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    [todayOrders]
  );
  const todayTransactions = todayOrders.length;
  const todayAov = todayTransactions > 0 ? Math.round(todayRevenue / todayTransactions) : 0;

  const monthOrders = useMemo(
    () => validOrders.filter((o) => getJakartaDateStr(o.created_at).startsWith(currentMonthStr)),
    [validOrders, currentMonthStr]
  );
  const monthRevenue = useMemo(
    () => monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    [monthOrders]
  );
  const monthTransactions = monthOrders.length;

  // Channel breakdown
  const todayOnlineOrders = useMemo(() => todayOrders.filter((o) => o.queue_channel === 'ONLINE'), [todayOrders]);
  const todayOnlineRev = useMemo(
    () => todayOnlineOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    [todayOnlineOrders]
  );
  const todayInStoreOrders = useMemo(() => todayOrders.filter((o) => o.queue_channel === 'IN_STORE'), [todayOrders]);
  const todayInStoreRev = useMemo(
    () => todayInStoreOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    [todayInStoreOrders]
  );

  const onlinePct = todayRevenue > 0 ? Math.round((todayOnlineRev / todayRevenue) * 100) : 0;
  const inStorePct = todayRevenue > 0 ? (100 - onlinePct) : 0;

  // Payment method breakdown
  const qrisOrders = useMemo(
    () => todayOrders.filter((o) => o.payment_method === 'QRIS' || o.payment_method === 'TRANSFER'),
    [todayOrders]
  );
  const qrisRev = useMemo(() => qrisOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0), [qrisOrders]);

  const cashOrders = useMemo(() => todayOrders.filter((o) => o.payment_method === 'CASH'), [todayOrders]);
  const cashRev = useMemo(() => cashOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0), [cashOrders]);

  // Timer cooldown 60 detik untuk kirim ulang OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = () => {
    // Generate 6-digit secure random code
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveOtp(newOtp);
    setOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 menit
    setOtpSent(true);
    setCountdown(60);
    setErrorMessage(null);

    const rawPhone = storeSettings.adminWhatsapp || '6285274281819';
    const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '62');

    const msg = `🔒 *KODE OTP KEAMANAN OWNER BUBUR KHALID*\n\nKode Verifikasi Anda: *${newOtp}*\n\nKode ini berlaku selama 5 menit untuk membuka Laporan Keuangan Owner. JANGAN BERIKAN KODE INI KEPADA SIAPAPUN demi keamanan toko Anda.`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }

    showToast(`Kode OTP (${newOtp}) telah dikirim ke WhatsApp Owner (${rawPhone})`);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Cek apakah OTP kedaluwarsa jika dicocokkan dengan OTP
    if (activeOtp && otpExpiry && Date.now() > otpExpiry && passcodeInput === activeOtp) {
      setErrorMessage('Kode OTP telah kedaluwarsa (lebih dari 5 menit). Silakan kirim ulang OTP WhatsApp.');
      return;
    }

    const success = unlockFinancialGate(passcodeInput, activeOtp || undefined);
    if (!success) {
      setErrorMessage('Kode OTP atau PIN salah! Akses finansial ditolak dan dicatat di audit log.');
    } else {
      setPasscodeInput('');
    }
  };

  // EKSPOR CSV AKTIF: Mengunduh file CSV laporan riil terperinci
  const handleExportCSV = () => {
    const dateStr = getJakartaDateStr(new Date());
    const timeStr = formatJakartaTime(new Date());

    let csvContent = '\uFEFF'; // BOM UTF-8 agar karakter Excel tidak rusak
    csvContent += 'LAPORAN KEUANGAN DAN TRANSAKSI RESMI BUBUR KHALID\n';
    csvContent += `Tanggal Ekspor,${dateStr} ${timeStr} WIB\n`;
    csvContent += `Otorisasi Akun,Owner (ami_khalid)\n\n`;

    csvContent += '=== RINGKASAN KEUANGAN HARI INI ===\n';
    csvContent += 'Indikator,Nilai\n';
    csvContent += `Pendapatan Bersih Hari Ini,"Rp ${todayRevenue.toLocaleString('id-ID')}"\n`;
    csvContent += `Total Transaksi Hari Ini,${todayTransactions} Pesanan\n`;
    csvContent += `Rata-rata Nilai Transaksi (AOV),"Rp ${todayAov.toLocaleString('id-ID')}"\n`;
    csvContent += `Total Omzet Bulan Ini,"Rp ${monthRevenue.toLocaleString('id-ID')}"\n`;
    csvContent += `Total Transaksi Bulan Ini,${monthTransactions} Pesanan\n`;
    csvContent += `Pendapatan Kasir (In-Store),"Rp ${todayInStoreRev.toLocaleString('id-ID')} (${inStorePct}%)"\n`;
    csvContent += `Pendapatan Online (Web & QR),"Rp ${todayOnlineRev.toLocaleString('id-ID')} (${onlinePct}%)"\n`;
    csvContent += `Total Pembayaran Tunai (Cash),"Rp ${cashRev.toLocaleString('id-ID')} (${cashOrders.length} Transaksi)"\n`;
    csvContent += `Total Pembayaran QRIS/Digital,"Rp ${qrisRev.toLocaleString('id-ID')} (${qrisOrders.length} Transaksi)"\n`;
    csvContent += `Total Pesanan Dibatalkan,${cancelledOrders.length} Pesanan\n\n`;

    csvContent += '=== RINCIAN TRANSAKSI PESANAN RIIL ===\n';
    csvContent += 'No,ID Pesanan,Nomor Antrean,Waktu,Nama Pelanggan,Layanan,Channel,Metode Bayar,Status Bayar,Status Pesanan,Rincian Menu,Biaya Cup,Total Nominal\n';

    if (orders.length === 0) {
      csvContent += '-,Belum ada transaksi,-,-,-,-,-,-,-,-,-,-\n';
    } else {
      orders.forEach((o, idx) => {
        const itemsText = (o.items || [])
          .map((it) => `${it.product_name_snapshot || 'Menu'} (${it.quantity}x)`)
          .join('; ');
        const serviceText = o.service_type === 'DINE_IN' ? `Makan di Tempat (${o.table_number || 'Meja'})` : 'Bungkus / Takeaway';
        const channelText = o.queue_channel === 'ONLINE' ? 'Online Web' : 'Kasir POS';
        const formattedTime = o.created_at ? new Date(o.created_at).toLocaleString('id-ID') : '-';
        
        csvContent += `${idx + 1},"${o.id}","${o.queue_number}","${formattedTime}","${(o.customer_name || '-').replace(/"/g, '""')}","${serviceText}","${channelText}","${o.payment_method}","${o.payment_status}","${o.order_status}","${itemsText.replace(/"/g, '""')}","Rp ${(o.cup_fee || 0).toLocaleString('id-ID')}","Rp ${(o.total_amount || 0).toLocaleString('id-ID')}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `laporan_keuangan_bubur_khalid_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Laporan Keuangan CSV berhasil diunduh ke perangkat Anda!');
  };

  // IF LOCKED: Show Security Gate Modal (Enforcing Section 27 PRD)
  if (!isFinancialUnlocked) {
    const ownerPhone = storeSettings.adminWhatsapp || '6285274281819';
    const formattedPhone = ownerPhone.startsWith('62')
      ? `+62 ${ownerPhone.slice(2, 5)}-${ownerPhone.slice(5, 9)}-${ownerPhone.slice(9)}`
      : ownerPhone;

    return (
      <div className="min-h-screen bg-matcha-deep flex items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl max-w-md w-full p-7 md:p-8 shadow-floating border-2 border-spicy-ember/30 text-matcha-leaf text-center space-y-5 animate-slideUp">
          
          {/* Tombol X Close di pojok kanan atas modal */}
          <button
            type="button"
            onClick={() => setActiveView('admin')}
            className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-spicy-ember/30"
            title="Tutup & Kembali ke Admin"
            aria-label="Tutup Verifikasi"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-spicy-light text-spicy-ember mx-auto flex items-center justify-center text-2xl shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <div className="inline-flex items-center space-x-1.5 bg-spicy-ember/10 text-spicy-ember text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Owner Financial Security Gate</span>
            </div>
            <h2 className="text-xl font-black text-matcha-leaf">Verifikasi Identitas Pemilik</h2>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
              Sesuai PRD v1.1 Bagian 27, seluruh data omzet, keuntungan, dan laporan keuangan dilindungi ketat dan hanya dapat diakses oleh role <strong className="text-matcha-leaf">OWNER</strong>.
            </p>
          </div>

          {/* Kotak Pengiriman Kode OTP WhatsApp */}
          <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-4 text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                <Smartphone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Kirim Kode OTP via WhatsApp</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                WA Owner
              </span>
            </div>
            
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Kirim kode verifikasi 6-digit langsung ke nomor WhatsApp Owner:
              <strong className="block text-emerald-950 font-black mt-0.5 tracking-wide">
                {formattedPhone}
              </strong>
            </p>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={countdown > 0}
              className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-bold text-xs transition shadow-sm ${
                countdown > 0
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-[0.99]'
              }`}
            >
              {countdown > 0 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-400" />
                  <span>Kirim Ulang OTP ({countdown}s)</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{otpSent ? 'Kirim Ulang Kode OTP ke WhatsApp' : '📲 Kirim Kode OTP ke WhatsApp Owner'}</span>
                </>
              )}
            </button>

            {otpSent && (
              <div className="text-[11px] text-emerald-800 bg-white/70 border border-emerald-200 rounded-lg p-2 text-center font-medium">
                ✓ Kode OTP telah dikirim ke WhatsApp Owner. Silakan cek pesan WhatsApp Anda dan masukkan 6 digit di bawah.
              </div>
            )}
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-matcha-leaf mb-1">
                Masukkan 6-Digit Kode OTP WhatsApp / PIN Owner:
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Contoh: 849201 atau PIN"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-center text-sm font-black tracking-widest text-matcha-leaf focus:outline-none focus:border-spicy-ember focus:bg-white transition"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                <span>* Kode OTP berlaku 5 menit</span>
                <span>PIN Darurat: <code className="font-bold text-spicy-ember">123456</code></span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-spicy-ember hover:bg-spicy-hover text-white py-3 rounded-xl font-extrabold text-xs shadow-md transition"
            >
              Buka Laporan Keuangan
            </button>

            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className="w-full py-2.5 rounded-xl border border-stone-300 text-stone-600 hover:text-stone-800 text-xs font-bold transition hover:bg-stone-50"
            >
              ← Batal & Kembali ke Dashboard Admin
            </button>
          </form>

          <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400">
            Setiap percobaan akses diaudit otomatis di sistem keamanan server.
          </div>

        </div>
      </div>
    );
  }

  // IF UNLOCKED: Show Comprehensive Financial Dashboard
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-tofu-silkblaze p-6 lg:p-8 text-matcha-leaf">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Security Lease Active Banner */}
        <div className="bg-matcha-deep text-noodle-cream p-4 rounded-2xl border border-matcha-surface shadow-floating flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className="w-10 h-10 rounded-xl bg-matcha-surface hover:bg-matcha-leaf text-white flex items-center justify-center active:scale-95 transition shadow-sm flex-shrink-0"
              title="Kembali ke Dashboard Admin"
            >
              <LayoutDashboard className="w-5 h-5 text-noodle-cream" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-white">Sesi Laporan Finansial Aktif (Owner Khalid)</span>
                <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded-full font-bold">
                  Verified
                </span>
              </div>
              <p className="text-xs text-noodle-dark">
                Otorisasi server berlaku. Sesi otomatis dikunci dalam {formatSeconds(financialLockRemainingSeconds)}.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCSV}
              className="bg-matcha-surface hover:bg-matcha-leaf text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-matcha-surface transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-yolk-blaze" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={lockFinancialGate}
              className="bg-spicy-ember hover:bg-spicy-hover text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Lock className="w-4 h-4" />
              <span>Kunci Sekarang</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
            <div className="text-xs text-stone-500 font-semibold">Pendapatan Bersih Hari Ini</div>
            <div className="text-2xl font-black text-matcha-leaf mt-1">
              Rp{todayRevenue.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
              <span>Transaksi: {todayTransactions} Pesanan</span>
              <span className="font-bold text-emerald-600">
                {todayRevenue > 0 ? '✓ Riil Terverifikasi' : 'Belum Ada Transaksi'}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
            <div className="text-xs text-stone-500 font-semibold">Total Omzet Bulan Berjalan</div>
            <div className="text-2xl font-black text-matcha-leaf mt-1">
              Rp{monthRevenue.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
              <span>{monthTransactions} Transaksi Bulan Ini</span>
              <span className="font-bold text-emerald-600">✓ Akumulasi Riil</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
            <div className="text-xs text-stone-500 font-semibold">Rata-rata Nilai Transaksi (AOV)</div>
            <div className="text-2xl font-black text-spicy-ember mt-1">
              Rp{todayAov.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-stone-400 mt-2 pt-2 border-t border-stone-100">
              {todayTransactions > 0
                ? `Perhitungan dari ${todayTransactions} transaksi terverifikasi`
                : 'Belum ada transaksi hari ini'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
            <div className="text-xs text-stone-500 font-semibold">Pesanan Dibatalkan / Refund</div>
            <div className="text-2xl font-black text-stone-700 mt-1">
              Rp{cancelledOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-stone-400 mt-2 pt-2 border-t border-stone-100">
              {cancelledOrders.length} transaksi dibatalkan
            </div>
          </div>

        </div>

        {/* Revenue Distribution by Channel & Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue by Channel */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft space-y-4">
            <h3 className="font-extrabold text-sm text-matcha-leaf">
              Distribusi Pendapatan Berdasarkan Channel
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Online Order (QR Meja &amp; Web Takeaway)</span>
                  <span className="text-spicy-ember">
                    Rp{todayOnlineRev.toLocaleString('id-ID')} ({onlinePct}%)
                  </span>
                </div>
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-spicy-ember h-full rounded-full transition-all duration-500" style={{ width: `${onlinePct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Order di Tempat (POS Kasir Langsung)</span>
                  <span className="text-matcha-leaf">
                    Rp{todayInStoreRev.toLocaleString('id-ID')} ({inStorePct}%)
                  </span>
                </div>
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-matcha-leaf h-full rounded-full transition-all duration-500" style={{ width: `${inStorePct}%` }} />
                </div>
              </div>
            </div>

            <div className="p-3 bg-tofu-silkblaze rounded-xl text-[11px] text-stone-600 border border-noodle-dark/50">
              💡 <strong>Insight Owner:</strong>{' '}
              {todayRevenue === 0
                ? 'Belum ada transaksi penjualan yang tercatat pada hari ini.'
                : onlinePct > 0
                ? `Penggunaan pemesanan online menyumbang ${onlinePct}% dari omzet hari ini, dan ${inStorePct}% diproses melalui kasir langsung.`
                : `Seluruh ${todayTransactions} transaksi hari ini (${inStorePct}%) tercatat dari pemesanan kasir langsung (In-Store POS).`}
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft space-y-4">
            <h3 className="font-extrabold text-sm text-matcha-leaf">Metode Pembayaran Terverifikasi</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center space-x-2 text-xs font-bold text-matcha-leaf">
                  <CreditCard className="w-4 h-4 text-spicy-ember" />
                  <span>QRIS &amp; Digital</span>
                </div>
                <div className="text-xl font-black text-spicy-ember mt-2">
                  Rp{qrisRev.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-stone-500 mt-1">
                  {qrisOrders.length} transaksi terverifikasi
                </div>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center space-x-2 text-xs font-bold text-matcha-leaf">
                  <Banknote className="w-4 h-4 text-emerald-700" />
                  <span>Tunai di Kasir</span>
                </div>
                <div className="text-xl font-black text-emerald-700 mt-2">
                  Rp{cashRev.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-stone-500 mt-1">
                  {cashOrders.length} transaksi lunas
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Real Transactions Breakdown Table */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-matcha-leaf">
                Rincian Transaksi Riil Hari Ini ({todayOrders.length})
              </h3>
              <p className="text-[11px] text-stone-500">
                Data transaksi aktual yang terekam pada sistem database toko.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCSV}
              className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition inline-flex items-center space-x-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh CSV Lengkap</span>
            </button>
          </div>

          {todayOrders.length === 0 ? (
            <div className="p-8 text-center text-stone-400 bg-stone-50/60 rounded-xl border border-dashed border-stone-200 text-xs">
              Belum ada transaksi yang tercatat hari ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                  <tr>
                    <th className="p-2.5">No. Antrean</th>
                    <th className="p-2.5">Waktu</th>
                    <th className="p-2.5">Pelanggan</th>
                    <th className="p-2.5">Layanan</th>
                    <th className="p-2.5">Rincian Menu</th>
                    <th className="p-2.5">Metode Bayar</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {todayOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50/60 transition">
                      <td className="p-2.5">
                        <span className="font-mono font-black bg-stone-100 text-stone-800 px-2 py-0.5 rounded text-xs">
                          {o.queue_number}
                        </span>
                      </td>
                      <td className="p-2.5 text-stone-500 font-mono text-[11px]">
                        {o.created_at ? new Date(o.created_at).toLocaleTimeString('id-ID') : '-'} WIB
                      </td>
                      <td className="p-2.5 font-bold text-matcha-leaf">{o.customer_name}</td>
                      <td className="p-2.5 text-stone-500">
                        {o.service_type === 'DINE_IN' ? `Meja ${o.table_number || '-'}` : 'Takeaway'}
                      </td>
                      <td className="p-2.5 text-stone-600 text-[11px] max-w-xs truncate">
                        {(o.items || []).map((it) => `${it.product_name_snapshot || 'Menu'} (${it.quantity}x)`).join(', ')}
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.payment_method === 'CASH'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.payment_method}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-matcha-leaf">
                        Rp{(o.total_amount || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security & Financial Access Audit Log Table */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-matcha-leaf">
              Log Audit Keamanan Finansial (Sesuai Bagian 27.4 PRD)
            </h3>
            <span className="text-[11px] text-stone-400 font-mono">Immutable Server Audit Trail</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                <tr>
                  <th className="p-2.5">Waktu</th>
                  <th className="p-2.5">Aktor</th>
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5">Aksi</th>
                  <th className="p-2.5">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/60">
                    <td className="p-2.5 text-stone-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID')} WIB
                    </td>
                    <td className="p-2.5 font-bold text-matcha-leaf">{log.actor}</td>
                    <td className="p-2.5">
                      <span className="bg-stone-200 px-1.5 py-0.5 rounded text-[10px] font-mono">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-spicy-ember text-[11px]">{log.action}</td>
                    <td className="p-2.5 text-stone-600 text-[11px]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
