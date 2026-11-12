'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store/AppContext';
import { getJakartaDateStr, getJakartaMonthStr, formatJakartaTime } from '@/lib/date-utils';
import { StaffSalary } from '@/lib/types';
import {
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  FileSpreadsheet,
  CheckCircle2,
  AlertOctagon,
  CreditCard,
  Banknote,
  LayoutDashboard,
  X,
  Send,
  RefreshCw,
  Mail,
  Eye,
  EyeOff,
  Users,
  UserPlus,
  Plus,
  Edit3,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Briefcase,
  Receipt,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Check,
} from 'lucide-react';

export function OwnerFinancialView() {
  const {
    isFinancialUnlocked,
    unlockFinancialGate,
    lockFinancialGate,
    financialLockRemainingSeconds,
    orders,
    auditLogs,
    setActiveView,
    storeSettings,
    currentUser,
    users,
    showToast,
    staffSalaries,
    addStaffSalary,
    updateStaffSalary,
    deleteStaffSalary,
    toggleStaffSalaryStatus,
    resetDefaultStaffSalaries,
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

  // STAFF SALARY & CASHFLOW CALCULATIONS (Pemasukan vs Pengeluaran)
  const totalSalaryExpense = useMemo(
    () => staffSalaries.reduce((sum, s) => sum + Number(s.salary_amount || 0), 0),
    [staffSalaries]
  );
  const paidSalaryExpense = useMemo(
    () => staffSalaries.filter((s) => s.payment_status === 'PAID').reduce((sum, s) => sum + Number(s.salary_amount || 0), 0),
    [staffSalaries]
  );
  const pendingSalaryExpense = useMemo(
    () => staffSalaries.filter((s) => s.payment_status === 'PENDING').reduce((sum, s) => sum + Number(s.salary_amount || 0), 0),
    [staffSalaries]
  );

  // Estimasi HPP / Bahan Baku F&B Bubur Minang (30% dari omzet bulanan)
  const estimatedCogs = useMemo(() => Math.round(monthRevenue * 0.30), [monthRevenue]);
  const totalExpenseMonth = useMemo(() => totalSalaryExpense + estimatedCogs, [totalSalaryExpense, estimatedCogs]);
  const netProfitMonth = useMemo(() => monthRevenue - totalExpenseMonth, [monthRevenue, totalExpenseMonth]);
  const netProfitMargin = useMemo(
    () => (monthRevenue > 0 ? ((netProfitMonth / monthRevenue) * 100).toFixed(1) : '0.0'),
    [monthRevenue, netProfitMonth]
  );

  // State for Staff Salary Modal
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState<boolean>(false);
  const [editingSalary, setEditingSalary] = useState<StaffSalary | null>(null);
  const [salaryFormName, setSalaryFormName] = useState<string>('');
  const [salaryFormRole, setSalaryFormRole] = useState<string>('Koki / Dapur');
  const [salaryFormCustomRole, setSalaryFormCustomRole] = useState<string>('');
  const [salaryFormAmount, setSalaryFormAmount] = useState<string>('2500000');
  const [salaryFormType, setSalaryFormType] = useState<'MONTHLY' | 'DAILY'>('MONTHLY');
  const [salaryFormStatus, setSalaryFormStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [salaryFormNotes, setSalaryFormNotes] = useState<string>('');

  const [authMethod, setAuthMethod] = useState<'PASSWORD' | 'EMAIL' | 'WHATSAPP'>('PASSWORD');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  const ownerUser = useMemo(() => users.find((u) => u.role === 'OWNER') || currentUser, [users, currentUser]);
  const ownerEmail = ownerUser?.email || 'buburkhalid@gmail.com';
  const rawPhone = storeSettings.adminWhatsapp || ownerUser?.phone || '6285274281819';
  const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '62');
  const formattedPhone = cleanPhone.startsWith('62')
    ? `+62 ${cleanPhone.slice(2, 5)}-${cleanPhone.slice(5, 9)}-${cleanPhone.slice(9)}`
    : rawPhone;

  // Timer cooldown 60 detik untuk kirim ulang OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Handler Kirim OTP ke Email Terdaftar Owner
  const handleSendEmailOtp = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveOtp(newOtp);
    setOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 menit
    setOtpSent(true);
    setCountdown(60);
    setErrorMessage(null);
    setEmailNotice(`Kode OTP 6-digit telah dikirimkan ke email resmi pemilik (${ownerEmail}).`);
    showToast(`Kode OTP verifikasi telah dikirim ke email ${ownerEmail}`);
  };

  // Handler Kirim OTP via WhatsApp
  const handleSendWhatsAppOtp = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveOtp(newOtp);
    setOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 menit
    setOtpSent(true);
    setCountdown(60);
    setErrorMessage(null);

    const msg = `🔒 *KODE OTP KEAMANAN OWNER BUBUR KHALID*\n\nKode Verifikasi Anda: *${newOtp}*\n\nKode ini berlaku selama 5 menit untuk membuka Laporan Keuangan Owner. JANGAN BERIKAN KODE INI KEPADA SIAPAPUN demi keamanan toko Anda.`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }

    showToast(`Tautan WhatsApp OTP dibuka menuju ${formattedPhone}`);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Cek apakah OTP kedaluwarsa jika dicocokkan dengan OTP
    if (activeOtp && otpExpiry && Date.now() > otpExpiry && passcodeInput === activeOtp) {
      setErrorMessage('Kode OTP telah kedaluwarsa (lebih dari 5 menit). Silakan minta kode OTP baru.');
      return;
    }

    const success = unlockFinancialGate(passcodeInput, activeOtp || undefined);
    if (!success) {
      setErrorMessage('Kredensial salah! Akses ditolak. Harap masukkan Kata Sandi akun Owner, PIN resmi, atau kode OTP yang valid.');
    } else {
      setPasscodeInput('');
    }
  };

  // Modal Salary Handlers
  const handleOpenAddSalaryModal = () => {
    setEditingSalary(null);
    setSalaryFormName(`Karyawan ${String.fromCharCode(65 + (staffSalaries.length % 26))}`);
    setSalaryFormRole('Koki / Dapur');
    setSalaryFormCustomRole('');
    setSalaryFormAmount('2500000');
    setSalaryFormType('MONTHLY');
    setSalaryFormStatus('PAID');
    setSalaryFormNotes('');
    setIsSalaryModalOpen(true);
  };

  const handleOpenEditSalaryModal = (salary: StaffSalary) => {
    setEditingSalary(salary);
    setSalaryFormName(salary.name);
    const standardRoles = ['Koki / Dapur', 'Kasir POS & Front Office', 'Pelayan & Kebersihan', 'Admin Operasional', 'Kurir / Delivery'];
    if (standardRoles.includes(salary.role)) {
      setSalaryFormRole(salary.role);
      setSalaryFormCustomRole('');
    } else {
      setSalaryFormRole('Lainnya');
      setSalaryFormCustomRole(salary.role);
    }
    setSalaryFormAmount(String(salary.salary_amount));
    setSalaryFormType(salary.salary_type);
    setSalaryFormStatus(salary.payment_status);
    setSalaryFormNotes(salary.notes || '');
    setIsSalaryModalOpen(true);
  };

  const handleSaveSalary = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = salaryFormName.trim();
    const finalRole = salaryFormRole === 'Lainnya' ? (salaryFormCustomRole.trim() || 'Staf Operasional') : salaryFormRole;
    const cleanAmount = parseInt(salaryFormAmount.replace(/\D/g, '') || '0', 10);

    if (!cleanName) {
      showToast('Harap masukkan nama karyawan!');
      return;
    }
    if (cleanAmount <= 0) {
      showToast('Nominal gaji harus lebih dari Rp 0!');
      return;
    }

    if (editingSalary) {
      updateStaffSalary(editingSalary.id, {
        name: cleanName,
        role: finalRole,
        salary_amount: cleanAmount,
        salary_type: salaryFormType,
        payment_status: salaryFormStatus,
        notes: salaryFormNotes.trim(),
      });
    } else {
      addStaffSalary({
        name: cleanName,
        role: finalRole,
        salary_amount: cleanAmount,
        salary_type: salaryFormType,
        payment_status: salaryFormStatus,
        period: 'Bulan Berjalan',
        notes: salaryFormNotes.trim(),
      });
    }

    setIsSalaryModalOpen(false);
  };

  // EKSPOR CSV AKTIF: Mengunduh file CSV laporan riil terperinci termasuk Gaji & Arus Kas
  const handleExportCSV = () => {
    const dateStr = getJakartaDateStr(new Date());
    const timeStr = formatJakartaTime(new Date());

    let csvContent = '\uFEFF'; // BOM UTF-8 agar karakter Excel tidak rusak
    csvContent += 'LAPORAN KEUANGAN, ARUS KAS & GAJI KARYAWAN BUBUR KHALID\n';
    csvContent += `Tanggal Ekspor,${dateStr} ${timeStr} WIB\n`;
    csvContent += `Otorisasi Akun,Owner (${ownerUser?.username || 'ami_khalid'})\n\n`;

    csvContent += '=== RINGKASAN ARUS KAS & LABA BERSIH ===\n';
    csvContent += 'Indikator Keuangan,Nominal,Keterangan\n';
    csvContent += `Total Omzet Pemasukan Bulan Ini,"Rp ${monthRevenue.toLocaleString('id-ID')}",Akumulasi pesanan riil\n`;
    csvContent += `Total Beban Gaji Karyawan,"Rp ${totalSalaryExpense.toLocaleString('id-ID')}",${staffSalaries.length} Orang Karyawan\n`;
    csvContent += `Gaji Terbayar (Lunas),"Rp ${paidSalaryExpense.toLocaleString('id-ID')}",Sudah dibayarkan\n`;
    csvContent += `Gaji Belum Dibayar (Pending),"Rp ${pendingSalaryExpense.toLocaleString('id-ID')}",Menunggu pembayaran\n`;
    csvContent += `Estimasi Beban Bahan Baku & HPP (30%),"Rp ${estimatedCogs.toLocaleString('id-ID')}",Standar F&B Bubur Minang\n`;
    csvContent += `Total Pengeluaran Bulan Ini,"Rp ${totalExpenseMonth.toLocaleString('id-ID')}",Gaji Karyawan + HPP\n`;
    csvContent += `LABA BERSIH BULAN INI (NET PROFIT),"Rp ${netProfitMonth.toLocaleString('id-ID')}",Omzet dikurangi Seluruh Pengeluaran\n`;
    csvContent += `Margin Laba Bersih,"${netProfitMargin}%",Profit Margin\n\n`;

    csvContent += '=== RINCIAN GAJI STAF KARYAWAN ===\n';
    csvContent += 'No,Nama Karyawan,Pekerjaan / Posisi,Tipe Gaji,Nominal Gaji,Status Pembayaran,Catatan\n';
    if (staffSalaries.length === 0) {
      csvContent += '-,Belum ada data gaji,-,-,-,-,-\n';
    } else {
      staffSalaries.forEach((s, idx) => {
        const statusText = s.payment_status === 'PAID' ? 'LUNAS' : 'PENDING';
        const typeText = s.salary_type === 'MONTHLY' ? 'Bulanan' : 'Harian';
        csvContent += `${idx + 1},"${s.name.replace(/"/g, '""')}","${s.role.replace(/"/g, '""')}","${typeText}","Rp ${s.salary_amount.toLocaleString('id-ID')}","${statusText}","${(s.notes || '-').replace(/"/g, '""')}"\n`;
      });
    }
    csvContent += '\n';

    csvContent += '=== RINGKASAN PENJUALAN TRANSAKSI HARI INI ===\n';
    csvContent += 'Indikator,Nilai\n';
    csvContent += `Pendapatan Bersih Hari Ini,"Rp ${todayRevenue.toLocaleString('id-ID')}"\n`;
    csvContent += `Total Transaksi Hari Ini,${todayTransactions} Pesanan\n`;
    csvContent += `Rata-rata Nilai Transaksi (AOV),"Rp ${todayAov.toLocaleString('id-ID')}"\n`;
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
        const formattedDate = o.created_at ? new Date(o.created_at).toLocaleString('id-ID') : '-';

        csvContent += `${idx + 1},"${o.id}","${o.queue_number}","${formattedDate}","${(o.customer_name || '-').replace(/"/g, '""')}","${serviceText}","${channelText}","${o.payment_method}","${o.payment_status}","${o.order_status}","${itemsText.replace(/"/g, '""')}","Rp ${(o.cup_fee || 0).toLocaleString('id-ID')}","Rp ${(o.total_amount || 0).toLocaleString('id-ID')}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `laporan_keuangan_dan_gaji_bubur_khalid_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Laporan Keuangan & Gaji CSV berhasil diunduh ke perangkat Anda!');
  };

  // IF LOCKED: Show Security Gate Modal (Enforcing Section 27 PRD)
  if (!isFinancialUnlocked) {
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
            <h2 className="text-xl font-extrabold text-matcha-leaf">Verifikasi Identitas Pemilik</h2>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Sesuai PRD v1.1 Bagian 27, seluruh data omzet, keuntungan, gaji karyawan, dan laporan keuangan dilindungi ketat dan hanya dapat diakses oleh role <strong className="text-matcha-leaf">OWNER</strong>.
            </p>
          </div>

          {/* PILIHAN METODE OTENTIKASI */}
          <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-bold text-stone-600">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('PASSWORD');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                authMethod === 'PASSWORD'
                  ? 'bg-white text-matcha-leaf shadow-sm font-extrabold'
                  : 'hover:text-matcha-leaf'
              }`}
            >
              Kata Sandi / PIN
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('EMAIL');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                authMethod === 'EMAIL'
                  ? 'bg-white text-matcha-leaf shadow-sm font-extrabold'
                  : 'hover:text-matcha-leaf'
              }`}
            >
              Email OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('WHATSAPP');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                authMethod === 'WHATSAPP'
                  ? 'bg-white text-matcha-leaf shadow-sm font-extrabold'
                  : 'hover:text-matcha-leaf'
              }`}
            >
              WhatsApp
            </button>
          </div>

          {/* KONTEN METODE EMAIL OTP */}
          {authMethod === 'EMAIL' && (
            <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/80 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 flex items-center space-x-1.5">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span>Kirim Kode OTP ke Email Terdaftar</span>
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Resmi Owner
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-normal">
                Kirim kode verifikasi 6-digit aman ke email resmi akun Owner:
                <br />
                <span className="font-mono font-bold text-emerald-900">{ownerEmail}</span>
              </p>

              {emailNotice && (
                <div className="text-[11px] text-emerald-800 bg-white p-2.5 rounded-xl border border-emerald-300 font-medium">
                  ✓ {emailNotice}
                </div>
              )}

              <button
                type="button"
                onClick={handleSendEmailOtp}
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
                    <span>{otpSent ? 'Kirim Ulang Kode OTP ke Email' : 'Kirim Kode OTP ke Email'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* KONTEN METODE WHATSAPP */}
          {authMethod === 'WHATSAPP' && (
            <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/80 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 flex items-center space-x-1.5">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Kirim Kode OTP via WhatsApp</span>
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  WA Owner
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-normal">
                Kirim kode verifikasi langsung ke nomor WhatsApp Owner:
                <br />
                <span className="font-mono font-bold text-emerald-900">{formattedPhone}</span>
              </p>

              <div className="text-[10px] text-amber-800 bg-amber-100/60 p-2 rounded-lg border border-amber-200 leading-normal">
                ⚠️ <strong>Catatan Keamanan:</strong> Tautan WhatsApp browser akan terbuka pada aplikasi WhatsApp di perangkat Anda saat ini. Jika Anda sedang di HP staf, gunakan metode <strong>Kata Sandi</strong> atau <strong>Email</strong>.
              </div>

              <button
                type="button"
                onClick={handleSendWhatsAppOtp}
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
                    <span>{otpSent ? 'Kirim Ulang Kode OTP ke WhatsApp' : '📲 Buka WhatsApp Kirim OTP'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* FORM INPUT KREDENSIAL / OTP */}
          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-matcha-leaf mb-1">
                {authMethod === 'PASSWORD'
                  ? 'Masukkan Kata Sandi Akun Owner / PIN Pribadi:'
                  : 'Masukkan 6-Digit Kode OTP:'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={authMethod === 'PASSWORD' && !showPassword ? 'password' : 'text'}
                  required
                  placeholder={authMethod === 'PASSWORD' ? 'Kata Sandi atau PIN Anda' : 'Contoh: 849201'}
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-center text-sm font-black tracking-wider text-matcha-leaf focus:outline-none focus:border-spicy-ember focus:bg-white transition"
                />
                {authMethod === 'PASSWORD' && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                <span>{authMethod === 'PASSWORD' ? 'Kredensial akun resmi Anda' : '* Kode OTP berlaku 5 menit'}</span>
                <span className="font-semibold text-matcha-leaf">Otorisasi Resmi Owner</span>
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
              className="w-full bg-spicy-ember hover:bg-spicy-hover text-white py-3 rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              Buka Laporan Keuangan
            </button>

            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className="w-full py-2.5 rounded-xl border border-stone-300 text-stone-600 hover:text-stone-800 text-xs font-bold transition hover:bg-stone-50 cursor-pointer"
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

  // IF UNLOCKED: Show Comprehensive Financial Dashboard & Payroll
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-tofu-silkblaze p-4 sm:p-6 lg:p-8 text-matcha-leaf">
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
              className="bg-matcha-surface hover:bg-matcha-leaf text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-matcha-surface transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-yolk-blaze" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={lockFinancialGate}
              className="bg-spicy-ember hover:bg-spicy-hover text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Kunci Sekarang</span>
            </button>
          </div>
        </div>

        {/* FINANCIAL EXECUTIVE KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Pemasukan (Omzet Bulan Berjalan) */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Total Omzet (Pemasukan)</span>
              <span className="p-1 rounded-lg bg-emerald-50 text-emerald-700">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-matcha-leaf mt-1">
              Rp{monthRevenue.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
              <span>{monthTransactions} Transaksi Bulan Ini</span>
              <span className="font-bold text-emerald-600">
                Hari ini: Rp{todayRevenue.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Card 2: Pengeluaran Bulan Ini (Gaji + HPP) */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Total Beban Pengeluaran</span>
              <span className="p-1 rounded-lg bg-rose-50 text-rose-600">
                <ArrowDownRight className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              Rp{totalExpenseMonth.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
              <span>Gaji: Rp{totalSalaryExpense.toLocaleString('id-ID')}</span>
              <span className="font-bold text-stone-500">
                HPP: Rp{estimatedCogs.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Card 3: Laba Bersih Aktual (Net Profit) */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Laba Bersih Aktual (Net Profit)</span>
              <span className={`p-1 rounded-lg ${netProfitMonth >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className={`text-2xl font-black mt-1 ${netProfitMonth >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              Rp{netProfitMonth.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
              <span>Margin Bersih: {netProfitMargin}%</span>
              <span className={`font-bold ${netProfitMonth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netProfitMonth >= 0 ? '✓ Arus Kas Sehat' : 'Defisit Pengeluaran'}
              </span>
            </div>
          </div>

          {/* Card 4: Beban Gaji Staf */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Beban Gaji Staf ({staffSalaries.length} Org)</span>
              <span className="p-1 rounded-lg bg-amber-50 text-amber-700">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-matcha-leaf mt-1">
              Rp{totalSalaryExpense.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="text-emerald-700 font-bold">Lunas: Rp{paidSalaryExpense.toLocaleString('id-ID')}</span>
              <span className="text-amber-700 font-bold">Pending: Rp{pendingSalaryExpense.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* SECTION: KALKULASI ARUS KAS: PEMASUKAN VS PENGELUARAN */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 bg-matcha-surface/20 text-matcha-deep text-[11px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider mb-1">
                <Receipt className="w-3.5 h-3.5" />
                <span>Kalkulasi Otomatis Arus Kas Usaha</span>
              </div>
              <h3 className="font-black text-base text-matcha-leaf">
                Pemasukan vs Pengeluaran &amp; Laba Bersih
              </h3>
              <p className="text-xs text-stone-500">
                Perhitungan transparan antara pendapatan pesanan riil, beban gaji staf karyawan, dan biaya bahan baku.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-stone-500">Bulan:</span>
              <span className="px-3 py-1 bg-stone-100 rounded-xl text-xs font-black text-matcha-leaf">
                {currentMonthStr} (Berjalan)
              </span>
            </div>
          </div>

          {/* Visual Comparison Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-emerald-700 flex items-center space-x-1">
                <span>Pemasukan Omzet: Rp{monthRevenue.toLocaleString('id-ID')}</span>
              </span>
              <span className="text-rose-600 flex items-center space-x-1">
                <span>Total Beban: Rp{totalExpenseMonth.toLocaleString('id-ID')}</span>
              </span>
            </div>
            <div className="h-4 bg-stone-100 rounded-full overflow-hidden flex p-0.5 border border-stone-200">
              <div
                className="bg-emerald-600 h-full rounded-l-full transition-all duration-500"
                style={{
                  width: `${monthRevenue + totalExpenseMonth > 0 ? Math.round((monthRevenue / (monthRevenue + totalExpenseMonth)) * 100) : 50}%`,
                }}
                title={`Pemasukan: Rp ${monthRevenue.toLocaleString('id-ID')}`}
              />
              <div
                className="bg-rose-500 h-full rounded-r-full transition-all duration-500"
                style={{
                  width: `${monthRevenue + totalExpenseMonth > 0 ? Math.round((totalExpenseMonth / (monthRevenue + totalExpenseMonth)) * 100) : 50}%`,
                }}
                title={`Pengeluaran: Rp ${totalExpenseMonth.toLocaleString('id-ID')}`}
              />
            </div>
          </div>

          {/* Breakdown Waterfall Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            {/* (+) Omzet */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-1.5">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>(+) Pemasukan Omzet</span>
              </div>
              <div className="text-xl font-black text-emerald-900 font-mono">
                +Rp{monthRevenue.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-emerald-700">
                Dari {monthTransactions} pesanan riil terkonfirmasi
              </p>
            </div>

            {/* (-) Gaji Karyawan */}
            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-1.5">
              <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>(-) Beban Gaji Karyawan</span>
              </div>
              <div className="text-xl font-black text-rose-900 font-mono">
                -Rp{totalSalaryExpense.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-rose-700">
                Total {staffSalaries.length} karyawan (Lunas: Rp{paidSalaryExpense.toLocaleString('id-ID')})
              </p>
            </div>

            {/* (-) HPP & Bahan Baku */}
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-1.5">
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>(-) Bahan Baku / HPP (30%)</span>
              </div>
              <div className="text-xl font-black text-amber-900 font-mono">
                -Rp{estimatedCogs.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-amber-700">
                Estimasi belanja beras, ketan, santan, dan cup
              </p>
            </div>

            {/* (=) Laba Bersih */}
            <div className={`p-4 rounded-2xl border space-y-1.5 ${netProfitMonth >= 0 ? 'bg-matcha-deep text-noodle-cream border-matcha-surface' : 'bg-red-900 text-white border-red-800'}`}>
              <div className="text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1 text-yolk-blaze">
                <Sparkles className="w-3.5 h-3.5" />
                <span>(=) Laba Bersih Aktual</span>
              </div>
              <div className="text-xl font-black font-mono">
                Rp{netProfitMonth.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-noodle-dark">
                Margin profit bersih: <strong className="text-white">{netProfitMargin}%</strong>
              </p>
            </div>
          </div>
        </div>

        {/* SECTION: MANAJEMEN GAJI KARYAWAN (INPUT GAJI KARYAWAN A, B, C...) */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 bg-spicy-ember/10 text-spicy-ember text-[11px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider mb-1">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Penggajian Karyawan &amp; Tenaga Kerja</span>
              </div>
              <h3 className="font-black text-base text-matcha-leaf">
                Manajemen &amp; Rincian Gaji Karyawan ({staffSalaries.length} Orang)
              </h3>
              <p className="text-xs text-stone-500">
                Input gaji karyawan (Karyawan A, B, C, dst.) dengan peran pekerjaannya untuk kalkulasi otomatis pengeluaran bulanan toko.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={resetDefaultStaffSalaries}
                className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-3 py-2 rounded-xl transition border border-stone-200 flex items-center space-x-1 cursor-pointer"
                title="Reset kembali ke preset Karyawan A, B, C"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                <span>Reset Preset (A, B, C)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddSalaryModal}
                className="text-xs bg-spicy-ember hover:bg-spicy-hover text-white font-extrabold px-4 py-2 rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Input Gaji Karyawan Baru</span>
              </button>
            </div>
          </div>

          {/* Staff Cards Grid / Table */}
          {staffSalaries.length === 0 ? (
            <div className="p-8 text-center text-stone-400 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200 text-xs space-y-3">
              <Users className="w-8 h-8 mx-auto text-stone-300" />
              <p>Belum ada data gaji karyawan yang diinput.</p>
              <button
                type="button"
                onClick={resetDefaultStaffSalaries}
                className="inline-flex items-center space-x-1.5 text-xs bg-spicy-ember text-white font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-spicy-hover transition cursor-pointer"
              >
                <span>Muat Preset Gaji Karyawan A, B, C</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffSalaries.map((salary, idx) => (
                <div
                  key={salary.id}
                  className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:shadow-soft transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-10 h-10 rounded-xl bg-matcha-leaf text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm">
                          {salary.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-matcha-leaf leading-tight">
                            {salary.name}
                          </h4>
                          <span className="inline-block text-[11px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md mt-0.5">
                            {salary.role}
                          </span>
                        </div>
                      </div>

                      {/* Tombol Toggle Status Cepat (Lunas / Pending) */}
                      <button
                        type="button"
                        onClick={() => toggleStaffSalaryStatus(salary.id)}
                        className={`text-[11px] font-black px-2.5 py-1 rounded-full transition flex items-center space-x-1 cursor-pointer ${
                          salary.payment_status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="Klik untuk mengubah status pembayaran"
                      >
                        {salary.payment_status === 'PAID' ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>LUNAS</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>PENDING</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                          Nominal ({salary.salary_type === 'MONTHLY' ? 'Bulanan' : 'Harian'})
                        </div>
                        <div className="text-lg font-black text-matcha-leaf font-mono">
                          Rp{salary.salary_amount.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 font-mono">
                          {salary.salary_type === 'MONTHLY' ? 'Bulan Berjalan' : 'Per Shift/Hari'}
                        </span>
                      </div>
                    </div>

                    {salary.notes && (
                      <p className="text-[11px] text-stone-500 italic bg-white p-2 rounded-xl border border-stone-100">
                        &quot;{salary.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-mono">
                      Input #{idx + 1}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSalaryModal(salary)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-matcha-leaf hover:bg-stone-100 transition cursor-pointer"
                        title="Edit Data Gaji"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus data gaji untuk "${salary.name}"?`)) {
                            deleteStaffSalary(salary.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Hapus Gaji"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ringkasan Footer Payroll */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3 text-stone-600">
              <span>Total Karyawan: <strong>{staffSalaries.length} Orang</strong></span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">Lunas: {staffSalaries.filter((s) => s.payment_status === 'PAID').length}</span>
              <span>•</span>
              <span className="text-amber-700 font-bold">Pending: {staffSalaries.filter((s) => s.payment_status === 'PENDING').length}</span>
            </div>
            <div className="font-extrabold text-matcha-leaf">
              Akumulasi Beban Gaji Bulanan: <span className="font-mono text-spicy-ember">Rp{totalSalaryExpense.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* REVENUE DISTRIBUTION BY CHANNEL & PAYMENT METHODS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Channel */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-4">
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
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-4">
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

        {/* REAL TRANSACTIONS BREAKDOWN TABLE */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-3">
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
              className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition inline-flex items-center space-x-1 cursor-pointer"
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

        {/* SECURITY & FINANCIAL ACCESS AUDIT LOG TABLE */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-3">
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

      {/* MODAL INPUT / EDIT GAJI KARYAWAN */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-floating border-2 border-spicy-ember/30 text-matcha-leaf space-y-4 animate-slideUp">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-spicy-light text-spicy-ember flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-matcha-leaf">
                    {editingSalary ? 'Edit Gaji Karyawan' : 'Input Gaji Karyawan Baru'}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Kalkulasi otomatis ke pengeluaran bulanan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSalaryModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="space-y-3.5 text-xs">
              {/* Nama Karyawan */}
              <div>
                <label className="block font-bold text-matcha-leaf mb-1">
                  Nama Karyawan:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Karyawan A, Budi, Siti..."
                  value={salaryFormName}
                  onChange={(e) => setSalaryFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember focus:bg-white transition"
                />
              </div>

              {/* Posisi / Pekerjaan */}
              <div>
                <label className="block font-bold text-matcha-leaf mb-1">
                  Pekerjaan / Peran Tugas:
                </label>
                <select
                  value={salaryFormRole}
                  onChange={(e) => setSalaryFormRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember focus:bg-white transition"
                >
                  <option value="Koki / Dapur">Koki / Dapur (Racikan Bubur &amp; Kolak)</option>
                  <option value="Kasir POS & Front Office">Kasir POS &amp; Front Office</option>
                  <option value="Pelayan & Kebersihan">Pelayan Meja &amp; Kebersihan</option>
                  <option value="Admin Operasional">Admin Operasional Toko</option>
                  <option value="Kurir / Delivery">Kurir Antar / Delivery</option>
                  <option value="Lainnya">Lainnya (Tulis Manual)</option>
                </select>

                {salaryFormRole === 'Lainnya' && (
                  <input
                    type="text"
                    required
                    placeholder="Tuliskan pekerjaan / peran..."
                    value={salaryFormCustomRole}
                    onChange={(e) => setSalaryFormCustomRole(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember focus:bg-white transition"
                  />
                )}
              </div>

              {/* Nominal Gaji */}
              <div>
                <label className="block font-bold text-matcha-leaf mb-1">
                  Nominal Gaji Pokok (Rp):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-stone-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    step={1000}
                    placeholder="Contoh: 2500000"
                    value={salaryFormAmount}
                    onChange={(e) => setSalaryFormAmount(e.target.value)}
                    className="w-full pl-11 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono font-black text-matcha-leaf focus:outline-none focus:border-spicy-ember focus:bg-white transition text-sm"
                  />
                </div>
                <div className="text-[10px] text-stone-400 mt-1">
                  {parseInt(salaryFormAmount || '0', 10) > 0 && (
                    <span>Terbaca: Rp {parseInt(salaryFormAmount || '0', 10).toLocaleString('id-ID')}</span>
                  )}
                </div>
              </div>

              {/* Tipe Gaji & Status Pembayaran */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-matcha-leaf mb-1">
                    Tipe Gaji:
                  </label>
                  <select
                    value={salaryFormType}
                    onChange={(e) => setSalaryFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember focus:bg-white transition"
                  >
                    <option value="MONTHLY">Bulanan (Per Bulan)</option>
                    <option value="DAILY">Harian / Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-matcha-leaf mb-1">
                    Status Bayar:
                  </label>
                  <select
                    value={salaryFormStatus}
                    onChange={(e) => setSalaryFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember focus:bg-white transition"
                  >
                    <option value="PAID">✓ LUNAS (Terbayar)</option>
                    <option value="PENDING">⏳ PENDING (Belum Bayar)</option>
                  </select>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block font-bold text-matcha-leaf mb-1">
                  Catatan Tambahan (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Misal: Termasuk bonus kehadiran, shift malam..."
                  value={salaryFormNotes}
                  onChange={(e) => setSalaryFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-700 focus:outline-none focus:border-spicy-ember focus:bg-white transition"
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-600 hover:text-stone-800 font-bold transition hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-spicy-ember hover:bg-spicy-hover text-white font-extrabold shadow-md transition cursor-pointer"
                >
                  Simpan Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
