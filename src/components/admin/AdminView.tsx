'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { useApp } from '@/lib/store/AppContext';
import { Product, SystemUser, UserRole, TableInfo, PromoBanner } from '@/lib/types';
import { parseImageUrl, isGoogleDriveLink } from '@/lib/utils/image';
import { getJakartaDateStr, getJakartaMonthStr, formatJakartaFullDate } from '@/lib/date-utils';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Tags,
  QrCode,
  FileText,
  Users,
  Trash2,
  Settings,
  Bell,
  Search,
  Plus,
  Edit2,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Upload,
  Image as ImageIcon,
  X,
  Shield,
  KeyRound,
  UserPlus,
  Store,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  BarChart3,
  LineChart,
  Sparkles,
  Printer,
  Download,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Pin,
  Menu,
  Calculator,
  ChefHat,
  LogOut,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';

export function AdminView() {
  const {
    orders,
    products,
    trashProducts,
    toggleProductAvailability,
    updateProductPrice,
    updateProduct,
    addProduct,
    softDeleteProduct,
    restoreProduct,
    hardDeleteProduct,
    emptyProductTrash,
    tables,
    addTable,
    updateTable,
    deleteTable,
    toggleTableStatus,
    financialSummary,
    setActiveView,
    storeSettings,
    updateStoreSettings,
    users,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    promoBanners,
    addPromoBanner,
    updatePromoBanner,
    deletePromoBanner,
    togglePromoBannerStatus,
    showToast,
    syncFromCloud,
    clearAllOrders,
    currentUser,
    logout,
    updateOrderStatus,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'tables' | 'trash' | 'settings'>('dashboard');
  const [activeQueueTab, setActiveQueueTab] = useState<'ONLINE' | 'IN_STORE'>('ONLINE');
  const [settingsSubTab, setSettingsSubTab] = useState<'security' | 'promo' | 'banner' | 'payment'>('security');

  // Proteksi: Tab Metode Pembayaran hanya boleh diakses oleh akun dengan role OWNER
  useEffect(() => {
    if (settingsSubTab === 'payment' && currentUser?.role !== 'OWNER') {
      setSettingsSubTab('security');
    }
  }, [currentUser?.role, settingsSubTab]);
  const [revenueChartMode, setRevenueChartMode] = useState<'combo' | 'bar' | 'curve'>('combo');
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);
  const [hoveredFinanceIdx, setHoveredFinanceIdx] = useState<number | null>(null);
  const [financeRangeFilter, setFinanceRangeFilter] = useState<'7D' | '30D' | 'THIS_MONTH'>('7D');
  const [activeDonutSegment, setActiveDonutSegment] = useState<'profit' | 'cogs' | 'opex' | null>(null);
  const [donutViewMode, setDonutViewMode] = useState<'cost' | 'channel'>('cost');
  const [activeChannelSegment, setActiveChannelSegment] = useState<'online' | 'cashier' | null>(null);

  // Dynamic Cashflow dataset calculated from real orders in Asia/Jakarta timezone
  const currentCashflowDataset = useMemo(() => {
    const daysCount = financeRangeFilter === '7D' ? 7 : financeRangeFilter === '30D' ? 30 : 30;
    const now = new Date();
    const todayJakarta = getJakartaDateStr(now);
    const [nowY, nowM, nowD] = todayJakarta.split('-').map(Number);

    const days: { dateStr: string; label: string; dayName: string; fullDay: string }[] = [];
    const dayNamesIndo = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const fullDayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNamesIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(nowY, nowM - 1, nowD - i, 12, 0, 0));
      const dateStr = getJakartaDateStr(d);
      const isToday = dateStr === todayJakarta;
      const dayIdx = d.getUTCDay();
      const mIdx = d.getUTCMonth();
      const dateNum = d.getUTCDate();
      const label = isToday && financeRangeFilter === '7D' ? 'Hari Ini' : `${dateNum} ${monthNamesIndo[mIdx]}`;
      const dayName = isToday && financeRangeFilter === '7D' ? 'Hari Ini' : dayNamesIndo[dayIdx];
      const fullDay = `${fullDayNamesIndo[dayIdx]}, ${dateNum} ${monthNamesIndo[mIdx]} ${d.getUTCFullYear()}${isToday ? ' (Hari Ini)' : ''}`;
      days.push({ dateStr, label, dayName, fullDay });
    }

    let peakDayName = '-';
    let peakDayVal = 'Rp 0';
    let peakDayTx = 0;
    let maxDayRevenue = 0;

    const dailyData = days.map((day) => {
      let uangMasuk = 0;
      let txCount = 0;
      orders.forEach((ord) => {
        if (ord.order_status === 'CANCELLED') return;
        const ordDate = getJakartaDateStr(ord.created_at);
        if (ordDate === day.dateStr) {
          uangMasuk += ord.total_amount || 0;
          txCount += 1;
        }
      });

      if (uangMasuk > maxDayRevenue) {
        maxDayRevenue = uangMasuk;
        peakDayName = day.dayName;
        peakDayVal = `Rp ${uangMasuk.toLocaleString('id-ID')}`;
        peakDayTx = txCount;
      }

      const uangKeluar = uangMasuk > 0 ? Math.round(uangMasuk * 0.32) : 0;
      const laba = uangMasuk - uangKeluar;
      const marginPct = uangMasuk > 0 ? `${((laba / uangMasuk) * 100).toFixed(1)}%` : '0%';

      return {
        dateStr: day.dateStr,
        day: day.dayName,
        date: day.label,
        fullDay: day.fullDay,
        uangMasuk,
        uangMasukStr: `Rp ${uangMasuk.toLocaleString('id-ID')}`,
        uangKeluar,
        uangKeluarStr: `Rp ${uangKeluar.toLocaleString('id-ID')}`,
        laba,
        labaStr: `Rp ${laba.toLocaleString('id-ID')}`,
        marginPct,
        txCount,
      };
    });

    const totalMasukNum = dailyData.reduce((acc, d) => acc + d.uangMasuk, 0);
    const totalKeluarNum = dailyData.reduce((acc, d) => acc + d.uangKeluar, 0);
    const netLabaNum = totalMasukNum - totalKeluarNum;
    const marginNet = totalMasukNum > 0 ? `${((netLabaNum / totalMasukNum) * 100).toFixed(1)}%` : '0%';

    const maxVal = Math.max(...dailyData.map((d) => d.uangMasuk), 100000);
    const xStart = 40;
    const xEnd = 560;
    const yBaseline = 180;
    const yTop = 30;

    const points = dailyData.map((d, idx) => {
      const x = Math.round(xStart + (idx / Math.max(dailyData.length - 1, 1)) * (xEnd - xStart));
      const masukRatio = totalMasukNum > 0 ? d.uangMasuk / maxVal : 0;
      const keluarRatio = totalMasukNum > 0 ? d.uangKeluar / maxVal : 0;
      const masukY = totalMasukNum > 0 ? Math.round(yBaseline - masukRatio * (yBaseline - yTop)) : yBaseline;
      const keluarY = totalMasukNum > 0 ? Math.round(yBaseline - keluarRatio * (yBaseline - yTop)) : yBaseline;
      const isPeak = totalMasukNum > 0 && d.uangMasuk === maxVal;
      const isActive = idx === dailyData.length - 1;
      return {
        ...d,
        x,
        masukY,
        keluarY,
        isPeak,
        isActive,
      };
    });

    const yLabels = totalMasukNum > 0 ? [
      `Rp ${(maxVal >= 1000000 ? (maxVal / 1000000).toFixed(1) + 'jt' : (maxVal / 1000).toFixed(0) + 'rb')}`,
      `Rp ${((maxVal * 0.75) >= 1000000 ? ((maxVal * 0.75) / 1000000).toFixed(1) + 'jt' : ((maxVal * 0.75) / 1000).toFixed(0) + 'rb')}`,
      `Rp ${((maxVal * 0.5) >= 1000000 ? ((maxVal * 0.5) / 1000000).toFixed(1) + 'jt' : ((maxVal * 0.5) / 1000).toFixed(0) + 'rb')}`,
      `Rp ${((maxVal * 0.25) >= 1000000 ? ((maxVal * 0.25) / 1000000).toFixed(1) + 'jt' : ((maxVal * 0.25) / 1000).toFixed(0) + 'rb')}`,
      'Rp 0',
    ] : ['Rp 2.0jt', 'Rp 1.5jt', 'Rp 1.0jt', 'Rp 500rb', 'Rp 0'];

    return {
      title: financeRangeFilter === '30D' ? 'Pergerakan 30 Hari Terakhir' : financeRangeFilter === 'THIS_MONTH' ? 'Akumulasi Pemasukan Bulan Ini' : 'Arus Keuangan: Uang Masuk & Uang Keluar',
      sub: financeRangeFilter === '30D' ? 'Tren omzet vs belanja operasional 30 hari kalender' : financeRangeFilter === 'THIS_MONTH' ? 'Pertumbuhan kumulatif omzet vs pengeluaran bulan berjalan' : 'Visualisasi perbandingan pendapatan omzet harian vs pengeluaran operasional & bahan baku',
      totalMasuk: `Rp ${totalMasukNum.toLocaleString('id-ID')}`,
      totalKeluar: `Rp ${totalKeluarNum.toLocaleString('id-ID')}`,
      netLaba: `Rp ${netLabaNum.toLocaleString('id-ID')}`,
      marginNet,
      yLabels,
      points,
      totalMasukNum,
      totalKeluarNum,
      netLabaNum,
      peakDayName,
      peakDayVal,
      peakDayTx,
    };
  }, [financeRangeFilter, orders]);

  // Derived financial & channel calculations for donut & KPIs
  const onlineOrders = orders.filter((o) => o.queue_channel === 'ONLINE');
  const inStoreOrders = orders.filter((o) => o.queue_channel === 'IN_STORE');
  const cancelledOrders = orders.filter((o) => o.order_status === 'CANCELLED');
  const totalOrdersCount = orders.length;
  const channelOnlinePct = totalOrdersCount > 0 ? Math.round((onlineOrders.length / totalOrdersCount) * 100) : 0;
  const channelCashierPct = totalOrdersCount > 0 ? (100 - channelOnlinePct) : 0;

  const currentTotalMasuk = currentCashflowDataset.totalMasukNum || 0;
  const currentTotalKeluar = currentCashflowDataset.totalKeluarNum || 0;
  const currentNetLaba = currentCashflowDataset.netLabaNum || 0;

  const costProfitPct = currentTotalMasuk > 0 ? Math.round((currentNetLaba / currentTotalMasuk) * 100) : 0;
  const costBahanPct = currentTotalMasuk > 0 ? Math.round(((currentTotalKeluar * 0.75) / currentTotalMasuk) * 100) : 0;
  const costOpexPct = currentTotalMasuk > 0 ? Math.max(0, 100 - costProfitPct - costBahanPct) : 0;

  const costBahanVal = Math.round(currentTotalKeluar * 0.75);
  const costOpexVal = currentTotalKeluar - costBahanVal;

  // Real portion calculation dynamically matching selected timeframe (7D / 30D / Bulan Ini)
  const currentPeriodPortionsSold = useMemo(() => {
    const validDates = new Set(currentCashflowDataset.points.map((p) => p.dateStr));
    return orders.reduce((sum, ord) => {
      if (ord.order_status === 'CANCELLED') return sum;
      const ordDate = getJakartaDateStr(ord.created_at);
      if (validDates.has(ordDate)) {
        return sum + (ord.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 0);
      }
      return sum;
    }, 0);
  }, [orders, currentCashflowDataset.points]);

  // Store & Banner Settings State
  const [storeForm, setStoreForm] = useState(storeSettings);
  const [isSavingStore, setIsSavingStore] = useState<boolean>(false);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  // Sync storeForm if storeSettings is hydrated from localStorage
  useEffect(() => {
    if (storeSettings) {
      setStoreForm(storeSettings);
    }
  }, [storeSettings]);

  // User & Security Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userUsername, setUserUsername] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>('ADMIN');
  const [userPin, setUserPin] = useState<string>('123456');
  const [userPassword, setUserPassword] = useState<string>('');
  const [showUserPassword, setShowUserPassword] = useState<boolean>(false);
  const [userActive, setUserActive] = useState<boolean>(true);

  // Tong Sampah States
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [permanentDeletingProduct, setPermanentDeletingProduct] = useState<Product | null>(null);
  const [isConfirmEmptyTrashOpen, setIsConfirmEmptyTrashOpen] = useState<boolean>(false);

  // Store Operating Hours & Holiday Modal State (Auto-Save on edit/close)
  const [isStoreHoursModalOpen, setIsStoreHoursModalOpen] = useState<boolean>(false);

  // Table Management States (Tambah, Edit, Hapus, Preview QR, Cancel, Close)
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [editingTable, setEditingTable] = useState<TableInfo | null>(null);
  const [tableNumberInput, setTableNumberInput] = useState<string>('');
  const [tableQrTokenInput, setTableQrTokenInput] = useState<string>('');
  const [tableActiveInput, setTableActiveInput] = useState<boolean>(true);
  const [deletingTable, setDeletingTable] = useState<TableInfo | null>(null);
  const [viewingQrTable, setViewingQrTable] = useState<TableInfo | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (viewingQrTable) {
      const customerUrl = `https://bubur-khalid.vercel.app/?table=${encodeURIComponent(viewingQrTable.table_number)}`;
      QRCode.toDataURL(customerUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#023820',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    } else {
      setQrDataUrl('');
    }
  }, [viewingQrTable]);

  const handlePrintSticker = () => {
    if (!qrDataUrl || !viewingQrTable) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    const customerUrl = `https://bubur-khalid.vercel.app/?table=${encodeURIComponent(viewingQrTable.table_number)}`;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stiker QR ${viewingQrTable.table_number} - Bubur Khalid</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #FFF4E6;
            }
            .sticker {
              border: 3px solid #023820;
              border-radius: 24px;
              padding: 28px 24px;
              text-align: center;
              background: white;
              width: 280px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.12);
            }
            .brand {
              font-size: 16px;
              font-weight: 900;
              color: #023820;
              margin-bottom: 4px;
              letter-spacing: 1px;
            }
            .tagline {
              font-size: 10px;
              color: #666;
              margin-bottom: 12px;
            }
            .qr-img {
              width: 220px;
              height: 220px;
              margin: 0 auto;
              display: block;
              border-radius: 12px;
            }
            .table-title {
              font-size: 20px;
              font-weight: 900;
              color: #EE3F24;
              margin-top: 12px;
            }
            .instruction {
              font-size: 12px;
              font-weight: bold;
              color: #023820;
              margin-top: 4px;
            }
            .url {
              font-size: 10px;
              color: #888;
              margin-top: 6px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="brand">🥣 BUBUR KHALID</div>
            <div class="tagline">Asli Minang • Hangat & Gurih</div>
            <img class="qr-img" src="${qrDataUrl}" alt="QR Code" />
            <div class="table-title">${viewingQrTable.table_number}</div>
            <div class="instruction">Pindai untuk Pesan Menu</div>
            <div class="url">${customerUrl}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl || !viewingQrTable) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-Code-${viewingQrTable.table_number.replace(/\s+/g, '-')}-Bubur-Khalid.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`QR Code untuk ${viewingQrTable.table_number} berhasil diunduh!`);
  };

  // Promo Banners Management State (CRUD: Tambah, Edit, Hapus, Toggle, Preview)
  const [isPromoModalOpen, setIsPromoModalOpen] = useState<boolean>(false);
  const [editingPromo, setEditingPromo] = useState<PromoBanner | null>(null);
  const [promoTitleInput, setPromoTitleInput] = useState<string>('');
  const [promoSubtitleInput, setPromoSubtitleInput] = useState<string>('');
  const [promoBadgeInput, setPromoBadgeInput] = useState<string>('🔥 PROMO SPESIAL');
  const [promoDiscountLabelInput, setPromoDiscountLabelInput] = useState<string>('Hemat Rp3.000');
  const [promoImageInput, setPromoImageInput] = useState<string>('/images/menu/bubur-kampiun.png');
  const [promoActiveInput, setPromoActiveInput] = useState<boolean>(true);
  const [deletingPromo, setDeletingPromo] = useState<PromoBanner | null>(null);

  const handleOpenAddPromo = () => {
    setEditingPromo(null);
    setPromoTitleInput('');
    setPromoSubtitleInput('');
    setPromoBadgeInput('🔥 PROMO SPESIAL');
    setPromoDiscountLabelInput('Hemat Rp3.000');
    setPromoImageInput('/images/menu/bubur-kampiun.png');
    setPromoActiveInput(true);
    setIsPromoModalOpen(true);
  };

  const handleOpenEditPromo = (banner: PromoBanner) => {
    setEditingPromo(banner);
    setPromoTitleInput(banner.title);
    setPromoSubtitleInput(banner.subtitle);
    setPromoBadgeInput(banner.badge || '');
    setPromoDiscountLabelInput(banner.discount_label || '');
    setPromoImageInput(banner.image);
    setPromoActiveInput(banner.is_active);
    setIsPromoModalOpen(true);
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitleInput.trim() || !promoSubtitleInput.trim()) {
      showToast('Judul dan rincian promo wajib diisi');
      return;
    }
    if (editingPromo) {
      updatePromoBanner(editingPromo.id, {
        title: promoTitleInput.trim(),
        subtitle: promoSubtitleInput.trim(),
        badge: promoBadgeInput.trim() || undefined,
        discount_label: promoDiscountLabelInput.trim() || undefined,
        image: promoImageInput.trim() || '/images/menu/bubur-kampiun.png',
        is_active: promoActiveInput,
      });
    } else {
      addPromoBanner({
        title: promoTitleInput.trim(),
        subtitle: promoSubtitleInput.trim(),
        badge: promoBadgeInput.trim() || undefined,
        discount_label: promoDiscountLabelInput.trim() || undefined,
        image: promoImageInput.trim() || '/images/menu/bubur-kampiun.png',
        is_active: promoActiveInput,
        sort_order: (promoBanners?.length || 0) + 1,
      });
    }
    setIsPromoModalOpen(false);
  };

  // Packaging / Kemasan Cup Management State (Edit, Hapus, Cancel, Save)
  const [cupEditMode, setCupEditMode] = useState<boolean>(false);
  const [cupForm, setCupForm] = useState({
    name: storeSettings.cupName || 'Kemasan Cup Bawa Pulang',
    fee: storeSettings.cupFee ?? 1000,
    description: storeSettings.cupDescription || 'higienis & anti tumpah',
    enabled: storeSettings.cupEnabled !== false,
  });

  const handleStartEditCup = () => {
    setCupForm({
      name: storeSettings.cupName || 'Kemasan Cup Bawa Pulang',
      fee: storeSettings.cupFee ?? 1000,
      description: storeSettings.cupDescription || 'higienis & anti tumpah',
      enabled: storeSettings.cupEnabled !== false,
    });
    setCupEditMode(true);
  };

  const handleCancelEditCup = () => {
    setCupForm({
      name: storeSettings.cupName || 'Kemasan Cup Bawa Pulang',
      fee: storeSettings.cupFee ?? 1000,
      description: storeSettings.cupDescription || 'higienis & anti tumpah',
      enabled: storeSettings.cupEnabled !== false,
    });
    setCupEditMode(false);
  };

  const handleSaveCup = () => {
    const newName = cupForm.name.trim() || 'Kemasan Cup Bawa Pulang';
    const newFee = Number(cupForm.fee) || 0;
    const newDesc = cupForm.description.trim() || 'higienis & anti tumpah';
    const newEnabled = cupForm.enabled;

    updateStoreSettings({
      cupName: newName,
      cupFee: newFee,
      cupDescription: newDesc,
      cupEnabled: newEnabled,
    });
    setStoreForm((prev) => ({
      ...prev,
      cupName: newName,
      cupFee: newFee,
      cupDescription: newDesc,
      cupEnabled: newEnabled,
    }));
    setCupEditMode(false);
    showToast('Pengaturan Kemasan Cup berhasil disimpan!');
  };

  const handleDeleteCup = () => {
    if (confirm('Yakin ingin menghapus / menonaktifkan opsi Kemasan Cup Bawa Pulang? Opsi ini tidak akan tampil pada menu pelanggan.')) {
      updateStoreSettings({ cupEnabled: false });
      setStoreForm((prev) => ({ ...prev, cupEnabled: false }));
      setCupForm((prev) => ({ ...prev, enabled: false }));
      showToast('Kemasan Cup berhasil dinonaktifkan dari menu pelanggan.');
    }
  };

  const handleRestoreCup = () => {
    updateStoreSettings({ cupEnabled: true });
    setStoreForm((prev) => ({ ...prev, cupEnabled: true }));
    setCupForm((prev) => ({ ...prev, enabled: true }));
    showToast('Kemasan Cup berhasil diaktifkan kembali!');
  };

  const handleOpenAddTable = () => {
    setEditingTable(null);
    const nextNum = (tables.length + 1).toString().padStart(2, '0');
    setTableNumberInput(`Meja ${nextNum}`);
    setTableQrTokenInput(`BK-TBL-${nextNum}-SEC`);
    setTableActiveInput(true);
    setIsTableModalOpen(true);
  };

  const handleOpenEditTable = (table: TableInfo) => {
    setEditingTable(table);
    setTableNumberInput(table.table_number);
    setTableQrTokenInput(table.qr_token);
    setTableActiveInput(table.is_active);
    setIsTableModalOpen(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumberInput.trim()) return;

    if (editingTable) {
      updateTable(editingTable.id, {
        table_number: tableNumberInput.trim(),
        qr_token: tableQrTokenInput.trim() || `BK-${Date.now().toString().slice(-6)}`,
        is_active: tableActiveInput,
      });
    } else {
      addTable({
        table_number: tableNumberInput.trim(),
        qr_token: tableQrTokenInput.trim() || `BK-TBL-${(tables.length + 1).toString().padStart(2, '0')}-SEC`,
        is_active: tableActiveInput,
      });
    }
    setIsTableModalOpen(false);
  };

  const handleConfirmDeleteTable = () => {
    if (deletingTable) {
      deleteTable(deletingTable.id);
      setDeletingTable(null);
    }
  };

  const handleOpenAddUser = (initialRole: UserRole = 'ADMIN') => {
    setEditingUser(null);
    setUserName('');
    setUserUsername('');
    setUserEmail('');
    setUserPhone('');
    setUserRole(initialRole);
    setUserPin('123456');
    setUserPassword('');
    setShowUserPassword(false);
    setUserActive(true);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserUsername(user.username);
    setUserEmail(user.email || '');
    setUserPhone(user.phone || '');
    setUserRole(user.role);
    setUserPin(user.pin || '123456');
    setUserPassword(user.password || '');
    setShowUserPassword(false);
    setUserActive(user.is_active);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userUsername.trim()) return;

    if (editingUser) {
      updateUser(editingUser.id, {
        name: userName.trim(),
        username: userUsername.trim().toLowerCase(),
        email: userEmail.trim(),
        phone: userPhone.trim(),
        role: userRole,
        pin: userPin.trim(),
        ...(userPassword.trim() ? { password: userPassword.trim() } : {}),
        is_active: userActive,
      });
    } else {
      addUser({
        name: userName.trim(),
        username: userUsername.trim().toLowerCase(),
        email: userEmail.trim(),
        phone: userPhone.trim(),
        role: userRole,
        pin: userPin.trim(),
        password: userPassword.trim() || '123456',
        is_active: userActive,
        last_login: 'Belum pernah login',
      });
    }
    setIsUserModalOpen(false);
  };

  // Full Edit & Add Menu State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddMode, setIsAddMode] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCategory, setFormCategory] = useState<'Bubur' | 'Kolak' | 'Lopis' | 'Kerupuk' | 'Paket'>('Bubur');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formImage, setFormImage] = useState<string>('');
  const [formAvailable, setFormAvailable] = useState<boolean>(true);

  // Pop-Slide Collapsible Sidebar State (Default: only icons visible; slides open on touch/hover)
  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(false);
  const isSidebarOpen = isSidebarHovered || isSidebarPinned;

  // Live dynamic today date formatted in Asia/Jakarta (id-ID)
  const liveTodayIndo = useMemo(() => {
    return formatJakartaFullDate(new Date());
  }, []);

  // Dynamic top-selling items calculated from real orders in Asia/Jakarta timezone
  const [topSellingFilter, setTopSellingFilter] = useState<'today' | 'all'>('today');

  const topSellingItems = useMemo(() => {
    const itemMap: { [productName: string]: { name: string; sales: number; price: number; image: string } } = {};
    const todayStr = getJakartaDateStr(new Date());

    orders.forEach((ord) => {
      if (ord.order_status === 'CANCELLED') return;
      if (topSellingFilter === 'today') {
        const ordDate = getJakartaDateStr(ord.created_at);
        if (ordDate !== todayStr) return;
      }
      ord.items?.forEach((item) => {
        const name = item.product_name_snapshot;
        if (!itemMap[name]) {
          const prod = products.find((p) => p.name === name || p.id === item.product_id);
          itemMap[name] = {
            name,
            sales: 0,
            price: item.unit_price_snapshot || (prod?.price || 0),
            image: prod?.image || '/images/menu/bubur-kampiun.png',
          };
        }
        itemMap[name].sales += item.quantity || 1;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [orders, products, topSellingFilter]);

  const presetImages = [
    { label: 'Bubur Kampiun', path: '/images/menu/bubur-kampiun.png' },
    { label: 'Kolak Katan', path: '/images/menu/kolak-katan.png' },
    { label: 'Kacang Padi Katan', path: '/images/menu/kacang-padi-katan.png' },
    { label: 'Kolak', path: '/images/menu/kolak.png' },
    { label: 'Kacang Padi', path: '/images/menu/kacang-padi.png' },
    { label: 'Bubur Pulut Hitam', path: '/images/menu/bubur-pulut-hitam.png' },
    { label: 'Bubur Putih (Sumsum)', path: '/images/menu/bubur-putih-sumsum.png' },
    { label: 'Lopis', path: '/images/menu/lopis.png' },
    { label: 'Cendil', path: '/images/menu/cendil.png' },
    { label: 'Kerupuk Besar', path: '/images/menu/kerupuk-besar.png' },
    { label: 'Kerupuk Kecil', path: '/images/menu/kerupuk-kecil.png' },
    { label: 'Campur 3 Macam', path: '/images/menu/campur-3-macam.png' },
  ];

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setIsAddMode(false);
    setFormName(p.name);
    setFormPrice(p.price);
    setFormCategory(p.category);
    setFormDescription(p.description);
    setFormImage(p.image);
    setFormAvailable(p.is_available);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsAddMode(true);
    setFormName('');
    setFormPrice(8000);
    setFormCategory('Bubur');
    setFormDescription('');
    setFormImage('/images/menu/bubur-kampiun.png');
    setFormAvailable(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formPrice <= 0) {
      alert('Nama menu dan harga harus diisi dengan benar!');
      return;
    }

    if (isAddMode) {
      addProduct({
        name: formName,
        price: formPrice,
        category: formCategory,
        description: formDescription,
        image: formImage || '/images/menu/bubur-kampiun.png',
        is_available: formAvailable,
        sort_order: products.length + 1,
      });
      setIsAddMode(false);
    } else if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formName,
        price: formPrice,
        category: formCategory,
        description: formDescription,
        image: formImage,
        is_available: formAvailable,
      });
      setEditingProduct(null);
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreForm((prev) => ({ ...prev, bannerImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreForm((prev) => ({ ...prev, storeLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStoreForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingStore(true);
    updateStoreSettings(storeForm);
    setTimeout(() => {
      setIsSavingStore(false);
    }, 350);
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-tofu-silkblaze flex flex-col md:flex-row text-matcha-leaf">
      
      {/* MOBILE TOP BAR (With 🍔 Hamburger Menu Button) */}
      <div className="flex md:hidden items-center justify-between bg-matcha-leaf text-tofu-silkblaze px-4 py-3 sticky top-0 z-40 border-b border-matcha-surface shadow-md">
        <div className="flex items-center space-x-3">
          {/* 🍔 Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-10 h-10 rounded-xl bg-matcha-surface hover:bg-spicy-ember text-tofu-silkblaze flex items-center justify-center transition active:scale-95 shadow-sm"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5 text-noodle-cream" />
          </button>

          {/* Logo & Current View Title */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full overflow-hidden relative border border-white/40 bg-white flex-shrink-0">
              <Image src={storeSettings.storeLogo || '/images/logo/bubur-khalid-logo.png'} alt="Logo" fill className="object-cover" />
            </div>
            <div>
              <div className="font-black text-xs text-white leading-tight">{storeSettings.storeName}</div>
              <div className="text-[10px] text-yolk-blaze font-bold">
                {activeTab === 'dashboard'
                  ? 'Dashboard Operasional'
                  : activeTab === 'menu'
                  ? 'Manajemen Menu'
                  : activeTab === 'tables'
                  ? 'Manajemen Meja'
                  : activeTab === 'settings'
                  ? 'Security & Toko'
                  : 'Tong Sampah'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Status Indicator */}
        <div className="flex items-center space-x-1.5 bg-black/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Admin</span>
        </div>
      </div>

      {/* MOBILE SLIDE-OUT DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fadeIn">
          {/* Backdrop (tap to close) */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Body */}
          <div className="relative w-72 max-w-[85vw] h-full bg-matcha-leaf text-tofu-silkblaze flex flex-col justify-between p-5 shadow-2xl border-r border-matcha-surface animate-slideRight">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-matcha-surface">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden relative border border-white/40 bg-white flex-shrink-0">
                    <Image src={storeSettings.storeLogo || '/images/logo/bubur-khalid-logo.png'} alt="Logo" fill className="object-cover" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-white">{storeSettings.storeName}</div>
                    <div className="text-[10px] text-noodle-cream">Menu Navigasi Admin</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-matcha-surface text-stone-300 hover:text-white flex items-center justify-center transition active:scale-90"
                  title="Tutup Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items in Mobile Drawer */}
              <nav className="mt-5 space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'dashboard'
                      ? 'bg-spicy-ember text-white shadow-md'
                      : 'text-noodle-cream hover:bg-matcha-surface'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard Operasional</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('menu');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'menu'
                      ? 'bg-spicy-ember text-white shadow-md'
                      : 'text-noodle-cream hover:bg-matcha-surface'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Menu & Harga</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('tables');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'tables'
                      ? 'bg-spicy-ember text-white shadow-md'
                      : 'text-noodle-cream hover:bg-matcha-surface'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <QrCode className="w-4 h-4" />
                    <span>Meja & QR Code</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStoreForm(storeSettings);
                    setActiveTab('settings');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'settings'
                      ? 'bg-spicy-ember text-white shadow-md'
                      : 'text-noodle-cream hover:bg-matcha-surface'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-yolk-blaze" />
                    <span>Security & Pengaturan</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('owner-financial');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-noodle-cream hover:bg-matcha-surface transition"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-yolk-blaze" />
                    <span>Laporan Keuangan (Owner)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('pos');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-noodle-cream hover:bg-matcha-surface transition"
                >
                  <div className="flex items-center space-x-3">
                    <Calculator className="w-4 h-4 text-yolk-blaze" />
                    <span>Buka POS Kasir Tablet</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('kds');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-noodle-cream hover:bg-matcha-surface transition"
                >
                  <div className="flex items-center space-x-3">
                    <ChefHat className="w-4 h-4 text-yolk-blaze" />
                    <span>Buka Kitchen Display (Dapur)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('trash');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'trash'
                      ? 'bg-spicy-ember text-white shadow-md'
                      : 'text-noodle-cream hover:bg-matcha-surface'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Trash2 className="w-4 h-4" />
                    <span>Tong Sampah</span>
                  </div>
                  {trashProducts.length > 0 && (
                    <span className="bg-spicy-ember text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {trashProducts.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR (Desktop Only: hidden on mobile, md:flex on desktop, sticky & fixed on scroll) */}
      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`hidden md:flex ${
          isSidebarOpen ? 'md:w-64' : 'md:w-20'
        } bg-matcha-leaf text-tofu-silkblaze p-3 md:p-4 flex-col justify-between border-r border-matcha-surface flex-shrink-0 transition-all duration-300 ease-in-out z-40 sticky top-0 h-screen overflow-y-auto hide-scrollbar group shadow-xl`}
      >
        <div>
          {/* Brand Logo & Header with Pin Toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-matcha-surface">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div
                onClick={() => setIsSidebarPinned(!isSidebarPinned)}
                className="w-10 h-10 rounded-full overflow-hidden bg-spicy-ember flex items-center justify-center text-xl shadow-md border-2 border-noodle-cream relative flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                title={isSidebarPinned ? 'Sidebar Terkunci (Klik untuk Auto-Slide)' : 'Klik untuk Kunci Sidebar Terbuka'}
              >
                {storeSettings.storeLogo ? (
                  <Image src={storeSettings.storeLogo} alt="Logo Bubur Khalid" fill className="object-cover" />
                ) : (
                  <span>🥣</span>
                )}
              </div>
              
              {/* Text fades and slides in when open */}
              <div
                className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                  isSidebarOpen ? 'opacity-100 max-w-[180px]' : 'opacity-0 max-w-0'
                }`}
              >
                <h1 className="font-extrabold text-base text-noodle-cream tracking-tight truncate">
                  {storeSettings.storeName || 'Bubur Khalid'}
                </h1>
                <span className="text-[10px] text-noodle-dark block font-medium">Admin & Operasional</span>
              </div>
            </div>

            {/* Pin Toggle Button (Only visible when open on desktop) */}
            {isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarPinned(!isSidebarPinned)}
                className={`p-1.5 rounded-lg transition text-xs hidden md:flex items-center justify-center ${
                  isSidebarPinned
                    ? 'bg-spicy-ember text-white'
                    : 'text-noodle-dark hover:text-white hover:bg-matcha-surface'
                }`}
                title={isSidebarPinned ? 'Lepas Pin (Kembali ke Mini Icon)' : 'Kunci Sidebar Terbuka'}
              >
                <Pin className={`w-3.5 h-3.5 ${isSidebarPinned ? 'rotate-45' : ''}`} />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="mt-5 space-y-1.5 text-xs font-semibold">
            {/* Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center ${
                isSidebarOpen ? 'justify-start space-x-3 px-3 py-2.5' : 'justify-center p-2.5'
              } rounded-xl transition-all duration-200 relative group/btn ${
                activeTab === 'dashboard'
                  ? 'bg-spicy-ember text-white shadow-md font-bold'
                  : 'text-noodle-cream hover:bg-matcha-surface'
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                  isSidebarOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'
                }`}
              >
                Dashboard
              </span>
              {/* Floating Tooltip in Icon-only mode */}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-stone-900 text-white text-[11px] rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover/btn:opacity-100 pointer-events-none transition z-50">
                  Dashboard
                </div>
              )}
            </button>

            {/* Menu & Harga */}
            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center ${
                isSidebarOpen ? 'justify-start space-x-3 px-3 py-2.5' : 'justify-center p-2.5'
              } rounded-xl transition-all duration-200 relative group/btn ${
                activeTab === 'menu'
                  ? 'bg-spicy-ember text-white shadow-md font-bold'
                  : 'text-noodle-cream hover:bg-matcha-surface'
              }`}
              title="Menu & Harga"
            >
              <UtensilsCrossed className="w-5 h-5 flex-shrink-0" />
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                  isSidebarOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'
                }`}
              >
                Menu & Harga
              </span>
              {!isSidebarOpen && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-stone-900 text-white text-[11px] rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover/btn:opacity-100 pointer-events-none transition z-50">
                  Menu & Harga
                </div>
              )}
            </button>

            {/* Meja & QR */}
            <button
              onClick={() => setActiveTab('tables')}
              className={`w-full flex items-center ${
                isSidebarOpen ? 'justify-start space-x-3 px-3 py-2.5' : 'justify-center p-2.5'
              } rounded-xl transition-all duration-200 relative group/btn ${
                activeTab === 'tables'
                  ? 'bg-spicy-ember text-white shadow-md font-bold'
                  : 'text-noodle-cream hover:bg-matcha-surface'
              }`}
              title="Meja & QR"
            >
              <QrCode className="w-5 h-5 flex-shrink-0" />
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                  isSidebarOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'
                }`}
              >
                Meja & QR
              </span>
              {!isSidebarOpen && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-stone-900 text-white text-[11px] rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover/btn:opacity-100 pointer-events-none transition z-50">
                  Meja & QR Code
                </div>
              )}
            </button>

            {/* Pengaturan & Security */}
            <button
              onClick={() => {
                setStoreForm(storeSettings);
                setActiveTab('settings');
              }}
              className={`w-full flex items-center ${
                isSidebarOpen ? 'justify-start space-x-3 px-3 py-2.5' : 'justify-center p-2.5'
              } rounded-xl transition-all duration-200 relative group/btn ${
                activeTab === 'settings'
                  ? 'bg-spicy-ember text-white shadow-md font-bold'
                  : 'text-noodle-cream hover:bg-matcha-surface'
              }`}
              title="Security & Pengguna"
            >
              <Shield className="w-5 h-5 text-yolk-blaze flex-shrink-0" />
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                  isSidebarOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'
                }`}
              >
                Security & Pengguna
              </span>
              {!isSidebarOpen && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-stone-900 text-white text-[11px] rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover/btn:opacity-100 pointer-events-none transition z-50">
                  Security & Pengguna
                </div>
              )}
            </button>

            {/* Laporan Keuangan */}
            <button
              onClick={() => setActiveView('owner-financial')}
              className={`w-full flex items-center ${
                isSidebarOpen ? 'justify-start space-x-3 px-3 py-2.5' : 'justify-center p-2.5'
              } rounded-xl text-noodle-cream hover:bg-matcha-surface transition-all duration-200 relative group/btn whitespace-nowrap`}
              title="Laporan Keuangan"
            >
              <FileText className="w-5 h-5 text-yolk-blaze flex-shrink-0" />
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                  isSidebarOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'
                }`}
              >
                Laporan Keuangan
              </span>
              {!isSidebarOpen && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-stone-900 text-white text-[11px] rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover/btn:opacity-100 pointer-events-none transition z-50">
                  Laporan Keuangan
                </div>
              )}
            </button>

            {/* Tong Sampah */}
            <button
              onClick={() => setActiveTab('trash')}
              className={`w-full flex items-center ${
                isSidebarOpen ? 'justify-between px-3 py-2.5' : 'justify-center p-2.5'
              } rounded-xl transition-all duration-200 relative group/btn ${
                activeTab === 'trash'
                  ? 'bg-spicy-ember text-white shadow-md font-bold'
                  : 'text-noodle-cream hover:bg-matcha-surface'
              }`}
              title="Tong Sampah"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <Trash2 className="w-5 h-5 flex-shrink-0" />
                <span
                  className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isSidebarOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'
                  }`}
                >
                  Tong Sampah
                </span>
              </div>
              {trashProducts.length > 0 && (
                <span className={`rounded-full bg-spicy-ember text-white font-bold flex items-center justify-center flex-shrink-0 ${
                  isSidebarOpen ? 'w-5 h-5 text-[10px]' : 'absolute -top-1 -right-1 w-4 h-4 text-[9px] border border-white'
                }`}>
                  {trashProducts.length}
                </span>
              )}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-stone-900 text-white text-[11px] rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover/btn:opacity-100 pointer-events-none transition z-50">
                  Tong Sampah ({trashProducts.length})
                </div>
              )}
            </button>
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT AREA (Scrolls independently on desktop while sidebar stays locked) */}
      <main className="flex-1 h-auto md:h-screen p-6 md:p-8 overflow-y-auto">
        
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h1 className="text-xl font-extrabold text-matcha-leaf">
              {activeTab === 'dashboard'
                ? 'Dashboard Operasional'
                : activeTab === 'menu'
                ? 'Manajemen Menu & Harga'
                : activeTab === 'tables'
                ? 'Pengaturan Meja & QR Code'
                : activeTab === 'settings'
                ? currentUser?.role === 'OWNER'
                  ? 'Pengaturan Toko, Banner & Metode Pembayaran'
                  : 'Pengaturan Toko & Banner'
                : 'Tong Sampah'}
            </h1>
            <p className="text-xs text-stone-500">{liveTodayIndo} • Zona Waktu Asia/Padang Pariaman (WIB)</p>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Quick Cloud Sync Button */}
            <button
              type="button"
              onClick={() => syncFromCloud()}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-matcha-leaf hover:bg-noodle-cream text-xs font-bold shadow-xs transition active:scale-95"
              title="Sinkronkan data dengan database Supabase Cloud"
            >
              <RefreshCw className="w-3.5 h-3.5 text-spicy-ember" />
              <span className="hidden sm:inline">Sinkron Data</span>
            </button>

            <button className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-matcha-leaf shadow-sm hover:bg-noodle-cream transition">
              <Bell className="w-4 h-4" />
            </button>
            {/* Interactive Store Status & Operating Hours Pill (Click to edit & auto-save) */}
            <button
              type="button"
              onClick={() => setIsStoreHoursModalOpen(true)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border shadow-xs transition cursor-pointer active:scale-95 group ${
                storeSettings.isStoreHoliday
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                  : !storeSettings.isStoreOpen
                  ? 'bg-red-50 hover:bg-red-100 border-red-300 text-red-900'
                  : 'bg-white hover:bg-emerald-50 border-stone-200 hover:border-emerald-300 text-matcha-leaf'
              }`}
              title="Klik untuk ubah Jam Buka & Status Toko (Libur/Tutup)"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  storeSettings.isStoreHoliday
                    ? 'bg-amber-500 animate-ping'
                    : storeSettings.isStoreOpen
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-red-500'
                }`}
              />
              <span className="text-xs font-bold whitespace-nowrap">
                {storeSettings.isStoreHoliday
                  ? `Toko Libur (${storeSettings.operatingHours || '16:00 - 22:00'})`
                  : storeSettings.isStoreOpen
                  ? `Toko Buka (${storeSettings.operatingHours || '16:00 - 22:00'})`
                  : `Toko Tutup (${storeSettings.operatingHours || '16:00 - 22:00'})`}
              </span>
              <ChevronDown className="w-3 h-3 text-stone-400 group-hover:text-matcha-leaf transition flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* TAB 1: OPERATIONAL DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="mt-6 space-y-6">
            
            {/* Metric Cards Row (Matches design mockup right panel) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Pendapatan Hari Ini */}
              <div className="bg-noodle-cream/70 rounded-2xl p-4 border border-noodle-dark shadow-soft">
                <div className="text-[11px] text-stone-600 font-semibold flex items-center space-x-1">
                  <span>💰 Pendapatan Hari Ini</span>
                </div>
                <div className="text-xl font-black text-matcha-deep mt-1">
                  Rp{financialSummary.today_revenue.toLocaleString('id-ID')}
                </div>
                {financialSummary.today_revenue > 0 ? (
                  <div className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                    <span>Aktif Hari Ini</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-stone-400 font-medium mt-1">
                    Belum ada transaksi hari ini
                  </div>
                )}
              </div>

              {/* Pendapatan Bulan Ini */}
              <div className="bg-noodle-cream/70 rounded-2xl p-4 border border-noodle-dark shadow-soft">
                <div className="text-[11px] text-stone-600 font-semibold flex items-center space-x-1">
                  <span>📈 Pendapatan Bulan Ini</span>
                </div>
                <div className="text-xl font-black text-matcha-deep mt-1">
                  Rp{financialSummary.month_revenue.toLocaleString('id-ID')}
                </div>
                {financialSummary.month_revenue > 0 ? (
                  <div className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                    <span>Akumulasi Bulan Berjalan</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-stone-400 font-medium mt-1">
                    Belum ada transaksi bulan ini
                  </div>
                )}
              </div>

              {/* Total Pesanan */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-soft">
                <div className="text-[11px] text-stone-500 font-semibold">📋 Total Pesanan Hari Ini</div>
                <div className="text-2xl font-black text-matcha-leaf mt-1">
                  {financialSummary.today_transactions}
                </div>
                <div className="text-[10px] text-stone-400 mt-1">Selesai & Sedang Berjalan</div>
              </div>

              {/* Online vs In-Store Split */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-soft flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-stone-500 font-bold">ONLINE (ON)</div>
                  <div className="text-xl font-black text-spicy-ember">{onlineOrders.length}</div>
                </div>
                <div className="w-px h-8 bg-stone-200" />
                <div>
                  <div className="text-[10px] text-stone-500 font-bold">KASIR (OT)</div>
                  <div className="text-xl font-black text-yolk-blaze">{inStoreOrders.length}</div>
                </div>
              </div>

            </div>

            {/* Visual Analytics: Arus Keuangan (Uang Masuk vs Uang Keluar) + Alokasi Keuangan & Kanal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Card 1: Arus Keuangan: Uang Masuk vs Uang Keluar (Animated Line Chart) */}
              <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-soft flex flex-col justify-between relative overflow-hidden">
                
                {/* CSS Keyframes for Vivid Animations */}
                <style jsx>{`
                  @keyframes drawCashflowLine {
                    0% {
                      stroke-dashoffset: 1200;
                    }
                    100% {
                      stroke-dashoffset: 0;
                    }
                  }
                  @keyframes pingRadarRing {
                    0% {
                      r: 6px;
                      opacity: 0.9;
                    }
                    70% {
                      r: 16px;
                      opacity: 0;
                    }
                    100% {
                      r: 18px;
                      opacity: 0;
                    }
                  }
                  @keyframes donutDrawAnim {
                    0% {
                      stroke-dashoffset: 330;
                    }
                    100% {
                      stroke-dashoffset: 0;
                    }
                  }
                  .animate-draw-line {
                    stroke-dasharray: 1200;
                    animation: drawCashflowLine 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                  }
                  .animate-radar-ping {
                    animation: pingRadarRing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                  }
                `}</style>

                {/* Header: Title & Dropdown Filter */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="font-extrabold text-base sm:text-lg text-stone-900 tracking-tight">
                        {currentCashflowDataset.title}
                      </h3>
                      <span className="hidden sm:inline-flex text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Cashflow Sehat
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {currentCashflowDataset.sub}
                    </p>
                  </div>

                  {/* Range Filter Buttons */}
                  <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl text-xs font-bold border border-stone-200">
                    <button
                      type="button"
                      onClick={() => {
                        setFinanceRangeFilter('7D');
                        setHoveredFinanceIdx(null);
                      }}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        financeRangeFilter === '7D'
                          ? 'bg-spicy-ember text-white shadow-xs font-black'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      7 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFinanceRangeFilter('30D');
                        setHoveredFinanceIdx(null);
                      }}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        financeRangeFilter === '30D'
                          ? 'bg-spicy-ember text-white shadow-xs font-black'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      30 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFinanceRangeFilter('THIS_MONTH');
                        setHoveredFinanceIdx(null);
                      }}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        financeRangeFilter === 'THIS_MONTH'
                          ? 'bg-spicy-ember text-white shadow-xs font-black'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Bulan Ini
                    </button>
                  </div>
                </div>

                {/* Legend Row: Uang Masuk (Orange) & Uang Keluar (Dark Navy) */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-3 mb-4">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-0.5 bg-[#F97316] relative flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#F97316] ring-2 ring-white" />
                      </div>
                      <span className="text-xs font-bold text-stone-800">Uang Masuk (Omzet)</span>
                      <span className="text-xs font-mono font-black text-spicy-ember">
                        {currentCashflowDataset.totalMasuk}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-0.5 bg-[#1E293B] relative flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1E293B] ring-2 ring-white" />
                      </div>
                      <span className="text-xs font-bold text-stone-800">Uang Keluar (Beban & Bahan)</span>
                      <span className="text-xs font-mono font-bold text-stone-700">
                        {currentCashflowDataset.totalKeluar}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-stone-600">
                    Net Laba: <span className="text-emerald-700 font-extrabold font-mono">{currentCashflowDataset.netLaba}</span>
                    <span className="text-emerald-600 font-semibold ml-1">({currentCashflowDataset.marginNet})</span>
                  </div>
                </div>

                {/* Chart Plot Area */}
                <div className="relative flex items-stretch pt-2">
                  
                  {/* Left Y-Axis */}
                  <div className="w-14 shrink-0 flex flex-col justify-between text-right pr-3 text-[11px] font-mono text-stone-400 font-medium select-none py-1">
                    {currentCashflowDataset.yLabels.map((lbl, idx) => (
                      <span key={idx}>{lbl}</span>
                    ))}
                  </div>

                  {/* Canvas Stage */}
                  <div className="flex-1 relative h-60 sm:h-64">
                    
                    {/* Horizontal Light Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="w-full border-b border-stone-100" />
                      <div className="w-full border-b border-stone-100" />
                      <div className="w-full border-b border-stone-100" />
                      <div className="w-full border-b border-stone-100" />
                      <div className="w-full border-b border-stone-200" />
                    </div>

                    {/* SVG Dual-Line Cashflow Chart with Live Keyframe Animations */}
                    <svg
                      key={`cashflow-svg-${financeRangeFilter}`}
                      viewBox="0 0 600 200"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full overflow-visible z-10 pointer-events-none"
                    >
                      <defs>
                        <linearGradient id="uangMasukAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
                          <stop offset="60%" stopColor="#EE3F24" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="uangMasukStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#F97316" />
                          <stop offset="60%" stopColor="#EE3F24" />
                          <stop offset="100%" stopColor="#F97316" />
                        </linearGradient>
                        <filter id="softGlowLine" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#F97316" floodOpacity="0.35" />
                        </filter>
                      </defs>

                      {/* Area Fill for Uang Masuk */}
                      <path
                        d={`M ${currentCashflowDataset.points[0].x} ${currentCashflowDataset.points[0].masukY} ${currentCashflowDataset.points.slice(1).map(d => `L ${d.x} ${d.masukY}`).join(' ')} L ${currentCashflowDataset.points[currentCashflowDataset.points.length - 1].x} 190 L ${currentCashflowDataset.points[0].x} 190 Z`}
                        fill="url(#uangMasukAreaGrad)"
                        className="transition-all duration-700 ease-out"
                      />

                      {/* Vertical Guideline on Hover */}
                      {hoveredFinanceIdx !== null && currentCashflowDataset.points[hoveredFinanceIdx] && (
                        <line
                          x1={currentCashflowDataset.points[hoveredFinanceIdx].x}
                          y1={10}
                          x2={currentCashflowDataset.points[hoveredFinanceIdx].x}
                          y2={190}
                          stroke="#F97316"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          className="animate-pulse"
                        />
                      )}

                      {/* Line 2: Uang Keluar (Dark Navy) with Dash Drawing Animation */}
                      <polyline
                        fill="none"
                        stroke="#1E293B"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={currentCashflowDataset.points.map((d) => `${d.x},${d.keluarY}`).join(' ')}
                        className="animate-draw-line"
                      />

                      {/* Line 1: Uang Masuk (Orange Glow) with Dash Drawing Animation */}
                      <polyline
                        fill="none"
                        stroke="url(#uangMasukStrokeGrad)"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#softGlowLine)"
                        points={currentCashflowDataset.points.map((d) => `${d.x},${d.masukY}`).join(' ')}
                        className="animate-draw-line"
                      />

                      {/* Uang Keluar Points (Navy) */}
                      {currentCashflowDataset.points.map((d, i) => (
                        <g key={`keluar-${i}`}>
                          <circle
                            cx={d.x}
                            cy={d.keluarY}
                            r={hoveredFinanceIdx === i ? '6' : '4'}
                            fill="#1E293B"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            className="transition-all duration-200"
                          />
                        </g>
                      ))}

                      {/* Uang Masuk Points (Orange with Animated Radar Ping) */}
                      {currentCashflowDataset.points.map((d, i) => (
                        <g key={`masuk-${i}`}>
                          {/* Pulsing Radar Ring for Peak, Active, or Hovered point */}
                          {(d.isPeak || d.isActive || hoveredFinanceIdx === i) && (
                            <circle
                              cx={d.x}
                              cy={d.masukY}
                              fill="#F97316"
                              className="animate-radar-ping"
                            />
                          )}
                          <circle
                            cx={d.x}
                            cy={d.masukY}
                            r={hoveredFinanceIdx === i ? '7.5' : d.isPeak ? '6.5' : '4.5'}
                            fill="#F97316"
                            stroke="#FFFFFF"
                            strokeWidth="2.5"
                            className="transition-all duration-200"
                          />
                        </g>
                      ))}
                    </svg>

                    {/* Interactive Hover Columns */}
                    <div
                      className="absolute inset-0 grid z-20"
                      style={{ gridTemplateColumns: `repeat(${currentCashflowDataset.points.length}, minmax(0, 1fr))` }}
                    >
                      {currentCashflowDataset.points.map((d, i) => (
                        <div
                          key={i}
                          onMouseEnter={() => setHoveredFinanceIdx(i)}
                          onMouseLeave={() => setHoveredFinanceIdx(null)}
                          className="h-full cursor-pointer flex items-end justify-center group"
                        />
                      ))}
                    </div>

                  </div>
                </div>

                {/* X-Axis Labels */}
                <div className="flex items-center mt-3 pt-1">
                  <div className="w-14 shrink-0" />
                  <div
                    className="flex-1 grid text-center"
                    style={{ gridTemplateColumns: `repeat(${currentCashflowDataset.points.length}, minmax(0, 1fr))` }}
                  >
                    {currentCashflowDataset.points.map((d, i) => (
                      <span
                        key={i}
                        className={`text-xs transition ${
                          hoveredFinanceIdx === i
                            ? 'text-spicy-ember font-black scale-110'
                            : d.isPeak
                            ? 'text-amber-600 font-extrabold'
                            : d.isActive
                            ? 'text-spicy-ember font-bold'
                            : 'text-stone-500 font-medium'
                        }`}
                      >
                        {d.day}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Floating Interactive Tooltip Showing Uang Masuk vs Uang Keluar */}
                {hoveredFinanceIdx !== null && currentCashflowDataset.points[hoveredFinanceIdx] && (
                  <div className="mt-4 p-3 bg-stone-900 text-white rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn shadow-xl border border-stone-700">
                    <div>
                      <div className="font-extrabold text-stone-200">
                        {currentCashflowDataset.points[hoveredFinanceIdx].fullDay}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        Margin Laba: <span className="text-emerald-400 font-bold">{currentCashflowDataset.points[hoveredFinanceIdx].marginPct}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-[10px] text-stone-400 uppercase font-semibold">Uang Masuk</div>
                        <div className="font-black text-[#F97316] font-mono text-sm">
                          {currentCashflowDataset.points[hoveredFinanceIdx].uangMasukStr}
                        </div>
                      </div>
                      <div className="w-px h-7 bg-stone-700" />
                      <div className="text-right">
                        <div className="text-[10px] text-stone-400 uppercase font-semibold">Uang Keluar</div>
                        <div className="font-bold text-stone-300 font-mono text-sm">
                          {currentCashflowDataset.points[hoveredFinanceIdx].uangKeluarStr}
                        </div>
                      </div>
                      <div className="w-px h-7 bg-stone-700" />
                      <div className="text-right">
                        <div className="text-[10px] text-stone-400 uppercase font-semibold">Laba Bersih</div>
                        <div className="font-black text-emerald-400 font-mono text-sm">
                          {currentCashflowDataset.points[hoveredFinanceIdx].labaStr}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Card 2: Alokasi & Rasio Keuangan / Kanal Penjualan (Interactive Animated Donut Chart) */}
              <div className="lg:col-span-1 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-soft flex flex-col justify-between">
                
                {/* Header: Title & View Switcher */}
                <div className="pb-2 border-b border-stone-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-spicy-ember animate-pulse" />
                      <h3 className="font-extrabold text-base text-stone-900 tracking-tight">
                        {donutViewMode === 'cost' ? 'Alokasi & Rasio Keuangan' : 'Kanal Penjualan Toko'}
                      </h3>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {donutViewMode === 'cost'
                        ? 'Proporsi laba bersih vs beban belanja & operasional'
                        : 'Perbandingan pesanan Online (ON) vs Kasir (OT)'}
                    </p>
                  </div>

                  {/* Mode Toggle Buttons */}
                  <div className="flex items-center space-x-1 bg-stone-100 p-0.5 rounded-lg text-[10px] font-bold border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setDonutViewMode('cost')}
                      className={`px-2 py-1 rounded transition cursor-pointer ${
                        donutViewMode === 'cost'
                          ? 'bg-spicy-ember text-white shadow-xs font-black'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Biaya & Laba
                    </button>
                    <button
                      type="button"
                      onClick={() => setDonutViewMode('channel')}
                      className={`px-2 py-1 rounded transition cursor-pointer ${
                        donutViewMode === 'channel'
                          ? 'bg-spicy-ember text-white shadow-xs font-black'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Kanal Order
                    </button>
                  </div>
                </div>

                {/* Donut Chart & Legend Stack with Micro-Animations */}
                <div className="flex flex-col sm:flex-row lg:flex-row items-center justify-between gap-5 my-auto py-4">
                  
                  {/* Animated Donut Ring */}
                  <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                      {/* Background Track */}
                      <circle
                        cx="70"
                        cy="70"
                        r="52"
                        fill="none"
                        stroke="#F1F5F9"
                        strokeWidth="15"
                      />

                      {donutViewMode === 'cost' ? (
                        <>
                          {/* Segment 1: Laba Bersih - Orange */}
                          <circle
                            cx="70"
                            cy="70"
                            r="52"
                            fill="none"
                            stroke="#F97316"
                            strokeWidth={activeDonutSegment === 'profit' ? '19' : '15'}
                            strokeDasharray={currentTotalMasuk > 0 ? `${(costProfitPct / 100) * 326.7} 326.7` : '0 326.7'}
                            strokeLinecap="round"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setActiveDonutSegment('profit')}
                            onMouseLeave={() => setActiveDonutSegment(null)}
                          />
                          {/* Segment 2: Bahan Baku - Dark Navy */}
                          <circle
                            cx="70"
                            cy="70"
                            r="52"
                            fill="none"
                            stroke="#1E293B"
                            strokeWidth={activeDonutSegment === 'cogs' ? '19' : '15'}
                            strokeDasharray={currentTotalMasuk > 0 ? `${(costBahanPct / 100) * 326.7} 326.7` : '0 326.7'}
                            strokeDashoffset={currentTotalMasuk > 0 ? `-${(costProfitPct / 100) * 326.7}` : '0'}
                            strokeLinecap="round"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setActiveDonutSegment('cogs')}
                            onMouseLeave={() => setActiveDonutSegment(null)}
                          />
                          {/* Segment 3: Operasional - Gray */}
                          <circle
                            cx="70"
                            cy="70"
                            r="52"
                            fill="none"
                            stroke="#94A3B8"
                            strokeWidth={activeDonutSegment === 'opex' ? '19' : '15'}
                            strokeDasharray={currentTotalMasuk > 0 ? `${(costOpexPct / 100) * 326.7} 326.7` : '0 326.7'}
                            strokeDashoffset={currentTotalMasuk > 0 ? `-${((costProfitPct + costBahanPct) / 100) * 326.7}` : '0'}
                            strokeLinecap="round"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setActiveDonutSegment('opex')}
                            onMouseLeave={() => setActiveDonutSegment(null)}
                          />
                        </>
                      ) : (
                        <>
                          {/* Channel Segment 1: Online - Spicy Ember */}
                          <circle
                            cx="70"
                            cy="70"
                            r="52"
                            fill="none"
                            stroke="#EE3F24"
                            strokeWidth={activeChannelSegment === 'online' ? '19' : '15'}
                            strokeDasharray={totalOrdersCount > 0 ? `${(channelOnlinePct / 100) * 326.7} 326.7` : '0 326.7'}
                            strokeLinecap="round"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setActiveChannelSegment('online')}
                            onMouseLeave={() => setActiveChannelSegment(null)}
                          />
                          {/* Channel Segment 2: Kasir - Yolk Blaze */}
                          <circle
                            cx="70"
                            cy="70"
                            r="52"
                            fill="none"
                            stroke="#F9A11B"
                            strokeWidth={activeChannelSegment === 'cashier' ? '19' : '15'}
                            strokeDasharray={totalOrdersCount > 0 ? `${(channelCashierPct / 100) * 326.7} 326.7` : '0 326.7'}
                            strokeDashoffset={totalOrdersCount > 0 ? `-${(channelOnlinePct / 100) * 326.7}` : '0'}
                            strokeLinecap="round"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setActiveChannelSegment('cashier')}
                            onMouseLeave={() => setActiveChannelSegment(null)}
                          />
                        </>
                      )}
                    </svg>

                    {/* Dynamic Center Percentage & Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                      {donutViewMode === 'cost' ? (
                        <>
                          <span className="text-2xl font-black text-stone-900 tracking-tight leading-none animate-fadeIn">
                            {currentTotalMasuk === 0
                              ? '0%'
                              : activeDonutSegment === 'cogs'
                              ? `${costBahanPct}%`
                              : activeDonutSegment === 'opex'
                              ? `${costOpexPct}%`
                              : `${costProfitPct}%`}
                          </span>
                          <span className="text-[11px] font-bold text-stone-500 mt-1">
                            {currentTotalMasuk === 0
                              ? 'Belum Ada Data'
                              : activeDonutSegment === 'cogs'
                              ? 'Bahan Baku'
                              : activeDonutSegment === 'opex'
                              ? 'Operasional'
                              : 'Laba Bersih'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl font-black text-stone-900 tracking-tight leading-none animate-fadeIn">
                            {totalOrdersCount === 0
                              ? '0%'
                              : activeChannelSegment === 'cashier'
                              ? `${channelCashierPct}%`
                              : `${channelOnlinePct}%`}
                          </span>
                          <span className="text-[11px] font-bold text-stone-500 mt-1">
                            {totalOrdersCount === 0
                              ? 'Belum Ada Pesanan'
                              : activeChannelSegment === 'cashier'
                              ? 'Kasir (OT)'
                              : 'Online (ON)'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Legend Breakdown List with Hover Interactivity */}
                  <div className="w-full sm:w-auto flex-1 space-y-3 pl-2">
                    {donutViewMode === 'cost' ? (
                      <>
                        {/* Laba Bersih */}
                        <div
                          onMouseEnter={() => setActiveDonutSegment('profit')}
                          onMouseLeave={() => setActiveDonutSegment(null)}
                          className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition cursor-pointer ${
                            activeDonutSegment === 'profit' ? 'bg-orange-50 font-black' : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-3 h-3 rounded-full bg-[#F97316] shrink-0" />
                            <span className="font-semibold text-stone-700">Laba Bersih</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-stone-900 font-mono">{costProfitPct}%</span>
                            <span className="text-[10px] text-stone-400 block font-mono">Rp {currentNetLaba.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        {/* Belanja Bahan Baku */}
                        <div
                          onMouseEnter={() => setActiveDonutSegment('cogs')}
                          onMouseLeave={() => setActiveDonutSegment(null)}
                          className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition cursor-pointer ${
                            activeDonutSegment === 'cogs' ? 'bg-stone-100 font-black' : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-3 h-3 rounded-full bg-[#1E293B] shrink-0" />
                            <span className="font-semibold text-stone-700">Bahan Baku (HPP)</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-stone-900 font-mono">{costBahanPct}%</span>
                            <span className="text-[10px] text-stone-400 block font-mono">Rp {costBahanVal.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        {/* Beban Operasional */}
                        <div
                          onMouseEnter={() => setActiveDonutSegment('opex')}
                          onMouseLeave={() => setActiveDonutSegment(null)}
                          className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition cursor-pointer ${
                            activeDonutSegment === 'opex' ? 'bg-stone-100 font-black' : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-3 h-3 rounded-full bg-[#94A3B8] shrink-0" />
                            <span className="font-semibold text-stone-700">Operasional & Toko</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-stone-900 font-mono">{costOpexPct}%</span>
                            <span className="text-[10px] text-stone-400 block font-mono">Rp {costOpexVal.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Kanal Online */}
                        <div
                          onMouseEnter={() => setActiveChannelSegment('online')}
                          onMouseLeave={() => setActiveChannelSegment(null)}
                          className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition cursor-pointer ${
                            activeChannelSegment === 'online' ? 'bg-orange-50 font-black' : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-3 h-3 rounded-full bg-spicy-ember shrink-0" />
                            <div>
                              <span className="font-semibold text-stone-700 block">Online (ON)</span>
                              <span className="text-[10px] text-stone-400 font-mono">{onlineOrders.length} Pesanan</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-stone-900 font-mono">{channelOnlinePct}%</span>
                            <span className="text-[10px] text-emerald-600 block font-semibold">Tinggi</span>
                          </div>
                        </div>

                        {/* Kanal Kasir */}
                        <div
                          onMouseEnter={() => setActiveChannelSegment('cashier')}
                          onMouseLeave={() => setActiveChannelSegment(null)}
                          className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition cursor-pointer ${
                            activeChannelSegment === 'cashier' ? 'bg-amber-50 font-black' : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-3 h-3 rounded-full bg-yolk-blaze shrink-0" />
                            <div>
                              <span className="font-semibold text-stone-700 block">Kasir (OT)</span>
                              <span className="text-[10px] text-stone-400 font-mono">{inStoreOrders.length} Pesanan</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-stone-900 font-mono">{channelCashierPct}%</span>
                            <span className="text-[10px] text-stone-500 block font-semibold">Dine-in/OT</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                </div>

                {/* Bottom Quick Badge */}
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-900 font-medium">
                    {donutViewMode === 'cost' ? 'Target Margin > 60%' : 'Total Pesanan Hari Ini'}
                  </span>
                  <span className="font-extrabold text-emerald-700 flex items-center space-x-1">
                    <span>✓</span>
                    <span>
                      {donutViewMode === 'cost'
                        ? currentTotalMasuk > 0
                          ? `Cashflow Sangat Sehat (+${costProfitPct}%)`
                          : 'Siap Menerima Pesanan'
                        : `${totalOrdersCount} Pesanan Terlayani`}
                    </span>
                  </span>
                </div>

              </div>

            </div>

              {/* Bottom Quick KPI Summary Cards (100% Dynamic Real Data) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div className="bg-tofu-silkblaze/70 p-3 rounded-xl border border-stone-200/80">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Hari Penjualan Puncak</span>
                  <div className="text-xs font-black text-matcha-leaf mt-0.5 flex items-center space-x-1">
                    <span>👑</span>
                    <span className="truncate">
                      {currentCashflowDataset.totalMasukNum > 0 && currentCashflowDataset.peakDayTx > 0
                        ? `${currentCashflowDataset.peakDayName} (${currentCashflowDataset.peakDayVal})`
                        : 'Belum Ada Transaksi'}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400">
                    {currentCashflowDataset.totalMasukNum > 0
                      ? `${currentCashflowDataset.peakDayTx} transaksi tercatat`
                      : '0 transaksi'}
                  </span>
                </div>

                <div className="bg-tofu-silkblaze/70 p-3 rounded-xl border border-stone-200/80">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Rata-rata Penjualan</span>
                  <div className="text-xs font-black text-matcha-leaf mt-0.5 truncate">
                    Rp {(currentCashflowDataset.points.length > 0 ? Math.round(currentCashflowDataset.totalMasukNum / currentCashflowDataset.points.length) : 0).toLocaleString('id-ID')} / hari
                  </div>
                  <span className="text-[10px] text-stone-400 truncate block">
                    {currentCashflowDataset.totalMasukNum > 0
                      ? `${currentCashflowDataset.points.filter((p) => p.uangMasuk > 0).length} hari aktif penjualan`
                      : 'Menunggu pesanan'}
                  </span>
                </div>

                <div className="bg-tofu-silkblaze/70 p-3 rounded-xl border border-stone-200/80">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block truncate">
                    {`Akumulasi ${financeRangeFilter === '7D' ? '7 Hari' : financeRangeFilter === '30D' ? '30 Hari' : 'Bulan Ini'}`}
                  </span>
                  <div className="text-xs font-black text-spicy-ember mt-0.5 truncate">
                    {currentCashflowDataset.totalMasuk}
                  </div>
                  <span className="text-[10px] text-stone-400 truncate block">
                    Total {currentPeriodPortionsSold} porsi terjual
                  </span>
                </div>

                <div className="bg-tofu-silkblaze/70 p-3 rounded-xl border border-stone-200/80">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Margin Laba Bersih</span>
                  <div className={`text-xs font-black mt-0.5 flex items-center space-x-1 ${costProfitPct > 0 ? 'text-emerald-600' : 'text-stone-500'}`}>
                    <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{costProfitPct > 0 ? `+${costProfitPct}% Laba Bersih` : '0% (Belum Ada Omzet)'}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 truncate block">
                    {currentCashflowDataset.totalMasukNum > 0 ? `Net: ${currentCashflowDataset.netLaba}` : 'Estimasi stabil'}
                  </span>
                </div>
              </div>

            {/* Lower Section: Antrean Aktif (ON vs OT separated) & Menu Terlaris */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Antrean Aktif (2 cols) */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="font-extrabold text-sm text-matcha-leaf">Antrean Aktif Saat Ini</h3>
                  
                  {/* Two Separate Tabs: ON vs OT */}
                  <div className="flex space-x-1.5 bg-stone-100 p-1 rounded-xl">
                    <button
                      onClick={() => setActiveQueueTab('ONLINE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeQueueTab === 'ONLINE'
                          ? 'bg-spicy-ember text-white shadow-sm'
                          : 'text-stone-600 hover:text-matcha-leaf'
                      }`}
                    >
                      Online Order (ON)
                    </button>
                    <button
                      onClick={() => setActiveQueueTab('IN_STORE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeQueueTab === 'IN_STORE'
                          ? 'bg-matcha-leaf text-white shadow-sm'
                          : 'text-stone-600 hover:text-matcha-leaf'
                      }`}
                    >
                      Di Tempat (OT)
                    </button>
                  </div>
                </div>

                {/* Queue Cards List */}
                <div className="space-y-3">
                  {(activeQueueTab === 'ONLINE' ? onlineOrders : inStoreOrders).length === 0 ? (
                    <div className="py-12 px-4 text-center flex flex-col items-center justify-center text-stone-400 bg-stone-50/70 rounded-2xl border border-dashed border-stone-200">
                      <span className="text-3xl mb-2">{activeQueueTab === 'ONLINE' ? '🛵' : '🏪'}</span>
                      <p className="text-xs font-bold text-stone-700">
                        {activeQueueTab === 'ONLINE'
                          ? 'Belum ada antrean pesanan online'
                          : 'Belum ada antrean kasir di tempat'}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-1 max-w-sm">
                        {activeQueueTab === 'ONLINE'
                          ? 'Pesanan yang masuk dari Web Pemesanan Pelanggan akan tampil otomatis di sini secara realtime.'
                          : 'Pesanan yang dibuat dari POS Kasir Meja & Bungkus akan langsung tercatat di sini.'}
                      </p>
                    </div>
                  ) : (
                    (activeQueueTab === 'ONLINE' ? onlineOrders : inStoreOrders).map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-xl border border-stone-200 hover:border-noodle-dark bg-stone-50 flex items-center justify-between transition"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="shrink-0 h-11 px-3 min-w-[72px] rounded-xl bg-gradient-to-br from-noodle-cream to-amber-100/60 border border-noodle-dark/60 flex items-center justify-center shadow-xs">
                          <span className="font-black font-mono text-xs sm:text-sm text-matcha-leaf tracking-wider whitespace-nowrap">
                            {ord.queue_number}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-matcha-leaf truncate">{ord.customer_name}</span>
                            <span className="text-[10px] text-stone-500 font-mono shrink-0">
                              {ord.service_type === 'DINE_IN' ? ord.table_number || 'Dine-In' : 'Takeaway'}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                            {ord.items.map((i) => `${i.quantity}x ${i.product_name_snapshot}`).join(', ')}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end space-y-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ord.order_status === 'PREPARING'
                              ? 'bg-yolk-light text-yolk-dark border border-yolk-blaze/30'
                              : ord.order_status === 'READY'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {ord.order_status === 'PREPARING'
                            ? 'Sedang Disiapkan'
                            : ord.order_status === 'READY'
                            ? 'Siap Saji'
                            : 'Menunggu'}
                        </span>
                        <div className="text-xs font-black text-spicy-ember">
                          Rp{ord.total_amount.toLocaleString('id-ID')}
                        </div>
                        <div className="flex items-center space-x-1 pt-0.5">
                          {ord.order_status === 'READY' ? (
                            <button
                              type="button"
                              onClick={() => updateOrderStatus(ord.id, 'COMPLETED', 'Admin')}
                              className="text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded shadow-xs transition"
                              title="Tandai Pesanan Selesai"
                            >
                              ✓ Selesai
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateOrderStatus(ord.id, 'READY', 'Admin')}
                              className="text-[9px] bg-yolk-blaze hover:bg-amber-600 text-stone-950 font-bold px-2 py-0.5 rounded shadow-xs transition"
                              title="Tandai Siap Saji"
                            >
                              Siap Saji
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Batalkan pesanan ${ord.queue_number} (${ord.customer_name})?`)) {
                                updateOrderStatus(ord.id, 'CANCELLED', 'Admin');
                              }
                            }}
                            className="text-[9px] bg-red-100 hover:bg-red-200 text-red-700 font-bold px-1.5 py-0.5 rounded border border-red-300 transition"
                            title="Batalkan Pesanan (Cancel)"
                          >
                            ✕ Batal
                          </button>
                        </div>
                        {ord.transfer_proof_image && (
                          <button
                            type="button"
                            onClick={() => setPreviewProofUrl(ord.transfer_proof_image || null)}
                            className="mt-0.5 inline-flex items-center space-x-1 text-[9px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-300 transition"
                          >
                            <span>📎</span>
                            <span>Lihat Struk WA</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>

              {/* Menu Terlaris (1 col) */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-sm text-matcha-leaf">
                    Menu Terlaris {topSellingFilter === 'today' ? 'Hari Ini' : 'Sepanjang Waktu'}
                  </h3>
                  <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setTopSellingFilter('today')}
                      className={`px-2 py-0.5 rounded-md transition ${topSellingFilter === 'today' ? 'bg-white text-matcha-leaf shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setTopSellingFilter('all')}
                      className={`px-2 py-0.5 rounded-md transition ${topSellingFilter === 'all' ? 'bg-white text-matcha-leaf shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
                    >
                      Semua
                    </button>
                  </div>
                </div>
                {topSellingItems.length === 0 ? (
                  <div className="py-10 px-4 text-center flex flex-col items-center justify-center text-stone-400 bg-stone-50/70 rounded-2xl border border-dashed border-stone-200">
                    <span className="text-3xl mb-2">🥣</span>
                    <p className="text-xs font-bold text-stone-700">Belum ada penjualan menu {topSellingFilter === 'today' ? 'hari ini' : ''}</p>
                    <p className="text-[11px] text-stone-400 mt-1 max-w-xs">
                      {topSellingFilter === 'today' ? 'Pesanan yang masuk hari ini akan otomatis dianalisis di sini.' : 'Belum ada transaksi menu tercatat.'}
                    </p>
                    {topSellingFilter === 'today' && (
                      <button
                        type="button"
                        onClick={() => setTopSellingFilter('all')}
                        className="mt-3 text-[10px] font-bold text-spicy-ember hover:underline"
                      >
                        Lihat Menu Terlaris Sepanjang Waktu →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topSellingItems.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-stone-50 transition">
                        <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0 bg-tofu-silkblaze">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-matcha-leaf line-clamp-1">{item.name}</div>
                          <div className="text-[10px] text-stone-500">Rp{item.price.toLocaleString('id-ID')}</div>
                        </div>
                        <div className="text-xs font-extrabold text-spicy-ember whitespace-nowrap">
                          {item.sales} porsi
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: MENU & PRICE MANAGEMENT (With Snapshot Integrity Protection) */}
        {activeTab === 'menu' && (
          <div className="mt-6 space-y-4">
            
            {/* Header info & Add Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-start space-x-2 flex-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Integritas Transaksi Historis:</span> Perubahan nama, foto, atau harga di sini hanya berlaku untuk pesanan baru. Seluruh transaksi lama tetap mengunci snapshot data awal.
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="bg-spicy-ember hover:bg-spicy-hover active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 shadow-sm transition cursor-pointer flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu Baru</span>
              </button>
            </div>

            {/* MOBILE CARD VIEW (md:hidden): Khusus HP agar tidak terpotong dan tombol Edit sangat mudah disentuh */}
            <div className="md:hidden space-y-3">
              {products.map((p) => {
                const isSoldOut = !p.is_available;
                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-2xl p-3.5 border-2 shadow-soft transition flex flex-col justify-between space-y-3 ${
                      isSoldOut ? 'border-red-200 bg-red-50/25' : 'border-stone-200'
                    }`}
                  >
                    {/* Top Row: Photo, Info, and Price */}
                    <div className="flex items-start space-x-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden relative flex-shrink-0 bg-stone-100 border border-stone-200">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          className={`object-cover ${isSoldOut ? 'grayscale contrast-75' : ''}`}
                        />
                        {isSoldOut && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded uppercase">
                              Habis
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-extrabold text-xs text-matcha-leaf leading-tight">
                            {p.name}
                          </h4>
                          <span className="font-black text-xs text-spicy-ember flex-shrink-0">
                            Rp{p.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className="bg-noodle-cream text-matcha-leaf px-2 py-0.5 rounded font-bold text-[10px]">
                            {p.category}
                          </span>
                          {isSoldOut && (
                            <span className="text-[9px] font-black bg-red-100 text-red-700 px-1.5 py-0.2 rounded border border-red-200">
                              HABIS
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 line-clamp-1 mt-1">{p.description}</p>
                      </div>
                    </div>

                    {/* Bottom Action Bar: Availability Toggle, Edit Button, Delete Button */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-stone-100 gap-2">
                      {/* Availability Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleProductAvailability(p.id)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition flex items-center space-x-1.5 shadow-xs border ${
                          p.is_available
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 active:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-300 active:bg-red-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${p.is_available ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
                        <span>{p.is_available ? 'Tersedia' : 'Habis'}</span>
                      </button>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="px-3.5 py-1.5 rounded-xl bg-matcha-leaf hover:bg-matcha-surface active:scale-95 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
                          title="Edit Menu"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Menu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProduct(p)}
                          className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition border border-red-200 active:scale-95"
                          title="Hapus / Pindahkan ke Tong Sampah"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP/TABLET TABLE VIEW (hidden md:block): Dengan overflow-x-auto agar tidak pernah terpotong */}
            <div className="hidden md:block bg-white rounded-2xl border border-stone-200 overflow-x-auto shadow-soft">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                  <tr>
                    <th className="p-3">Foto & Nama Menu</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Harga</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((p) => {
                    const isSoldOut = !p.is_available;
                    return (
                      <tr key={p.id} className={`hover:bg-stone-50/60 transition ${isSoldOut ? 'bg-red-50/25' : ''}`}>
                        <td className="p-3 flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden relative flex-shrink-0 bg-stone-100 border border-stone-200">
                            <Image
                              src={p.image}
                              alt={p.name}
                              fill
                              className={`object-cover ${isSoldOut ? 'grayscale contrast-75' : ''}`}
                            />
                            {isSoldOut && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="bg-red-600 text-white font-black text-[8px] px-1 rounded uppercase">
                                  Habis
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-matcha-leaf text-xs">{p.name}</span>
                              {isSoldOut && (
                                <span className="text-[9px] font-black bg-red-100 text-red-700 px-1.5 py-0.2 rounded border border-red-200">
                                  HABIS
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-400 line-clamp-1 max-w-xs">{p.description}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="bg-noodle-cream text-matcha-leaf px-2 py-0.5 rounded font-bold text-[10px]">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-spicy-ember">
                          Rp{p.price.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => toggleProductAvailability(p.id)}
                            title="Klik untuk ubah ketersediaan menu secara langsung"
                            className={`px-3 py-1 rounded-full text-[10px] font-black transition flex items-center space-x-1.5 shadow-xs border ${
                              p.is_available
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${p.is_available ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
                            <span>{p.is_available ? 'Tersedia' : 'Habis'}</span>
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(p)}
                              title="Edit Menu"
                              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-spicy-light text-stone-600 hover:text-spicy-ember flex items-center justify-center transition shadow-sm border border-stone-200/80 active:scale-95"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingProduct(p)}
                              title="Pindahkan ke Tong Sampah"
                              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-600 flex items-center justify-center transition shadow-sm border border-stone-200/80 active:scale-95"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Comprehensive Edit / Add Menu Modal */}
            {(editingProduct || isAddMode) && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-floating border border-stone-200 text-matcha-leaf relative animate-slideUp">
                  
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-spicy-ember text-white flex items-center justify-center flex-shrink-0">
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-matcha-leaf">
                          {isAddMode ? 'Tambah Menu Baru' : `Edit Menu: ${editingProduct?.name}`}
                        </h3>
                        <p className="text-[10px] text-stone-500">
                          Ubah nama, foto produk, harga, kategori, dan deskripsi
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setIsAddMode(false);
                      }}
                      className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProductForm} className="mt-4 space-y-4 text-xs">
                    
                    {/* Image Preview & Editor */}
                    <div className="p-3.5 bg-tofu-silkblaze rounded-xl border border-noodle-dark/60 space-y-3">
                      <div className="font-bold text-matcha-leaf flex items-center justify-between">
                        <span>Foto Produk:</span>
                        <span className="text-[10px] text-stone-500 font-normal">PNG / JPG resolusi tinggi</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden relative flex-shrink-0 bg-white border-2 border-spicy-ember/30 shadow-sm">
                          {formImage ? (
                            <Image src={formImage} alt="Preview Foto" fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 w-full space-y-2">
                          <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-bold text-stone-700 cursor-pointer hover:bg-noodle-cream transition shadow-sm text-xs">
                            <Upload className="w-3.5 h-3.5 text-spicy-ember" />
                            <span>Unggah Foto dari Komputer</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              className="hidden"
                            />
                          </label>
                          <div className="flex items-center justify-between text-[10px] text-stone-500">
                            <span>Atau gunakan URL / Link Google Drive:</span>
                            {isGoogleDriveLink(formImage) && (
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold text-[9px]">
                                ✓ Google Drive Terhubung
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="Path gambar atau link Google Drive (https://drive.google.com/...)"
                            value={formImage}
                            onChange={(e) => setFormImage(parseImageUrl(e.target.value))}
                            className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-stone-800 focus:outline-none focus:border-spicy-ember"
                          />
                          <p className="text-[9px] text-stone-400 italic">
                            *Dapat paste link share Google Drive langsung (Pastikan akses file: &quot;Siapa saja yang memiliki link&quot;).
                          </p>
                        </div>
                      </div>

                      {/* Quick preset selector */}
                      <div>
                        <div className="text-[10px] text-stone-500 mb-1.5">Pilih dari Koleksi Foto Resmi:</div>
                        <div className="flex space-x-2 overflow-x-auto pb-1 hide-scrollbar">
                          {presetImages.map((img) => (
                            <button
                              key={img.path}
                              type="button"
                              onClick={() => setFormImage(img.path)}
                              className={`flex-shrink-0 px-2 py-1 rounded text-[10px] font-bold border transition ${
                                formImage === img.path
                                  ? 'bg-spicy-ember text-white border-spicy-ember'
                                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                              }`}
                            >
                              {img.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Nama Menu */}
                    <div>
                      <label className="block font-bold text-matcha-leaf mb-1">
                        Nama Menu:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Bubur Kampiun Spesial"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                      />
                    </div>

                    {/* Harga & Kategori Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-matcha-leaf mb-1">
                          Harga Satuan (Rp):
                        </label>
                        <input
                          type="number"
                          required
                          step="500"
                          min="1000"
                          value={formPrice || ''}
                          onChange={(e) => setFormPrice(Number(e.target.value))}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-black text-spicy-ember focus:outline-none focus:border-spicy-ember"
                        />
                        {editingProduct && formPrice !== editingProduct.price && (
                          <div className="text-[10px] text-amber-700 mt-1 font-semibold">
                            Harga lama: Rp{editingProduct.price.toLocaleString('id-ID')}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-matcha-leaf mb-1">
                          Kategori:
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value as any)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                        >
                          <option value="Bubur">Bubur</option>
                          <option value="Kolak">Kolak</option>
                          <option value="Lopis">Lopis</option>
                          <option value="Kerupuk">Kerupuk</option>
                          <option value="Paket">Paket</option>
                        </select>
                      </div>
                    </div>

                    {/* Deskripsi Menu */}
                    <div>
                      <label className="block font-bold text-matcha-leaf mb-1">
                        Deskripsi Menu:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Komposisi bahan, rasa khas, dan penyajian..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                      />
                    </div>

                    {/* Status */}
                    <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-matcha-leaf text-xs">Status:</div>
                        <div className="text-[10px] text-stone-500">
                          {formAvailable
                            ? 'Menu siap dipesan pelanggan & kasir'
                            : 'Menu ditandai Habis (Tampil overlay HABIS di Customer & Kasir)'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormAvailable(!formAvailable)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer ${
                          formAvailable
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        <span>{formAvailable ? 'Tersedia' : 'Habis'}</span>
                      </button>
                    </div>

                    {/* Form Action Buttons */}
                    <div className="flex space-x-2 pt-2 border-t border-stone-200">
                      <button
                        type="submit"
                        className="flex-1 bg-spicy-ember hover:bg-spicy-hover text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition"
                      >
                        {isAddMode ? 'Simpan Menu Baru' : 'Simpan Perubahan Menu'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(null);
                          setIsAddMode(false);
                        }}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold text-xs transition"
                      >
                        Batal
                      </button>
                    </div>

                  </form>

                </div>
              </div>
            )}

            {/* OPSI TAMBAHAN / KEMASAN CUP BAWA PULANG (Edit, Hapus, Cancel, Save) */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-sm text-matcha-leaf">
                      Kemasan & Opsi Tambahan (Add-on)
                    </h3>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      (storeSettings.cupEnabled !== false)
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-200 text-stone-600 border border-stone-300'
                    }`}>
                      {(storeSettings.cupEnabled !== false) ? '🟢 Aktif di Menu' : '⚪ Non-Aktif / Terhapus'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Opsi kemasan berbayar yang tampil saat pelanggan memilih pesanan bungkus/takeaway.
                  </p>
                </div>

                {!cupEditMode && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleStartEditCup}
                      className="bg-stone-100 hover:bg-stone-200 text-matcha-leaf font-bold text-xs px-3.5 py-2 rounded-xl border border-stone-300 flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-matcha-leaf" />
                      <span>Edit Kemasan</span>
                    </button>
                    {(storeSettings.cupEnabled !== false) ? (
                      <button
                        type="button"
                        onClick={handleDeleteCup}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-3.5 py-2 rounded-xl border border-red-200 flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRestoreCup}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Aktifkan Kembali</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* View Mode */}
              {!cupEditMode ? (
                <div className="space-y-3">
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                      Preview Tampilan pada Popup Menu Pelanggan:
                    </div>
                    {/* Exact Card matching customer view */}
                    <div className="p-3 bg-noodle-cream/40 rounded-xl border border-noodle-dark flex items-center justify-between max-w-md shadow-xs">
                      <div>
                        <div className="font-bold text-xs text-matcha-leaf">
                          {storeSettings.cupName || 'Kemasan Cup Bawa Pulang'}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          +Rp{(storeSettings.cupFee ?? 1000).toLocaleString('id-ID')} / cup ({storeSettings.cupDescription || 'higienis & anti tumpah'})
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        (storeSettings.cupEnabled !== false) ? 'bg-spicy-ember text-white' : 'bg-stone-300 text-stone-600'
                      }`}>
                        Gunakan (+{Math.round((storeSettings.cupFee ?? 1000) / 1000)}rb)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="p-3 bg-white rounded-xl border border-stone-200">
                      <span className="text-stone-400 text-[10px] font-bold block uppercase">Nama Opsi</span>
                      <span className="font-bold text-matcha-leaf mt-0.5 block">{storeSettings.cupName || 'Kemasan Cup Bawa Pulang'}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-stone-200">
                      <span className="text-stone-400 text-[10px] font-bold block uppercase">Biaya Tambahan</span>
                      <span className="font-black text-spicy-ember mt-0.5 block">Rp{(storeSettings.cupFee ?? 1000).toLocaleString('id-ID')} / cup</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-stone-200">
                      <span className="text-stone-400 text-[10px] font-bold block uppercase">Status Toko</span>
                      <span className="font-bold text-stone-700 mt-0.5 block">
                        {(storeSettings.cupEnabled !== false) ? 'Aktif (Dapat dipilih pelanggan)' : 'Non-Aktif / Tersembunyi'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <div className="space-y-4 bg-stone-50/70 p-4 rounded-xl border border-amber-200">
                  <div className="text-[11px] font-extrabold text-amber-900 flex items-center space-x-1.5">
                    <span>✏️</span>
                    <span>Edit Data Kemasan (Perubahan Langsung Terlihat di Preview):</span>
                  </div>

                  {/* Realtime Live Preview */}
                  <div className="p-3 bg-noodle-cream/40 rounded-xl border border-noodle-dark flex items-center justify-between max-w-md shadow-xs">
                    <div>
                      <div className="font-bold text-xs text-matcha-leaf">
                        {cupForm.name || 'Kemasan Cup Bawa Pulang'}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        +Rp{(Number(cupForm.fee) || 0).toLocaleString('id-ID')} / cup ({cupForm.description || 'higienis & anti tumpah'})
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-spicy-ember text-white">
                      Gunakan (+{Math.round((Number(cupForm.fee) || 0) / 1000)}rb)
                    </span>
                  </div>

                  {/* Editable Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">
                        Nama Kemasan
                      </label>
                      <input
                        type="text"
                        value={cupForm.name}
                        onChange={(e) => setCupForm({ ...cupForm, name: e.target.value })}
                        placeholder="Kemasan Cup Bawa Pulang"
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">
                        Biaya Tambahan per Cup (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-stone-400">Rp</span>
                        <input
                          type="number"
                          step="500"
                          min="0"
                          value={cupForm.fee}
                          onChange={(e) => setCupForm({ ...cupForm, fee: Number(e.target.value) })}
                          placeholder="1000"
                          className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">
                        Keterangan / Subtitle
                      </label>
                      <input
                        type="text"
                        value={cupForm.description}
                        onChange={(e) => setCupForm({ ...cupForm, description: e.target.value })}
                        placeholder="higienis & anti tumpah"
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="text-xs font-bold text-stone-700 flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cupForm.enabled}
                        onChange={(e) => setCupForm({ ...cupForm, enabled: e.target.checked })}
                        className="w-4 h-4 text-spicy-ember rounded border-stone-300 focus:ring-spicy-ember"
                      />
                      <span>Tampilkan opsi kemasan ini pada pelanggan (Status: Aktif)</span>
                    </label>
                  </div>

                  {/* Cancel & Save Buttons */}
                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={handleCancelEditCup}
                      className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel (Batal)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCup}
                      className="bg-spicy-ember hover:bg-spicy-hover text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Save (Simpan Perubahan)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TABLES & QR MANAGEMENT */}
        {activeTab === 'tables' && (
          <div className="mt-6 space-y-4">
            
            {/* Header Action Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-base text-matcha-leaf">
                    Daftar Meja & QR Code Pelanggan
                  </h3>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                    {tables.length} Meja Terdaftar
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Setiap meja memiliki token keamanan unik untuk memvalidasi pesanan makan di tempat secara otomatis
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddTable}
                className="bg-spicy-ember hover:bg-spicy-hover text-white px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center space-x-1.5 shadow-md transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Meja</span>
              </button>
            </div>

            {/* Grid of Table Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((tbl) => (
                <div
                  key={tbl.id}
                  className="bg-white p-5 rounded-3xl border border-stone-200 shadow-soft text-center space-y-3 relative hover:shadow-md transition group"
                >
                  {/* Top Status & Quick Action Row */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleTableStatus(tbl.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition flex items-center space-x-1 border ${
                        tbl.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-stone-100 text-stone-500 border-stone-300 hover:bg-stone-200'
                      }`}
                      title="Klik untuk toggle status aktif meja"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${tbl.is_active ? 'bg-emerald-600 animate-pulse' : 'bg-stone-400'}`} />
                      <span>{tbl.is_active ? 'Aktif' : 'Non-Aktif'}</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTable(tbl)}
                        title="Edit Meja"
                        className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-spicy-light text-stone-600 hover:text-spicy-ember flex items-center justify-center transition border border-stone-200/80 active:scale-95"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTable(tbl)}
                        title="Hapus Meja"
                        className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-600 flex items-center justify-center transition border border-stone-200/80 active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* QR Box Visual */}
                  <div className="w-20 h-20 rounded-2xl bg-noodle-cream/70 mx-auto flex items-center justify-center text-matcha-leaf border border-noodle-dark/60 shadow-inner group-hover:scale-105 transition-transform">
                    <QrCode className="w-12 h-12" />
                  </div>

                  {/* Table Name & Token */}
                  <div>
                    <h3 className="font-extrabold text-base text-matcha-leaf">{tbl.table_number}</h3>
                    <p className="text-[11px] text-stone-400 font-mono mt-0.5">Token: {tbl.qr_token}</p>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setViewingQrTable(tbl)}
                      className="flex-1 bg-matcha-leaf hover:bg-matcha-surface text-tofu-silkblaze py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5 text-yolk-blaze" />
                      <span>Unduh QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditTable(tbl)}
                      className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 4: TONG SAMPAH (Hanya Restore & Hapus Permanen) */}
        {activeTab === 'trash' && (
          <div className="mt-6 space-y-4">
            {trashProducts.length === 0 ? (
              <div className="p-10 md:p-14 text-center bg-white rounded-3xl border border-stone-200 shadow-soft space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center shadow-inner">
                  <Trash2 className="w-8 h-8 stroke-1 text-stone-400" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-black text-sm text-matcha-leaf">Tong Sampah Kosong</h3>
                  <p className="text-xs text-stone-500">
                    Tidak ada menu yang dihapus. Seluruh menu saat ini aktif dan aman.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Header Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <div>
                    <h3 className="font-black text-sm text-matcha-leaf">
                      Menu di Tong Sampah ({trashProducts.length})
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Menu yang dihapus dapat dipulihkan kembali ke menu aktif atau dihapus secara permanen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsConfirmEmptyTrashOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Semua Tong Sampah</span>
                  </button>
                </div>

                {/* Mobile Card List (hidden md:block table) */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {trashProducts.map((tp) => (
                    <div
                      key={tp.id}
                      className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden relative flex-shrink-0 bg-stone-100 border border-stone-200">
                          {tp.image ? (
                            <Image src={tp.image} alt={tp.name} fill className="object-cover opacity-60 grayscale" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <UtensilsCrossed className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            {tp.category}
                          </span>
                          <h4 className="font-black text-xs text-stone-700 truncate mt-1 line-through decoration-red-400">
                            {tp.name}
                          </h4>
                          <p className="text-xs font-mono font-bold text-stone-500 mt-0.5">
                            Rp{tp.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <div className="text-[10px] text-stone-400 bg-stone-50 p-2 rounded-lg">
                        Dihapus pada: {tp.deleted_at ? new Date(tp.deleted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Baru saja'}
                      </div>

                      {/* Dua Tombol Aksi Standar: Pulihkan (Restore) & Hapus Permanen */}
                      <div className="flex space-x-2 pt-1 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => restoreProduct(tp.id)}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1 shadow-xs transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Pulihkan (Restore)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPermanentDeletingProduct(tp)}
                          className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs border border-red-200 transition flex items-center space-x-1 cursor-pointer"
                          title="Hapus Permanen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Permanen</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-soft">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-stone-50 border-b border-stone-200 font-bold text-stone-600">
                      <tr>
                        <th className="p-3">Foto &amp; Nama Menu</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3">Harga Terakhir</th>
                        <th className="p-3">Waktu Dihapus</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {trashProducts.map((tp) => (
                        <tr key={tp.id} className="hover:bg-stone-50/60 transition">
                          <td className="p-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0 bg-stone-100 border border-stone-200">
                                {tp.image ? (
                                  <Image src={tp.image} alt={tp.name} fill className="object-cover opacity-60 grayscale" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                                    <UtensilsCrossed className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-stone-700 line-through decoration-red-400">{tp.name}</div>
                                <div className="text-[10px] text-stone-400 font-mono">{tp.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {tp.category}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-stone-600">
                            Rp{tp.price.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-stone-500 text-[11px]">
                            {tp.deleted_at
                              ? new Date(tp.deleted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                              : 'Baru saja'}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => restoreProduct(tp.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs inline-flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Pulihkan (Restore)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPermanentDeletingProduct(tp)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold text-xs inline-flex items-center space-x-1 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Permanen</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PENGATURAN & SECURITY */}
        {activeTab === 'settings' && (
          <div className="mt-6 space-y-6">

            {/* Top Sub-Navigation Tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-stone-200/80 rounded-2xl border border-stone-300">
              <button
                type="button"
                onClick={() => setSettingsSubTab('security')}
                className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 ${
                  settingsSubTab === 'security'
                    ? 'bg-spicy-ember text-white shadow-md'
                    : 'bg-transparent text-stone-700 hover:bg-stone-300/50'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="whitespace-nowrap">Security & Pengguna</span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsSubTab('promo')}
                className={`flex-1 min-w-[190px] py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 ${
                  settingsSubTab === 'promo'
                    ? 'bg-spicy-ember text-white shadow-md'
                    : 'bg-transparent text-stone-700 hover:bg-stone-300/50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-yolk-blaze" />
                <span className="whitespace-nowrap">Banner Promosi (Carousel)</span>
                <span className="bg-yolk-blaze text-stone-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {promoBanners?.length || 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsSubTab('banner')}
                className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 ${
                  settingsSubTab === 'banner'
                    ? 'bg-spicy-ember text-white shadow-md'
                    : 'bg-transparent text-stone-700 hover:bg-stone-300/50'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Hero Banner & Profil</span>
              </button>
              {/* Hanya tampil jika akun yang login adalah OWNER */}
              {currentUser?.role === 'OWNER' && (
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('payment')}
                  className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 ${
                    settingsSubTab === 'payment'
                      ? 'bg-spicy-ember text-white shadow-md'
                      : 'bg-transparent text-stone-700 hover:bg-stone-300/50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Metode Pembayaran</span>
                </button>
              )}
            </div>

            {/* SUB-TAB 1: SECURITY & USER MANAGEMENT */}
            {settingsSubTab === 'security' && (
              <div className="space-y-5">
                
                {/* SESI AKUN AKTIF & KONTROL PENGGUNA (DIPINDAHKAN DARI TOP BAR SESUAI INSTRUKSI) */}
                <div className="bg-white p-5 rounded-2xl border-2 border-matcha-leaf/20 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-matcha-leaf text-tofu-silkblaze flex items-center justify-center font-black text-xl shadow-md border-2 border-noodle-cream flex-shrink-0">
                      {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'AF'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-black text-base text-matcha-leaf">
                          {currentUser ? currentUser.name : 'Pengguna Aktif'}
                        </h4>
                        <span className="bg-spicy-ember text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          {currentUser ? currentUser.role : 'ADMIN'}
                        </span>
                        <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Sesi Aktif</span>
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Username: <code className="font-bold text-matcha-leaf">@{currentUser?.username || '-'}</code> • Akses:{' '}
                        <span className="font-semibold text-stone-700">
                          {currentUser?.role === 'OWNER'
                            ? 'Owner / Pemilik Toko (Akses Penuh & Laporan Finansial)'
                            : currentUser?.role === 'ADMIN'
                            ? 'Admin Operasional (Menu, Meja, Banner & Staf)'
                            : 'Kasir / Staf Operasional'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full md:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 shadow-md transition active:scale-95"
                      title="Keluar dari akun Anda saat ini"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>

                {/* PREVIEW SIMULASI MOBILE PELANGGAN (DIPINDAHKAN KE SINI SESUAI INSTRUKSI) */}
                <div className="bg-gradient-to-r from-matcha-deep via-matcha-leaf to-[#012213] text-tofu-silkblaze p-5 rounded-2xl border border-matcha-surface shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-spicy-ember text-white flex items-center justify-center flex-shrink-0 shadow-md border border-white/20">
                      <Smartphone className="w-6 h-6 text-yolk-blaze animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-black text-sm text-white">
                          Simulasi Mobile Pelanggan (Customer Web App)
                        </h4>
                        <span className="bg-yolk-blaze text-stone-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                          Live Preview
                        </span>
                      </div>
                      <p className="text-xs text-noodle-cream/90 mt-1 max-w-xl leading-relaxed">
                        Lihat dan uji coba langsung pengalaman pemesanan bubur dari sudut pandang pelanggan di meja makan atau bungkus (takeaway).
                      </p>
                      <div className="flex items-center space-x-2 mt-1.5 text-[11px] font-mono text-noodle-cream/80">
                        <span>Link Web Pelanggan:</span>
                        <a
                          href="https://bubur-khalid.vercel.app"
                          target="_blank"
                          rel="noreferrer"
                          className="text-yolk-blaze hover:underline flex items-center space-x-1 font-bold"
                        >
                          <span>https://bubur-khalid.vercel.app</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setActiveView('customer')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-spicy-ember hover:bg-spicy-hover text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 shadow-md transition active:scale-95"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Buka Simulasi Sekarang</span>
                    </button>
                    <a
                      href="https://bubur-khalid.vercel.app"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition flex items-center justify-center"
                      title="Buka Web Pelanggan di Tab Baru"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Header Action Card */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
                  <div>
                    <h3 className="font-extrabold text-base text-matcha-leaf flex items-center space-x-2">
                      <Users className="w-5 h-5 text-spicy-ember" />
                      <span>Manajemen Akun Staf & Hak Akses</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Kelola peran, kredensial PIN/Password, dan hak akses untuk Owner, Admin, Kasir, dan Tim Dapur
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAddUser('ADMIN')}
                      className="px-3.5 py-2 bg-matcha-leaf hover:bg-matcha-leaf/90 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Tambah Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddUser('CASHIER')}
                      className="px-3.5 py-2 bg-spicy-ember hover:bg-spicy-hover text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Tambah Kasir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddUser('OWNER')}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Tambah Owner</span>
                    </button>
                  </div>
                </div>

                {/* Role Count Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
                    <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Pemilik Toko (Owner)</div>
                    <div className="text-2xl font-black text-amber-950 mt-0.5">
                      {users.filter((u) => u.role === 'OWNER').length}
                    </div>
                    <div className="text-[10px] text-amber-700 mt-1">Akses Penuh & Laporan Keuangan</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Admin Operasional</div>
                    <div className="text-2xl font-black text-emerald-950 mt-0.5">
                      {users.filter((u) => u.role === 'ADMIN').length}
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-1">Kelola Menu, Meja & Pengaturan</div>
                  </div>
                  <div className="bg-cyan-50 border border-cyan-200 p-3.5 rounded-xl">
                    <div className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider">Kasir Tablet (POS)</div>
                    <div className="text-2xl font-black text-cyan-950 mt-0.5">
                      {users.filter((u) => u.role === 'CASHIER').length}
                    </div>
                    <div className="text-[10px] text-cyan-700 mt-1">Akses POS Touchscreen & Cetak Struk</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 p-3.5 rounded-xl">
                    <div className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Tim Dapur (KDS)</div>
                    <div className="text-2xl font-black text-orange-950 mt-0.5">
                      {users.filter((u) => u.role === 'KITCHEN_STAFF').length}
                    </div>
                    <div className="text-[10px] text-orange-700 mt-1">Kitchen Display Global FIFO</div>
                  </div>
                </div>

                {/* Users Table Card */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-hidden">
                  <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-matcha-leaf">Daftar Pengguna Terdaftar ({users.length})</h4>
                      <p className="text-[11px] text-stone-500">Seluruh kredensial akun dilindungi hashing dan audit log aktif</p>
                    </div>
                    <span className="text-xs font-bold text-stone-500">Security Level: Strict RBAC</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
                        <tr>
                          <th className="p-3">Nama & Username</th>
                          <th className="p-3">Role / Hak Akses</th>
                          <th className="p-3">Kontak (Email / WA)</th>
                          <th className="p-3">PIN / Kredensial</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-stone-50/70 transition">
                            <td className="p-3 flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-noodle-cream text-matcha-leaf flex items-center justify-center font-black text-xs border border-noodle-dark flex-shrink-0">
                                {u.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-extrabold text-matcha-leaf text-xs">{u.name}</div>
                                <div className="text-[10px] text-stone-400 font-mono">@{u.username}</div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center space-x-1 border ${
                                  u.role === 'OWNER'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : u.role === 'ADMIN'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : u.role === 'CASHIER'
                                    ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                                    : 'bg-orange-100 text-orange-900 border-orange-300'
                                }`}
                              >
                                <span>{u.role === 'OWNER' ? '👑' : u.role === 'ADMIN' ? '🛡️' : u.role === 'CASHIER' ? '🏪' : '🍳'}</span>
                                <span>{u.role}</span>
                              </span>
                            </td>
                            <td className="p-3 text-stone-600">
                              <div className="font-medium">{u.email || '-'}</div>
                              <div className="text-[10px] text-stone-400">{u.phone || '-'}</div>
                            </td>
                            <td className="p-3">
                              <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-[10px] text-stone-700">
                                PIN: ••••{u.pin?.slice(-2) || '••'}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => toggleUserStatus(u.id)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black transition flex items-center space-x-1 border ${
                                  u.is_active
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-stone-100 text-stone-500 border-stone-300 hover:bg-stone-200'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-600 animate-pulse' : 'bg-stone-400'}`} />
                                <span>{u.is_active ? 'Aktif' : 'Non-Aktif'}</span>
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditUser(u)}
                                  title="Edit Pengguna"
                                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-spicy-light text-stone-600 hover:text-spicy-ember flex items-center justify-center transition shadow-xs border border-stone-200/80 active:scale-95"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {u.role !== 'OWNER' && (
                                  <button
                                    type="button"
                                    onClick={() => deleteUser(u.id)}
                                    title="Hapus Pengguna"
                                    className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-600 flex items-center justify-center transition shadow-xs border border-stone-200/80 active:scale-95"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* SUB-TAB: BANNER PROMOSI BERJALAN (CAROUSEL LOOPING) */}
            {settingsSubTab === 'promo' && (
              <div className="space-y-6">
                
                {/* Header Action Card */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-yolk-blaze" />
                      <h3 className="font-extrabold text-base text-matcha-leaf">
                        Manajemen Banner Promosi Berjalan (Carousel Looping)
                      </h3>
                      <span className="bg-spicy-light text-spicy-ember text-[10px] font-black px-2.5 py-0.5 rounded-full border border-spicy-ember/30">
                        {promoBanners?.length || 0} Banner Terdaftar
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
                      Banner ini tampil tepat di bawah menu unggulan pada web mobile pelanggan. Berjalan otomatis secara looping (minimal 3 banner disarankan). Mendukung foto dari <strong>Google Drive</strong> dan foto menu lokal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddPromo}
                    className="px-4 py-2.5 bg-spicy-ember hover:bg-spicy-hover active:scale-95 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Banner Promosi</span>
                  </button>
                </div>

                {/* Live Preview Box of Customer Carousel in Admin */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-matcha-leaf flex items-center space-x-1.5">
                        <span>📱 Pratinjau Langsung Carousel Pelanggan</span>
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Simulasi tampilan persis yang dilihat pelanggan di web mobile kasir
                      </p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Live Preview Aktif
                    </span>
                  </div>

                  {/* Customer Carousel Simulator */}
                  <div className="max-w-md mx-auto">
                    {promoBanners && promoBanners.filter(b => b.is_active).length > 0 ? (
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 shadow-lg text-white p-3.5 flex items-center justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            {promoBanners.find(b => b.is_active)?.badge && (
                              <span className="bg-spicy-ember text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                {promoBanners.find(b => b.is_active)?.badge}
                              </span>
                            )}
                            {promoBanners.find(b => b.is_active)?.discount_label && (
                              <span className="bg-yolk-blaze text-stone-950 text-[9px] font-black px-1.5 py-0.5 rounded">
                                {promoBanners.find(b => b.is_active)?.discount_label}
                              </span>
                            )}
                          </div>
                          <h5 className="text-sm font-black text-white">
                            {promoBanners.find(b => b.is_active)?.title}
                          </h5>
                          <p className="text-[11px] text-stone-300 line-clamp-2">
                            {promoBanners.find(b => b.is_active)?.subtitle}
                          </p>
                          <div className="pt-0.5 text-[10px] text-yolk-blaze font-bold flex items-center space-x-1">
                            <span>Pesan Sekarang</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                        <div className="w-20 h-20 shrink-0 relative rounded-xl overflow-hidden shadow-md border border-white/10 bg-stone-800">
                          <Image
                            src={parseImageUrl(promoBanners.find(b => b.is_active)?.image || '') || '/images/menu/bubur-kampiun.png'}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-stone-50 rounded-xl border border-dashed border-stone-300 text-stone-400 text-xs">
                        Belum ada banner promosi yang aktif. Aktifkan minimal 1 banner di bawah.
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Items Grid / Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {promoBanners && promoBanners.map((banner, idx) => (
                    <div
                      key={banner.id}
                      className={`bg-white rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition hover:shadow-md ${
                        banner.is_active ? 'border-stone-200' : 'border-stone-200 opacity-60 bg-stone-50/70'
                      }`}
                    >
                      <div>
                        {/* Image & Badges */}
                        <div className="relative w-full h-36 rounded-xl overflow-hidden bg-stone-100 mb-3 border border-stone-200">
                          <Image
                            src={parseImageUrl(banner.image) || '/images/menu/bubur-kampiun.png'}
                            alt={banner.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                            {banner.badge && (
                              <span className="bg-spicy-ember text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                {banner.badge}
                              </span>
                            )}
                            {banner.discount_label && (
                              <span className="bg-yolk-blaze text-stone-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                                {banner.discount_label}
                              </span>
                            )}
                          </div>
                          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                            Urutan #{idx + 1}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h4 className="font-extrabold text-sm text-stone-900 leading-tight">
                          {banner.title}
                        </h4>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                          {banner.subtitle}
                        </p>

                        {/* Google Drive Link Indicator */}
                        {isGoogleDriveLink(banner.image) && (
                          <div className="mt-2 inline-flex items-center space-x-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                            <span>📁 Google Drive Link</span>
                          </div>
                        )}
                      </div>

                      {/* Controls Footer */}
                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => togglePromoBannerStatus(banner.id)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                            banner.is_active
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${banner.is_active ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                          <span>{banner.is_active ? 'Aktif' : 'Nonaktif'}</span>
                        </button>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPromo(banner)}
                            className="p-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-spicy-light hover:text-spicy-ember transition cursor-pointer"
                            title="Edit Banner"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPromo(banner)}
                            className="p-1.5 rounded-lg bg-stone-100 text-stone-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                            title="Hapus Banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Google Drive Instruction Guide for Promo Banners */}
                <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <div className="font-extrabold flex items-center space-x-1.5 text-amber-950">
                    <span>💡 Tips Menggunakan Foto dari Google Drive:</span>
                  </div>
                  <p className="leading-relaxed">
                    Anda dapat langsung menyalin (copy) link share foto dari Google Drive Anda. Pastikan akses file Google Drive diatur ke <strong>&quot;Siapa saja yang memiliki link&quot; (Anyone with the link)</strong> agar pelanggan dapat melihat foto promosi secara lancar.
                  </p>
                </div>

              </div>
            )}

            {/* SUB-TAB 2 & 3: FORM PENGATURAN TOKO & PEMBAYARAN */}
            {settingsSubTab !== 'security' && settingsSubTab !== 'promo' && (
              <form onSubmit={handleSaveStoreForm} className="space-y-6">
                {settingsSubTab === 'banner' && (
                  <div className="space-y-6">
            
            {/* Live Preview Box of the Customer Header Banner */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-matcha-leaf">
                    Live Preview Banner Pelanggan
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Tampilan ini adalah simulasi tampilan langsung yang dilihat pelanggan di aplikasi web
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Pratinjau Nyata
                </span>
              </div>

              {/* Exact Simulation of the Customer Banner */}
              <div className="max-w-md mx-auto bg-matcha-leaf text-tofu-silkblaze p-5 rounded-[24px] shadow-card relative overflow-hidden border border-matcha-surface">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-spicy-ember flex items-center justify-center text-sm shadow-sm relative flex-shrink-0 border border-white/20">
                    {storeForm.storeLogo ? (
                      <Image
                        src={storeForm.storeLogo}
                        alt="Logo Toko"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span>🥣</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-noodle-cream leading-tight">{storeForm.storeName}</h4>
                    <span className="text-[10px] text-noodle-dark">{storeForm.storeTagline}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="max-w-[65%]">
                    <h3 className="text-lg font-black text-white leading-tight">
                      {storeForm.bannerTitle}
                    </h3>
                    <p className="text-[11px] text-noodle-cream/90 mt-1 leading-relaxed">
                      {storeForm.bannerSubtitle}
                    </p>
                  </div>
                  <div className="relative w-18 h-18 w-20 h-20 rounded-2xl overflow-hidden border-2 border-spicy-ember/40 shadow-card bg-tofu-silkblaze">
                    <Image
                      src={storeForm.bannerImage || '/images/menu/bubur-kampiun.png'}
                      alt="Banner Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="mt-3.5 inline-flex items-center space-x-1.5 bg-matcha-deep/80 px-2.5 py-0.5 rounded-full text-[10px] text-noodle-cream border border-matcha-surface">
                  <span className={`w-2 h-2 rounded-full ${storeForm.isStoreOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                  <span>{storeForm.isStoreOpen ? storeForm.operatingHours : 'Toko Sedang Tutup'}</span>
                </div>
              </div>
            </div>

            {/* Editor 0: Logo & Ikon Toko (Upload & Edit) */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft space-y-4">
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-matcha-leaf flex items-center space-x-2">
                    <span>🔘 Logo & Ikon Toko (Upload & Kelola)</span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Logo ini tampil otomatis di header aplikasi pelanggan, panel admin, tablet POS kasir, dan cetak struk
                  </p>
                </div>
                <span className="text-[10px] bg-spicy-light text-spicy-ember font-bold px-2.5 py-1 rounded-full border border-spicy-ember/30">
                  Ikon Resmi Toko
                </span>
              </div>

              <div className="p-4 bg-tofu-silkblaze rounded-xl border border-noodle-dark/60 flex flex-col sm:flex-row items-center gap-5">
                {/* Logo Preview Circle */}
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-3 border-spicy-ember shadow-md bg-spicy-ember flex items-center justify-center flex-shrink-0">
                  {storeForm.storeLogo ? (
                    <Image
                      src={storeForm.storeLogo}
                      alt="Logo Toko"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-3xl">🥣</span>
                  )}
                </div>

                <div className="flex-1 space-y-2.5 text-xs w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-spicy-ember hover:bg-spicy-hover text-white rounded-xl font-bold cursor-pointer transition shadow-sm text-xs active:scale-95">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah File Logo Baru</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setStoreForm({ ...storeForm, storeLogo: '/images/logo/bubur-khalid-logo.png' })}
                      className="px-3.5 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-bold rounded-xl transition text-xs shadow-2xs"
                    >
                      Gunakan Logo Bawaan
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-stone-600">
                        Path, URL Gambar, atau Link Google Drive:
                      </label>
                      {isGoogleDriveLink(storeForm.storeLogo || '') && (
                        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold text-[9px]">
                          ✓ Google Drive Terhubung
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Contoh: https://drive.google.com/file/d/.../view atau path logo"
                      value={storeForm.storeLogo || ''}
                      onChange={(e) => setStoreForm({ ...storeForm, storeLogo: parseImageUrl(e.target.value) })}
                      className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-stone-800 focus:outline-none focus:border-spicy-ember"
                    />
                    <p className="text-[9px] text-stone-400 mt-1 italic">
                      *Bisa paste link Google Drive langsung (Pastikan sharing: &quot;Anyone with the link&quot;).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor 1: Pengaturan Banner Beranda */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="font-extrabold text-sm text-matcha-leaf flex items-center space-x-2">
                  <span>🖼️ Edit Konten Banner Beranda Pelanggan</span>
                </h3>
                <p className="text-[11px] text-stone-500">Sesuaikan judul sambutan, teks promosi, dan foto utama banner</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-matcha-leaf mb-1">
                    Judul Sambutan Banner:
                  </label>
                  <input
                    type="text"
                    required
                    value={storeForm.bannerTitle}
                    onChange={(e) => setStoreForm({ ...storeForm, bannerTitle: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                  />
                </div>

                <div>
                  <label className="block font-bold text-matcha-leaf mb-1">
                    Sub-tagline Toko:
                  </label>
                  <input
                    type="text"
                    required
                    value={storeForm.storeTagline}
                    onChange={(e) => setStoreForm({ ...storeForm, storeTagline: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-medium text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-matcha-leaf mb-1">
                    Teks Deskripsi / Tagline Sambutan:
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={storeForm.bannerSubtitle}
                    onChange={(e) => setStoreForm({ ...storeForm, bannerSubtitle: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                  />
                </div>

                {/* Banner Photo Editor */}
                <div className="md:col-span-2 p-3.5 bg-tofu-silkblaze rounded-xl border border-noodle-dark/60 space-y-3">
                  <div className="font-bold text-matcha-leaf flex items-center justify-between flex-wrap gap-1">
                    <span>Foto Utama Banner:</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md border border-amber-300/60">
                      📐 Rekomendasi: 1200 × 600 px (Rasio 2:1)
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-14 rounded-xl overflow-hidden relative bg-white border border-stone-300 flex-shrink-0 shadow-sm">
                      <Image
                        src={storeForm.bannerImage || '/images/hero-banner-wide.jpg'}
                        alt="Foto Banner"
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-bold text-stone-700 cursor-pointer hover:bg-noodle-cream transition shadow-sm text-xs">
                        <Upload className="w-3.5 h-3.5 text-spicy-ember" />
                        <span>Unggah Foto Banner dari Komputer</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerFileChange}
                          className="hidden"
                        />
                      </label>
                      <div className="flex items-center justify-between text-[10px] text-stone-500">
                        <span>Atau gunakan URL / Link Google Drive:</span>
                        {isGoogleDriveLink(storeForm.bannerImage) && (
                          <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold text-[9px]">
                            ✓ Google Drive Terhubung
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Path gambar atau link Google Drive (https://drive.google.com/...)"
                        value={storeForm.bannerImage}
                        onChange={(e) => setStoreForm({ ...storeForm, bannerImage: parseImageUrl(e.target.value) })}
                        className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-stone-800 focus:outline-none focus:border-spicy-ember"
                      />
                      <p className="text-[9.5px] text-stone-500 leading-tight">
                        💡 <strong>Tips Komposisi:</strong> Resolusi ideal <strong>1200 × 600 px</strong> (Landscape rasio 2:1). Letakkan mangkuk bubur di <strong>sisi kanan</strong>, sisi kiri akan otomatis dibaurkan dengan teks judul & harga. Mendukung link share Google Drive.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-matcha-leaf mb-1">
                    Teks Jam Operasional:
                  </label>
                  <input
                    type="text"
                    value={storeForm.operatingHours}
                    onChange={(e) => setStoreForm({ ...storeForm, operatingHours: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                  />
                </div>

                <div>
                  <label className="block font-bold text-matcha-leaf mb-1">
                    Nomor WhatsApp Admin / Toko:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 085274281819 atau +6285274281819"
                    value={storeForm.adminWhatsapp || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, adminWhatsapp: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-matcha-leaf font-mono font-bold focus:outline-none focus:border-spicy-ember"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    *Digunakan untuk menerima konfirmasi bukti bayar dan pengiriman struk pesanan.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-matcha-leaf mb-1">
                    Status Toko:
                  </label>
                  <div className="flex items-center space-x-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const nextOpen = !storeForm.isStoreOpen;
                        setStoreForm((prev) => ({ ...prev, isStoreOpen: nextOpen }));
                        updateStoreSettings({ isStoreOpen: nextOpen });
                      }}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
                        storeForm.isStoreOpen
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-red-600 text-white shadow-sm'
                      }`}
                    >
                      {storeForm.isStoreOpen ? '✓ Toko Buka Menerima Pesanan' : '✕ Toko Tutup'}
                    </button>
                    <span className="text-[11px] text-stone-500">
                      {storeForm.isStoreOpen ? 'Pelanggan dapat melakukan checkout' : 'Pemesanan dinonaktifkan sementara'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center sm:justify-end pt-3 pb-6">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSaveStoreForm();
                }}
                disabled={isSavingStore}
                className="w-full sm:w-auto bg-spicy-ember hover:bg-spicy-hover active:scale-95 text-white px-8 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-75"
              >
                {isSavingStore ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{isSavingStore ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Banner Toko'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Editor 2: Pengaturan Metode Pembayaran (Hanya Akses Role OWNER) */}
        {settingsSubTab === 'payment' && currentUser?.role === 'OWNER' && (
                <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="font-extrabold text-sm text-matcha-leaf flex items-center space-x-2">
                  <span>💳 Pengaturan Metode Pembayaran Pelanggan</span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  Ubah nama tampilan, deskripsi penyedia e-wallet/bank, dan aktifkan atau nonaktifkan metode pembayaran
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* QRIS Digital Settings Card */}
                <div className={`p-4 rounded-xl border-2 transition ${storeForm.paymentMethods.qris.enabled ? 'border-spicy-ember/40 bg-spicy-light/20' : 'border-stone-200 bg-stone-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">📱</span>
                      <div>
                        <span className="font-bold text-xs text-matcha-leaf">QRIS Digital</span>
                        <div className="text-[10px] text-stone-500">Pembayaran non-tunai otomatis</div>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={storeForm.paymentMethods.qris.enabled}
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            paymentMethods: {
                              ...storeForm.paymentMethods,
                              qris: {
                                ...storeForm.paymentMethods.qris,
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-4 h-4 text-spicy-ember rounded"
                      />
                      <span className="ml-1.5 text-xs font-bold text-stone-700">Aktif</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-matcha-leaf mb-0.5">
                        Nama Tampilan Metode:
                      </label>
                      <input
                        type="text"
                        value={storeForm.paymentMethods.qris.name}
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            paymentMethods: {
                              ...storeForm.paymentMethods,
                              qris: {
                                ...storeForm.paymentMethods.qris,
                                name: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-matcha-leaf font-bold focus:outline-none focus:border-spicy-ember"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-matcha-leaf mb-0.5">
                        Deskripsi Provider / E-Wallet (Tampil di Tombol):
                      </label>
                      <input
                        type="text"
                        value={storeForm.paymentMethods.qris.description}
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            paymentMethods: {
                              ...storeForm.paymentMethods,
                              qris: {
                                ...storeForm.paymentMethods.qris,
                                description: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none focus:border-spicy-ember"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-matcha-leaf mb-0.5">
                        NMID (National Merchant ID):
                      </label>
                      <input
                        type="text"
                        value={storeForm.paymentMethods.qris.nmid || ''}
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            paymentMethods: {
                              ...storeForm.paymentMethods,
                              qris: {
                                ...storeForm.paymentMethods.qris,
                                nmid: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="Contoh: ID1020039485721"
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-matcha-leaf mb-1">
                        Gambar Barcode QRIS Toko:
                      </label>
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 rounded-xl border-2 border-stone-300 bg-white p-1 relative flex-shrink-0">
                          <Image
                            src={storeForm.paymentMethods.qris.qrisImageUrl || '/images/qr/qris-bubur-khalid.svg'}
                            alt="QRIS Preview"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            id="admin-qris-upload"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setStoreForm({
                                    ...storeForm,
                                    paymentMethods: {
                                      ...storeForm.paymentMethods,
                                      qris: {
                                        ...storeForm.paymentMethods.qris,
                                        qrisImageUrl: reader.result as string,
                                      },
                                    },
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label
                            htmlFor="admin-qris-upload"
                            className="inline-flex items-center space-x-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Ganti Gambar Barcode QRIS</span>
                          </label>

                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-stone-500">
                              <span>Atau gunakan URL / Link Google Drive:</span>
                              {isGoogleDriveLink(storeForm.paymentMethods.qris.qrisImageUrl || '') && (
                                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold text-[9px]">
                                  ✓ Google Drive Terhubung
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Path SVG/PNG atau link Google Drive (https://drive.google.com/...)"
                              value={storeForm.paymentMethods.qris.qrisImageUrl || ''}
                              onChange={(e) =>
                                setStoreForm({
                                  ...storeForm,
                                  paymentMethods: {
                                    ...storeForm.paymentMethods,
                                    qris: {
                                      ...storeForm.paymentMethods.qris,
                                      qrisImageUrl: parseImageUrl(e.target.value),
                                    },
                                  },
                                })
                              }
                              className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-stone-800 focus:outline-none focus:border-spicy-ember"
                            />
                          </div>

                          <p className="text-[10px] text-stone-400 mt-1">
                            Format JPG, PNG, atau SVG statis QRIS resmi dari bank/PJP Anda atau link Google Drive publik.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bayar di Kasir Settings Card */}
                <div className={`p-4 rounded-xl border-2 transition ${storeForm.paymentMethods.cash.enabled ? 'border-matcha-leaf/40 bg-noodle-cream/30' : 'border-stone-200 bg-stone-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">💵</span>
                      <div>
                        <span className="font-bold text-xs text-matcha-leaf">Bayar di Kasir (Tunai)</span>
                        <div className="text-[10px] text-stone-500">Pembayaran langsung saat datang</div>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={storeForm.paymentMethods.cash.enabled}
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            paymentMethods: {
                              ...storeForm.paymentMethods,
                              cash: {
                                ...storeForm.paymentMethods.cash,
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-4 h-4 text-spicy-ember rounded"
                      />
                      <span className="ml-1.5 text-xs font-bold text-stone-700">Aktif</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-matcha-leaf mb-0.5">
                        Nama Tampilan Metode:
                      </label>
                      <input
                        type="text"
                        value={storeForm.paymentMethods.cash.name}
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            paymentMethods: {
                              ...storeForm.paymentMethods,
                              cash: {
                                ...storeForm.paymentMethods.cash,
                                name: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-matcha-leaf font-bold focus:outline-none focus:border-spicy-ember"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-matcha-leaf mb-0.5">
                        Deskripsi Petunjuk:
                      </label>
                      <input
                        type="text"
                        value={storeForm.paymentMethods.cash.description}
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            paymentMethods: {
                              ...storeForm.paymentMethods,
                              cash: {
                                ...storeForm.paymentMethods.cash,
                                description: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none focus:border-spicy-ember"
                      />
                    </div>
                  </div>
                </div>

                {/* Transfer Bank & WhatsApp Admin Settings Card */}
                <div className={`p-4 rounded-xl border-2 transition ${storeForm.paymentMethods.transfer.enabled ? 'border-emerald-600/40 bg-emerald-50/20' : 'border-stone-200 bg-stone-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">🏦</span>
                      <div>
                        <span className="font-bold text-xs text-matcha-leaf">Transfer Bank & WhatsApp Admin</span>
                        <div className="text-[10px] text-stone-500">Kirim bukti transfer & antrean via WA</div>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={storeForm.paymentMethods.transfer.enabled}
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            paymentMethods: {
                              ...storeForm.paymentMethods,
                              transfer: {
                                ...storeForm.paymentMethods.transfer,
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="ml-1.5 text-xs font-bold text-stone-700">Aktif</span>
                    </label>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-matcha-leaf mb-0.5">
                        Nomor WhatsApp Admin (Menerima Bukti Bayar):
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 085274281819 atau +6285274281819"
                        value={storeForm.adminWhatsapp || ''}
                        onChange={(e) => setStoreForm({ ...storeForm, adminWhatsapp: e.target.value })}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:border-emerald-600"
                      />
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        *Pelanggan akan diarahkan ke nomor WhatsApp ini saat klik kirim bukti bayar
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                          Nama Bank:
                        </label>
                        <input
                          type="text"
                          value={storeForm.paymentMethods.transfer.bankName || ''}
                          onChange={(e) =>
                            setStoreForm({
                              ...storeForm,
                              paymentMethods: {
                                ...storeForm.paymentMethods,
                                transfer: {
                                  ...storeForm.paymentMethods.transfer,
                                  bankName: e.target.value,
                                },
                              },
                            })
                          }
                          placeholder="BCA"
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-matcha-leaf font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                          No. Rekening:
                        </label>
                        <input
                          type="text"
                          value={storeForm.paymentMethods.transfer.accountNumber || ''}
                          onChange={(e) =>
                            setStoreForm({
                              ...storeForm,
                              paymentMethods: {
                                ...storeForm.paymentMethods,
                                transfer: {
                                  ...storeForm.paymentMethods.transfer,
                                  accountNumber: e.target.value,
                                },
                              },
                            })
                          }
                          placeholder="8920192831"
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                          Atas Nama:
                        </label>
                        <input
                          type="text"
                          value={storeForm.paymentMethods.transfer.accountHolder || ''}
                          onChange={(e) =>
                            setStoreForm({
                              ...storeForm,
                              paymentMethods: {
                                ...storeForm.paymentMethods,
                                transfer: {
                                  ...storeForm.paymentMethods.transfer,
                                  accountHolder: e.target.value,
                                },
                              },
                            })
                          }
                          placeholder="BUBUR KHALID"
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

                    {/* Save Button for Payment - Centered on Mobile, right-aligned on Desktop */}
                    <div className="flex justify-center sm:justify-end pt-3 pb-8">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSaveStoreForm();
                        }}
                        disabled={isSavingStore}
                        className="w-full sm:w-auto bg-spicy-ember hover:bg-spicy-hover active:scale-95 text-white px-8 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-75"
                      >
                        {isSavingStore ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                        <span>{isSavingStore ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Pembayaran'}</span>
                      </button>
                    </div>
                  </div>
                )}

              </form>
            )}

          </div>
        )}

      </main>

      {/* Modal Preview Bukti Transfer WA */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-floating border border-stone-200 relative text-center">
            <button
              onClick={() => setPreviewProofUrl(null)}
              className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-left mb-3">
              <h3 className="font-extrabold text-sm text-matcha-leaf flex items-center space-x-1.5">
                <span>📎</span>
                <span>Bukti Transfer Pembayaran</span>
              </h3>
              <p className="text-[11px] text-stone-500">
                Foto struk / bukti m-banking yang diunggah oleh pelanggan
              </p>
            </div>
            <div className="relative w-full h-80 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-inner mb-3">
              <Image src={previewProofUrl} alt="Bukti Transfer" fill className="object-contain" />
            </div>
            <button
              onClick={() => setPreviewProofUrl(null)}
              className="w-full bg-matcha-leaf text-white py-2 rounded-xl text-xs font-bold"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Pengguna (Admin, Kasir, Owner, Dapur) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-floating border border-stone-200 relative">
            <button
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-spicy-ember text-white flex items-center justify-center text-lg font-bold shadow-sm">
                👤
              </div>
              <div>
                <h3 className="font-extrabold text-base text-matcha-leaf">
                  {editingUser
                    ? 'Edit Akun Pengguna'
                    : `Tambah ${userRole === 'OWNER' ? 'Owner' : userRole === 'CASHIER' ? 'Kasir' : userRole === 'ADMIN' ? 'Admin' : 'Staf'} Baru`}
                </h3>
                <p className="text-xs text-stone-500">Atur kredensial login, PIN, dan hak akses operasional</p>
              </div>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-matcha-leaf mb-1">
                  Nama Lengkap:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siska Oktaviani"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                />
              </div>

              {/* Username & Kontak */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-matcha-leaf mb-1">
                    Username Login:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="siska_kasir"
                    value={userUsername}
                    onChange={(e) => setUserUsername(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-matcha-leaf mb-1">
                    No. HP / WhatsApp:
                  </label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-matcha-leaf mb-1">
                  Email Akun:
                </label>
                <input
                  type="email"
                  placeholder="staf@buburkhalid.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-matcha-leaf mb-1.5">
                  Pilih Peran / Hak Akses (Role):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ADMIN', label: 'Admin', icon: '🛡️', desc: 'Menu, Meja & Pengaturan' },
                    { id: 'CASHIER', label: 'Kasir', icon: '🏪', desc: 'POS Tablet & Cetak Struk' },
                    { id: 'OWNER', label: 'Owner', icon: '👑', desc: 'Akses Penuh + Keuangan' },
                    { id: 'KITCHEN_STAFF', label: 'Tim Dapur', icon: '🍳', desc: 'Kitchen Display (KDS)' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setUserRole(r.id as UserRole)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-start space-x-2 ${
                        userRole === r.id
                          ? 'border-spicy-ember bg-spicy-light ring-2 ring-spicy-ember/20'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-base">{r.icon}</span>
                      <div>
                        <div className="font-extrabold text-xs text-matcha-leaf">{r.label}</div>
                        <div className="text-[10px] text-stone-500 leading-tight">{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kata Sandi Login */}
              <div>
                <label className="block text-xs font-bold text-matcha-leaf mb-1">
                  Kata Sandi Login (Password):
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showUserPassword ? 'text' : 'password'}
                    placeholder={editingUser ? 'Masukkan kata sandi baru (atau biarkan yang lama)' : 'Kata sandi minimal 4 karakter'}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 pr-10 text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember placeholder:font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-3 text-stone-400 hover:text-matcha-leaf transition p-0.5"
                    title={showUserPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  *Digunakan untuk login di browser desktop & mobile bersama Email / Username
                </p>
              </div>

              {/* PIN Akses */}
              <div>
                <label className="block text-xs font-bold text-matcha-leaf mb-1">
                  PIN Akses Kasir / Security (6 Digit):
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="123456"
                  value={userPin}
                  onChange={(e) => setUserPin(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold tracking-widest text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  *Digunakan untuk verifikasi otorisasi kasir dan pintu keamanan Owner
                </p>
              </div>

              {/* Status Toggle */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-matcha-leaf">Status Akun:</div>
                  <div className="text-[10px] text-stone-500">
                    {userActive ? 'Akun aktif dan dapat masuk sistem' : 'Akun dinonaktifkan sementara'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUserActive(!userActive)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                    userActive ? 'bg-emerald-600 text-white' : 'bg-stone-400 text-white'
                  }`}
                >
                  {userActive ? 'Aktif' : 'Non-Aktif'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="submit"
                  className="flex-1 bg-spicy-ember hover:bg-spicy-hover text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition"
                >
                  {editingUser ? 'Simpan Perubahan Akun' : 'Daftarkan Pengguna Baru'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: TAMBAH & EDIT MEJA (Bisa Edit, Tambah, Batal/Cancel, Close) */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 relative shadow-floating animate-slideUp space-y-4">
            
            {/* Modal Header & Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-spicy-light text-spicy-ember">
                  <QrCode className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-matcha-leaf">
                    {editingTable ? `Edit ${editingTable.table_number}` : 'Tambah Meja Baru'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {editingTable ? 'Perbarui informasi meja dan token QR' : 'Daftarkan meja baru untuk pemesanan dine-in'}
                  </p>
                </div>
              </div>

              {/* Close Button (X) */}
              <button
                type="button"
                onClick={() => setIsTableModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-matcha-leaf mb-1">
                  Nomor / Nama Meja:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Meja 07, Meja VIP 1"
                  value={tableNumberInput}
                  onChange={(e) => setTableNumberInput(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-matcha-leaf">
                    Token Keamanan QR Code:
                  </label>
                  <button
                    type="button"
                    onClick={() => setTableQrTokenInput(`BK-TBL-${Date.now().toString().slice(-4)}-SEC`)}
                    className="text-[10px] text-spicy-ember hover:underline font-bold"
                  >
                    🔄 Generate Token
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="BK-TBL-07-SEC"
                  value={tableQrTokenInput}
                  onChange={(e) => setTableQrTokenInput(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-stone-800 focus:outline-none focus:border-spicy-ember"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  *Token ini disematkan pada link QR Code untuk mencegah manipulasi nomor meja
                </p>
              </div>

              {/* Status Toggle */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-matcha-leaf">Status Operasional Meja:</div>
                  <div className="text-[10px] text-stone-500">
                    {tableActiveInput ? 'Meja siap digunakan pelanggan' : 'Meja dinonaktifkan sementara'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTableActiveInput(!tableActiveInput)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                    tableActiveInput ? 'bg-emerald-600 text-white' : 'bg-stone-400 text-white'
                  }`}
                >
                  {tableActiveInput ? 'Aktif' : 'Non-Aktif'}
                </button>
              </div>

              {/* Action Buttons: Simpan & Batal (Cancel) */}
              <div className="flex space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="submit"
                  className="flex-1 bg-spicy-ember hover:bg-spicy-hover text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition active:scale-95"
                >
                  {editingTable ? 'Simpan Perubahan' : 'Tambah Meja Sekarang'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition"
                >
                  Batal
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: KONFIRMASI HAPUS MEJA (Bisa Hapus, Batal/Cancel, Close) */}
      {deletingTable && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative shadow-floating animate-slideUp space-y-4 text-center">
            
            {/* Close Button (X) */}
            <button
              type="button"
              onClick={() => setDeletingTable(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center text-xl shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-matcha-leaf">
                Hapus {deletingTable.table_number}?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Apakah Anda yakin ingin menghapus meja ini? Meja tidak akan lagi tersedia untuk dipindai atau dipilih oleh pelanggan.
              </p>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={handleConfirmDeleteTable}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition active:scale-95"
              >
                Ya, Hapus Meja
              </button>
              <button
                type="button"
                onClick={() => setDeletingTable(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition"
              >
                Batal
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: UNDUH & CETAK QR CODE STIKER (Bisa Cetak, Unduh, Close/Tutup) */}
      {viewingQrTable && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative shadow-floating animate-slideUp space-y-4 text-center">
            
            {/* Close Button (X) */}
            <button
              type="button"
              onClick={() => setViewingQrTable(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-spicy-ember bg-spicy-light px-2.5 py-0.5 rounded-full">
                Stiker Meja Resmi
              </span>
              <h3 className="font-black text-lg text-matcha-leaf mt-1">
                QR Code {viewingQrTable.table_number}
              </h3>
            </div>

            {/* Printable QR Sticker Preview */}
            <div className="bg-tofu-silkblaze p-5 rounded-2xl border-2 border-dashed border-stone-300 space-y-3 shadow-inner">
              <div className="flex items-center justify-center space-x-2 text-xs font-black text-matcha-leaf">
                <div className="w-5 h-5 rounded-full overflow-hidden relative border border-stone-200">
                  <Image src={storeSettings.storeLogo || '/images/logo/bubur-khalid-logo.png'} alt="Logo" fill className="object-cover" />
                </div>
                <span>BUBUR KHALID</span>
              </div>
              <div className="w-48 h-48 bg-white rounded-2xl mx-auto p-3 shadow-md border border-stone-200 flex flex-col items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={`QR Code ${viewingQrTable.table_number}`} className="w-40 h-40 object-contain rounded-lg" />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-spicy-ember border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <span className="text-[10px] font-bold text-matcha-leaf mt-1">{viewingQrTable.table_number}</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold text-matcha-leaf">
                  Pindai untuk Pesan di {viewingQrTable.table_number}
                </div>
                <div className="text-[10px] text-stone-500 font-mono">
                  bubur-khalid.vercel.app/?table={encodeURIComponent(viewingQrTable.table_number)}
                </div>
              </div>
            </div>

            {/* Download & Print Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handlePrintSticker}
                className="w-full bg-matcha-leaf hover:bg-matcha-surface text-tofu-silkblaze py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 transition active:scale-[0.98]"
              >
                <Printer className="w-3.5 h-3.5 text-yolk-blaze" />
                <span>Cetak Stiker Meja Sekarang</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQrPng}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Gambar QR (PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingQrTable(null)}
                className="w-full text-stone-500 hover:text-stone-800 py-1 text-xs font-semibold"
              >
                Tutup Jendela
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: TAMBAH & EDIT BANNER PROMOSI BERJALAN */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 relative shadow-floating animate-slideUp space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Header & Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-spicy-light text-spicy-ember">
                  <Sparkles className="w-5 h-5 text-yolk-blaze" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-matcha-leaf">
                    {editingPromo ? 'Edit Banner Promosi' : 'Tambah Banner Promosi Baru'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Banner ini akan berputar otomatis di bawah menu unggulan
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4">
              
              {/* Judul Banner */}
              <div>
                <label className="block text-xs font-bold text-matcha-leaf mb-1">
                  Judul Promo: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Paket Kampiun Komplit"
                  value={promoTitleInput}
                  onChange={(e) => setPromoTitleInput(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                />
              </div>

              {/* Deskripsi Promo */}
              <div>
                <label className="block text-xs font-bold text-matcha-leaf mb-1">
                  Deskripsi / Keterangan Promo: <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Kampiun + Lopis + Kerupuk lebih hemat Rp3.000! Cocok untuk santap sore."
                  value={promoSubtitleInput}
                  onChange={(e) => setPromoSubtitleInput(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                />
              </div>

              {/* Grid: Badge & Discount Label */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-matcha-leaf mb-1">
                    Badge Label (Pill Atas):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 🔥 HEMAT 20%"
                    value={promoBadgeInput}
                    onChange={(e) => setPromoBadgeInput(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-matcha-leaf mb-1">
                    Label Potongan:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Hemat Rp3.000"
                    value={promoDiscountLabelInput}
                    onChange={(e) => setPromoDiscountLabelInput(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                  />
                </div>
              </div>

              {/* Image Input (Google Drive & Local Menu) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-matcha-leaf">
                  URL Foto Banner (Mendukung Link Google Drive):
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing atau /images/menu/..."
                  value={promoImageInput}
                  onChange={(e) => setPromoImageInput(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                />

                {/* Google Drive Link Help */}
                <p className="text-[10px] text-stone-500">
                  📁 Cukup salin link share foto dari Google Drive Anda (pastikan akses: <em>&quot;Siapa saja yang memiliki link&quot;</em>).
                </p>

                {/* Quick Presets from Official Menu */}
                <div className="pt-1">
                  <span className="text-[10px] text-stone-500 font-bold block mb-1.5">
                    Atau gunakan foto menu resmi:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Bubur Kampiun', path: '/images/menu/bubur-kampiun.png' },
                      { label: 'Kolak Katan', path: '/images/menu/kolak-katan.png' },
                      { label: 'Kacang Padi', path: '/images/menu/kacang-padi.png' },
                      { label: 'Paket Hemat', path: '/images/menu/campur-3-macam.png' },
                      { label: 'Lopis', path: '/images/menu/lopis.png' },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPromoImageInput(item.path)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition cursor-pointer font-bold ${
                          promoImageInput === item.path
                            ? 'bg-spicy-ember text-white border-spicy-ember shadow-xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Image Preview */}
                <div className="mt-2 p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden relative bg-stone-200 shrink-0 border border-stone-300 shadow-xs">
                    <Image
                      src={parseImageUrl(promoImageInput) || '/images/menu/bubur-kampiun.png'}
                      alt="Pratinjau Foto"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-matcha-leaf">Pratinjau Foto Banner</div>
                    <div className="text-[10px] text-stone-500">
                      {isGoogleDriveLink(promoImageInput)
                        ? '✓ Terdeteksi link Google Drive, langsung diproses CDN Google'
                        : 'Foto siap ditampilkan'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-matcha-leaf">Status Banner:</div>
                  <div className="text-[10px] text-stone-500">
                    {promoActiveInput ? 'Banner aktif dan tampil di web mobile' : 'Banner disembunyikan sementara'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPromoActiveInput(!promoActiveInput)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                    promoActiveInput ? 'bg-emerald-600 text-white' : 'bg-stone-400 text-white'
                  }`}
                >
                  {promoActiveInput ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="submit"
                  className="flex-1 bg-spicy-ember hover:bg-spicy-hover text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  {editingPromo ? 'Simpan Perubahan Banner' : 'Publikasikan Banner Promosi'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS BANNER PROMOSI */}
      {deletingPromo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative shadow-floating animate-slideUp text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-base text-matcha-leaf">
                Hapus Banner Promosi?
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Anda yakin ingin menghapus banner <strong>&quot;{deletingPromo.title}&quot;</strong>? Banner tidak akan lagi tampil di web pelanggan.
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  deletePromoBanner(deletingPromo.id);
                  setDeletingPromo(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                Ya, Hapus Banner
              </button>
              <button
                type="button"
                onClick={() => setDeletingPromo(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI PINDAHKAN MENU KE TONG SAMPAH (SOFT DELETE) */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative shadow-floating animate-slideUp text-center space-y-4">
            <button
              type="button"
              onClick={() => setDeletingProduct(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Soft Delete Menu
              </span>
              <h3 className="font-black text-base text-matcha-leaf">
                Pindahkan ke Tong Sampah?
              </h3>
              <p className="text-xs text-stone-600 font-semibold">
                &quot;{deletingProduct.name}&quot;
              </p>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Menu ini akan disembunyikan dari kasir dan pembeli. Data tidak langsung musnah dan dapat dipulihkan kapan saja di tab <strong>Tong Sampah</strong>.
              </p>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  softDeleteProduct(deletingProduct.id);
                  setDeletingProduct(null);
                }}
                className="flex-1 bg-spicy-ember hover:bg-spicy-hover text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                Pindahkan ke Tong Sampah
              </button>
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS MENU PERMANEN */}
      {permanentDeletingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative shadow-floating animate-slideUp text-center space-y-4">
            <button
              type="button"
              onClick={() => setPermanentDeletingProduct(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                Peringatan: Tindakan Permanen
              </span>
              <h3 className="font-black text-base text-red-700">
                Hapus Menu Permanen?
              </h3>
              <p className="text-xs text-stone-600 font-semibold">
                &quot;{permanentDeletingProduct.name}&quot;
              </p>
              <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl leading-relaxed">
                Data menu akan dihapus selamanya dari database server dan tidak dapat dipulihkan kembali.
              </p>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  hardDeleteProduct(permanentDeletingProduct.id);
                  setPermanentDeletingProduct(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                Ya, Hapus Permanen
              </button>
              <button
                type="button"
                onClick={() => setPermanentDeletingProduct(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI KOSONGKAN SEMUA TONG SAMPAH */}
      {isConfirmEmptyTrashOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative shadow-floating animate-slideUp text-center space-y-4">
            <button
              type="button"
              onClick={() => setIsConfirmEmptyTrashOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                Tindakan Tidak Dapat Dibatalkan
              </span>
              <h3 className="font-black text-base text-red-700">
                Kosongkan Semua Tong Sampah?
              </h3>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Seluruh {trashProducts.length} menu yang ada di dalam Tong Sampah akan dihapus permanen dari database.
              </p>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  emptyProductTrash();
                  setIsConfirmEmptyTrashOpen(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                Ya, Kosongkan Semua
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmEmptyTrashOpen(false)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PENGATURAN JAM BUKA & STATUS OPERASIONAL TOKO (AUTO-SAVE) */}
      {isStoreHoursModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 relative shadow-floating animate-slideUp text-left space-y-5">
            {/* Close Button X */}
            <button
              type="button"
              onClick={() => setIsStoreHoursModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
              title="Tutup & Selesai (Tersimpan Otomatis)"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs border border-emerald-200 flex-shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-matcha-leaf">
                  Jam Buka &amp; Status Toko
                </h3>
                <p className="text-[11px] text-stone-500">
                  Perubahan tersimpan otomatis seketika ke cloud tanpa tombol save.
                </p>
              </div>
            </div>

            {/* STATUS TOKO: 3 PILIHAN UTAMA (Buka, Libur, Tutup) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-matcha-leaf">
                Status Operasional Toko:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. BUKA NORMAL */}
                <button
                  type="button"
                  onClick={() => {
                    updateStoreSettings({ isStoreOpen: true, isStoreHoliday: false });
                    setStoreForm((prev) => ({ ...prev, isStoreOpen: true }));
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    storeSettings.isStoreOpen && !storeSettings.isStoreHoliday
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">🟢</span>
                    {storeSettings.isStoreOpen && !storeSettings.isStoreHoliday && (
                      <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-black text-xs">Buka Normal</div>
                    <div className="text-[10px] text-stone-500 leading-tight mt-0.5">Menerima pesanan</div>
                  </div>
                </button>

                {/* 2. TOMBOL LIBUR (Sesuai Permintaan User) */}
                <button
                  type="button"
                  onClick={() => {
                    updateStoreSettings({ isStoreOpen: false, isStoreHoliday: true });
                    setStoreForm((prev) => ({ ...prev, isStoreOpen: false }));
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    storeSettings.isStoreHoliday
                      ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">🏖️</span>
                    {storeSettings.isStoreHoliday && (
                      <span className="text-[9px] font-black uppercase bg-amber-600 text-white px-1.5 py-0.2 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-black text-xs text-amber-950">Toko Libur</div>
                    <div className="text-[10px] text-amber-800 leading-tight mt-0.5">Info libur ke pembeli</div>
                  </div>
                </button>

                {/* 3. TUTUP SEMENTARA */}
                <button
                  type="button"
                  onClick={() => {
                    updateStoreSettings({ isStoreOpen: false, isStoreHoliday: false });
                    setStoreForm((prev) => ({ ...prev, isStoreOpen: false }));
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    !storeSettings.isStoreOpen && !storeSettings.isStoreHoliday
                      ? 'bg-red-50 border-red-500 text-red-900 ring-2 ring-red-500/20 shadow-xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">🔒</span>
                    {!storeSettings.isStoreOpen && !storeSettings.isStoreHoliday && (
                      <span className="text-[9px] font-black uppercase bg-red-600 text-white px-1.5 py-0.2 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-black text-xs text-red-900">Tutup</div>
                    <div className="text-[10px] text-stone-500 leading-tight mt-0.5">Tutup sementara</div>
                  </div>
                </button>
              </div>
            </div>

            {/* FORM ALASAN LIBUR (Tampil jika Toko Libur aktif) */}
            {storeSettings.isStoreHoliday && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 animate-fadeIn">
                <label className="block text-xs font-bold text-amber-950">
                  Pesan Libur untuk Pelanggan (Muncul di Web):
                </label>
                <input
                  type="text"
                  value={storeSettings.holidayReason || ''}
                  placeholder="Contoh: Toko libur hari ini, buka kembali besok jam 16:00 WIB"
                  onChange={(e) => {
                    const val = e.target.value;
                    updateStoreSettings({ holidayReason: val });
                  }}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-amber-950 font-medium focus:outline-none focus:border-amber-600"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-amber-800 font-semibold">Preset Cepat:</span>
                  {[
                    'Libur hari ini, buka kembali besok.',
                    'Toko sedang libur akhir pekan.',
                    'Libur cuti bersama / hari raya.',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => updateStoreSettings({ holidayReason: preset })}
                      className="text-[10px] bg-white hover:bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg border border-amber-200 font-medium transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* EDIT JAM BUKA OPERASIONAL TOKO */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-matcha-leaf">
                Jam Operasional / Jam Buka:
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={storeSettings.operatingHours || ''}
                  placeholder="Contoh: 16:00 - 22:00 WIB"
                  onChange={(e) => {
                    const val = e.target.value;
                    updateStoreSettings({ operatingHours: val });
                    setStoreForm((prev) => ({ ...prev, operatingHours: val }));
                  }}
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-matcha-leaf focus:outline-none focus:border-spicy-ember focus:bg-white transition"
                />
              </div>

              {/* Quick Hours Preset Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-stone-400 font-semibold self-center">Pilihan Cepat:</span>
                {[
                  '16:00 - 22:00',
                  '15:00 - 23:00',
                  '09:00 - 21:00',
                  '16:00 - 00:00',
                  '24 Jam',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      updateStoreSettings({ operatingHours: chip });
                      setStoreForm((prev) => ({ ...prev, operatingHours: chip }));
                    }}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
                      storeSettings.operatingHours === chip
                        ? 'bg-spicy-ember text-white border-spicy-ember'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Save Indicator Info */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-[11px] text-emerald-800">
              <span className="text-emerald-600 font-black">✓</span>
              <span>
                <strong>Tersimpan Otomatis:</strong> Setiap perubahan jam buka atau status toko langsung aktif dan tersimpan ke cloud Supabase.
              </span>
            </div>

            {/* Close Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsStoreHoursModalOpen(false)}
                className="w-full bg-matcha-leaf hover:bg-matcha-surface text-white py-3 rounded-2xl font-black text-xs shadow-md transition cursor-pointer active:scale-98"
              >
                Selesai &amp; Tutup Pengaturan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
