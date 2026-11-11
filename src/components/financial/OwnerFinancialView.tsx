'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';
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
  } = useApp();

  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const success = unlockFinancialGate(passcodeInput);
    if (!success) {
      setErrorMessage('Passcode keamanan salah! Akses finansial ditolak dan dicatat di audit log.');
    } else {
      setPasscodeInput('');
    }
  };

  const handleExportCSV = () => {
    alert('Simulasi ekspor CSV data keuangan Bubur Khalid terenkripsi berhasil diunduh.');
  };

  // IF LOCKED: Show Security Gate Modal (Enforcing Section 27 PRD)
  if (!isFinancialUnlocked) {
    return (
      <div className="min-h-screen bg-matcha-deep flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-floating border-2 border-spicy-ember/30 text-matcha-leaf text-center space-y-5 animate-slideUp">
          
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

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-matcha-leaf mb-1">
                Masukkan Passcode / PIN Keamanan Owner:
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Ketik passcode (Demo: 123456)"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold tracking-widest text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                />
              </div>
              <div className="text-[10px] text-stone-400 mt-1 italic">
                * Passcode demo terkonfigurasi: <code className="font-bold text-spicy-ember">123456</code>
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
              Rp{financialSummary.today_revenue.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
              <span>Transaksi: {financialSummary.today_transactions}</span>
              <span className="font-bold text-emerald-600">+12% vs Kemarin</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
            <div className="text-xs text-stone-500 font-semibold">Total Omzet Bulan Berjalan</div>
            <div className="text-2xl font-black text-matcha-leaf mt-1">
              Rp{financialSummary.month_revenue.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
              <span>{financialSummary.month_transactions} Transaksi</span>
              <span className="font-bold text-emerald-600">+8% MoM</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
            <div className="text-xs text-stone-500 font-semibold">Rata-rata Nilai Transaksi (AOV)</div>
            <div className="text-2xl font-black text-spicy-ember mt-1">
              Rp{financialSummary.today_aov.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-stone-400 mt-2 pt-2 border-t border-stone-100">
              Perhitungan dari transaksi terverifikasi
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
            <div className="text-xs text-stone-500 font-semibold">Total Pengembalian (Refund)</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              Rp{financialSummary.refunds_total.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-stone-400 mt-2 pt-2 border-t border-stone-100">
              0 sengketa atau pembatalan lunas
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
                  <span>Online Order (QR Meja & Web Takeaway)</span>
                  <span className="text-spicy-ember">
                    Rp{financialSummary.today_online_revenue.toLocaleString('id-ID')} (71%)
                  </span>
                </div>
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-spicy-ember h-full rounded-full" style={{ width: '71%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Order di Tempat (POS Kasir Langsung)</span>
                  <span className="text-matcha-leaf">
                    Rp{financialSummary.today_instore_revenue.toLocaleString('id-ID')} (29%)
                  </span>
                </div>
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-matcha-leaf h-full rounded-full" style={{ width: '29%' }} />
                </div>
              </div>
            </div>

            <div className="p-3 bg-tofu-silkblaze rounded-xl text-[11px] text-stone-600 border border-noodle-dark/50">
              💡 <strong>Insight Owner:</strong> Penggunaan QR Code meja dan website takeaway menyumbang lebih dari 70% transaksi hari ini, mengurangi antrean fisik di kasir toko secara signifikan.
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft space-y-4">
            <h3 className="font-extrabold text-sm text-matcha-leaf">Metode Pembayaran Terverifikasi</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center space-x-2 text-xs font-bold text-matcha-leaf">
                  <CreditCard className="w-4 h-4 text-spicy-ember" />
                  <span>QRIS & Digital</span>
                </div>
                <div className="text-xl font-black text-spicy-ember mt-2">Rp890.000</div>
                <div className="text-[10px] text-stone-500 mt-1">56 transaksi terverifikasi</div>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center space-x-2 text-xs font-bold text-matcha-leaf">
                  <Banknote className="w-4 h-4 text-emerald-700" />
                  <span>Tunai di Kasir</span>
                </div>
                <div className="text-xl font-black text-emerald-700 mt-2">Rp360.000</div>
                <div className="text-[10px] text-stone-500 mt-1">22 transaksi lunas</div>
              </div>
            </div>
          </div>

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
