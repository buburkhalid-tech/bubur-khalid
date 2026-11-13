'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useApp } from '@/lib/store/AppContext';
import { Product, Order, PromoBanner } from '@/lib/types';
import { parseImageUrl } from '@/lib/utils/image';
import { formatIndonesianWhatsappNumber, DEFAULT_ADMIN_WHATSAPP } from '@/lib/utils/phone';
import { supabase } from '@/lib/supabase/client';
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  X,
  CheckCircle2,
  Clock,
  QrCode,
  Store,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  Receipt,
  UtensilsCrossed,
  Sparkles,
  MessageCircle,
  Copy,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  MapPin,
  Flame,
  Tag,
  ChevronDown,
  Share2,
  Heart,
  Info,
  FileText,
  Check,
  Grid,
  List,
} from 'lucide-react';

export function CustomerView() {
  const {
    products,
    customerCart,
    addToCustomerCart,
    updateCustomerCartQty,
    toggleCustomerCartCup,
    customerCartTotal,
    customerServiceType,
    setCustomerServiceType,
    selectedTable,
    setSelectedTable,
    tables,
    createCustomerOrder,
    attachTransferProof,
    orders,
    storeSettings,
    promoBanners,
    users,
  } = useApp();

  // Active Promo Banners & Looping Carousel State
  const activePromoBanners = useMemo(() => {
    return (promoBanners || []).filter((b) => b.is_active);
  }, [promoBanners]);

  const [currentPromoIdx, setCurrentPromoIdx] = useState<number>(0);
  const [isPromoPaused, setIsPromoPaused] = useState<boolean>(false);
  const [promoTouchStart, setPromoTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handlePromoTouchStart = (e: React.TouchEvent) => {
    setIsPromoPaused(true);
    setPromoTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handlePromoTouchEnd = (e: React.TouchEvent) => {
    setIsPromoPaused(false);
    if (!promoTouchStart) return;
    const diffX = promoTouchStart.x - e.changedTouches[0].clientX;
    const diffY = promoTouchStart.y - e.changedTouches[0].clientY;

    // Hanya ganti slide jika gestur murni horizontal (bukan sedang scroll vertikal halaman)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40 && activePromoBanners.length > 1) {
      if (diffX > 0) {
        setCurrentPromoIdx((prev) => (prev + 1) % activePromoBanners.length);
      } else {
        setCurrentPromoIdx((prev) => (prev - 1 + activePromoBanners.length) % activePromoBanners.length);
      }
    }
    setPromoTouchStart(null);
  };

  // Auto-play Looping Carousel every 3.8 seconds
  useEffect(() => {
    if (activePromoBanners.length <= 1 || isPromoPaused) return;
    const timer = setInterval(() => {
      setCurrentPromoIdx((prev) => (prev + 1) % activePromoBanners.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [activePromoBanners.length, isPromoPaused]);

  // Handle safe bounds when banners change
  useEffect(() => {
    if (currentPromoIdx >= activePromoBanners.length && activePromoBanners.length > 0) {
      setCurrentPromoIdx(0);
    }
  }, [activePromoBanners.length, currentPromoIdx]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [modalUseCup, setModalUseCup] = useState<boolean>(customerServiceType === 'TAKEAWAY');
  const [modalNotes, setModalNotes] = useState<string>('');

  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'CASH' | 'TRANSFER'>('TRANSFER');
  const [transferProof, setTransferProof] = useState<string>('');

  // Active order live tracking (Hanya aktif setelah pelanggan selesai memesan)
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);

  // User interactions: Save / Favorites, Share, and Order Feedback
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [showProductInfo, setShowProductInfo] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [transferConfirmationOrder, setTransferConfirmationOrder] = useState<Order | null>(null);
  const [isSharingOrderPNG, setIsSharingOrderPNG] = useState<boolean>(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Live Tracking Modal & Code Input States
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState<boolean>(false);
  const [trackingCodeInput, setTrackingCodeInput] = useState<string>('');
  const [isSearchingTracking, setIsSearchingTracking] = useState<boolean>(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const handleTrackByCode = async (codeToSearch?: string) => {
    const raw = (codeToSearch || trackingCodeInput).trim().toUpperCase();
    if (!raw) {
      setTrackingError('Harap masukkan nomor antrean atau kode unik dari struk Anda');
      return;
    }
    setTrackingError(null);
    setIsSearchingTracking(true);

    // 1. Cek di state lokal (case-insensitive)
    const localFound = (orders || []).find(
      (o) =>
        o.queue_number.toUpperCase() === raw ||
        o.id.toUpperCase() === raw ||
        o.id.toUpperCase().endsWith(raw)
    );

    if (localFound) {
      setActiveTrackingOrder(localFound);
      setIsTrackingModalOpen(false);
      setIsSearchingTracking(false);
      triggerToast(`Pesanan ${localFound.queue_number} berhasil ditemukan! 🔍`);
      return;
    }

    // 2. Query Supabase Cloud langsung (misal pesanan kasir POS atau device lain)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`queue_number.ilike.${raw},id.ilike.${raw}`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const mappedOrder: Order = {
          ...data,
          subtotal: Number(data.subtotal),
          total_amount: Number(data.total_amount),
          cup_fee: Number(data.cup_fee || 0),
          discount: Number(data.discount || 0),
        };
        setActiveTrackingOrder(mappedOrder);
        setIsTrackingModalOpen(false);
        setIsSearchingTracking(false);
        triggerToast(`Pesanan ${mappedOrder.queue_number} berhasil ditemukan! 🔍`);
        return;
      }
    } catch (e) {
      console.warn('Track order cloud query error:', e);
    }

    setIsSearchingTracking(false);
    setTrackingError(`Pesanan dengan kode "${raw}" tidak ditemukan. Pastikan kode sesuai struk (contoh: OT-001 atau WB-002).`);
  };

  // Sinkronisasi otomatis Live Tracking dengan Data Pesanan (AppContext + Supabase)
  useEffect(() => {
    if (!activeTrackingOrder) return;
    const matched = (orders || []).find(
      (o) => o.id === activeTrackingOrder.id || o.queue_number === activeTrackingOrder.queue_number
    );
    if (
      matched &&
      (matched.order_status !== activeTrackingOrder.order_status ||
        matched.payment_status !== activeTrackingOrder.payment_status ||
        matched.transfer_proof_image !== activeTrackingOrder.transfer_proof_image)
    ) {
      setActiveTrackingOrder(matched);
    }
  }, [orders, activeTrackingOrder]);

  useEffect(() => {
    if (!activeTrackingOrder) return;
    const orderId = activeTrackingOrder.id;
    let isMounted = true;

    const fetchLatestOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        if (!error && data && isMounted) {
          setActiveTrackingOrder((prev) => {
            if (!prev || prev.id !== data.id) return prev;
            if (
              prev.order_status === data.order_status &&
              prev.payment_status === data.payment_status &&
              prev.transfer_proof_image === data.transfer_proof_image
            ) {
              return prev;
            }
            return {
              ...prev,
              ...data,
              subtotal: Number(data.subtotal),
              total_amount: Number(data.total_amount),
              cup_fee: Number(data.cup_fee || 0),
              discount: Number(data.discount || 0),
            };
          });
        }
      } catch (_) {}
    };

    fetchLatestOrder();
    const interval = setInterval(fetchLatestOrder, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeTrackingOrder?.id]);

  const getProductImage = (img?: string, id?: string) => {
    if (id && brokenImages[id]) return '/images/menu/bubur-kampiun.png';
    if (!img) return '/images/menu/bubur-kampiun.png';
    return img;
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleToggleSaveProduct = (productId: string) => {
    setSavedProducts((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        triggerToast('Menu dihapus dari daftar favorit');
        return prev.filter((id) => id !== productId);
      } else {
        triggerToast('Menu berhasil disimpan ke favorit! ❤️');
        return [...prev, productId];
      }
    });
  };

  const handleShareProduct = (product: Product) => {
    // Bangun URL langsung ke menu spesifik
    let shareUrl = `https://bubur-khalid.vercel.app/?menu=${encodeURIComponent(product.id)}`;
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseOrigin = isLocal ? window.location.origin : 'https://bubur-khalid.vercel.app';
      const url = new URL(baseOrigin);
      url.searchParams.set('menu', product.id);
      if (selectedTable) {
        url.searchParams.set('table', selectedTable);
      }
      shareUrl = url.toString();
    }

    const shareTitle = `${product.name} - Bubur Khalid`;
    const shareText = `Cobain ${product.name} khas Minang dari Bubur Khalid (hanya Rp${product.price.toLocaleString('id-ID')}). Klik tautan berikut untuk lihat & pesan langsung:`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {});
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      triggerToast(`Tautan menu ${product.name} berhasil disalin! 📋`);
    }
  };

  const getAdminWhatsappPhone = () => {
    let rawNumber = storeSettings.adminWhatsapp;
    if (!rawNumber || rawNumber === '6281234567890') {
      const adminUser = (users || []).find((u) => u.role === 'ADMIN' && u.phone);
      rawNumber = adminUser?.phone || DEFAULT_ADMIN_WHATSAPP;
    }
    return formatIndonesianWhatsappNumber(rawNumber, DEFAULT_ADMIN_WHATSAPP);
  };

  const loadImageFromDataUrl = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(null);
        return;
      }
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  const generateOrderReceiptPNGBlob = async (order: Order, proofImage?: string): Promise<Blob | null> => {
    if (typeof document === 'undefined') return null;
    const width = 460;
    const scale = 2;
    const padding = 28;
    const proofSrc = proofImage || order.transfer_proof_image || '';
    const proofImg = proofSrc ? await loadImageFromDataUrl(proofSrc) : null;

    let proofDrawWidth = 0;
    let proofDrawHeight = 0;
    if (proofImg && proofImg.width > 0 && proofImg.height > 0) {
      const maxImgW = width - padding * 2 - 16;
      const ratio = Math.min(maxImgW / proofImg.width, 360 / proofImg.height);
      proofDrawWidth = Math.round(proofImg.width * ratio);
      proofDrawHeight = Math.round(proofImg.height * ratio);
    }

    const itemCount = order.items.length + (order.cup_fee > 0 ? 1 : 0);
    const proofSectionHeight = proofImg ? proofDrawHeight + 52 : 48;
    const height = 430 + itemCount * 22 + proofSectionHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    let y = 38;
    const center = width / 2;

    // Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1b4332';
    ctx.font = '900 18px sans-serif';
    ctx.fillText((storeSettings.storeName || 'BUBUR KHALID').toUpperCase(), center, y);
    y += 18;

    ctx.fillStyle = '#57534e';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('STRUK KONFIRMASI PESANAN ONLINE', center, y);
    y += 16;

    ctx.fillStyle = '#78716c';
    ctx.font = '10px monospace';
    ctx.fillText(`${storeSettings.storeAddress || 'Jl. Zaini No. 1c'}`, center, y);
    y += 16;

    // Dashed divider
    ctx.strokeStyle = '#d6d3d1';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 14;

    // Queue Box
    ctx.fillStyle = '#143625';
    ctx.fillRect(padding, y, width - padding * 2, 78);
    ctx.fillStyle = '#d6d3d1';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('NOMOR ANTREAN PESANAN', center, y + 19);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 30px sans-serif';
    ctx.fillText(order.queue_number, center, y + 51);
    ctx.fillStyle = '#e7e5e4';
    ctx.font = '10px sans-serif';
    const serviceLabel =
      order.service_type === 'DINE_IN'
        ? `Makan di Tempat (${order.table_number || 'Meja Toko'})`
        : 'Bungkus / Takeaway';
    ctx.fillText(serviceLabel, center, y + 68);
    y += 96;

    const drawRow = (label: string, val: string, bold = false, color = '#1b4332') => {
      ctx.textAlign = 'left';
      ctx.fillStyle = bold ? '#1b4332' : '#44403c';
      ctx.font = `${bold ? 'bold ' : ''}11px monospace`;
      ctx.fillText(label, padding, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = color;
      ctx.fillText(val, width - padding, y);
      y += 18;
    };

    drawRow('Waktu:', `${new Date(order.created_at).toLocaleTimeString('id-ID')} WIB`);
    drawRow('Pelanggan:', order.customer_name || 'Pelanggan Online');
    drawRow('No. WA:', order.customer_phone || '-');
    const methodLabel =
      order.payment_method === 'TRANSFER'
        ? `TRANSFER (${storeSettings?.paymentMethods?.transfer?.bankName || 'BRI'})`
        : order.payment_method === 'QRIS'
        ? 'QRIS DIGITAL'
        : 'TUNAI KASIR';
    drawRow('Pembayaran:', methodLabel, true, '#047857');
    if (order.payment_method === 'TRANSFER') {
      drawRow(
        'Rek. Tujuan:',
        `${storeSettings?.paymentMethods?.transfer?.accountNumber || '8920192831'} (${storeSettings?.paymentMethods?.transfer?.accountHolder || 'BUBUR KHALID'})`
      );
    }

    y += 4;
    ctx.strokeStyle = '#e7e5e4';
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 18;

    order.items.forEach((it) => {
      const name = `${it.quantity}x ${it.product_name_snapshot}${it.use_cup ? ' (Cup)' : ''}`;
      drawRow(name, `Rp${it.line_total.toLocaleString('id-ID')}`);
    });
    if (order.cup_fee > 0) {
      drawRow('Biaya Bungkus Cup', `Rp${order.cup_fee.toLocaleString('id-ID')}`, false, '#78716c');
    }

    y += 4;
    ctx.strokeStyle = '#d6d3d1';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 20;

    drawRow('TOTAL TAGIHAN:', `Rp${order.total_amount.toLocaleString('id-ID')}`, true, '#dc2626');
    y += 8;

    // Embedded M-Banking Screenshot Box
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    const boxH = proofImg ? proofDrawHeight + 36 : 36;
    ctx.fillRect(padding, y, width - padding * 2, boxH);
    ctx.strokeRect(padding, y, width - padding * 2, boxH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#1b4332';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('BUKTI TRANSFER / SCREENSHOT M-BANKING', center, y + 18);

    if (proofImg) {
      const imgX = Math.round((width - proofDrawWidth) / 2);
      ctx.drawImage(proofImg, imgX, y + 26, proofDrawWidth, proofDrawHeight);
    } else {
      ctx.fillStyle = '#b45309';
      ctx.font = '10px sans-serif';
      ctx.fillText('Belum ada screenshot terlampir di struk', center, y + 31);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  const handleShareOrderPNGToWhatsApp = async (order: Order) => {
    if (isSharingOrderPNG) return;
    const activeProof = order.transfer_proof_image || transferProof;
    if (order.payment_method === 'TRANSFER' && !activeProof) {
      triggerToast('Mohon pilih Screenshot M-Banking terlebih dahulu sebelum konfirmasi.');
      return;
    }

    setIsSharingOrderPNG(true);
    try {
      const pngBlob = await generateOrderReceiptPNGBlob(order, activeProof);
      if (!pngBlob) {
        triggerToast('Gagal membuat gambar PNG konfirmasi.');
        return;
      }

      const fileName = `Konfirmasi-${order.queue_number}.png`;
      const pngFile = new File([pngBlob], fileName, { type: 'image/png' });

      // Tablet/HP: Share langsung gambar PNG (bukan teks) ke WhatsApp Admin
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [pngFile] })
      ) {
        try {
          await navigator.share({
            files: [pngFile],
            title: `Konfirmasi ${order.queue_number} - ${storeSettings.storeName || 'Bubur Khalid'}`,
          });
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            return;
          }
        }
      }

      // Fallback Desktop/Browser tanpa file share: salin PNG / unduh PNG lalu buka chat WA tanpa teks
      let copied = false;
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
          copied = true;
        } catch (_) {}
      }

      if (!copied) {
        const blobUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = blobUrl;
        link.click();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      }

      const adminPhone = getAdminWhatsappPhone();
      window.open(`https://wa.me/${adminPhone}`, '_blank');
      triggerToast(
        copied
          ? 'Gambar PNG struk disalin! Tempel (Paste) langsung di WhatsApp Admin.'
          : 'Gambar PNG struk diunduh! Lampirkan PNG tersebut di WhatsApp Admin.'
      );
    } finally {
      setIsSharingOrderPNG(false);
    }
  };

  // Cart item quantity helper
  const getItemCartQty = (productId: string) => {
    return customerCart
      .filter((it) => it.product.id === productId)
      .reduce((sum, it) => sum + it.quantity, 0);
  };

  // Live search results matching across name, description, and category
  const liveSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => {
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const descMatch = (p.description || '').toLowerCase().includes(q);
      const catMatch = (p.category || '').toLowerCase().includes(q);
      return nameMatch || descMatch || catMatch;
    });
  }, [products, searchQuery]);

  // Filtered products: Search query + Category filter
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);

      // If user typed a search query, search takes precedence across all categories
      const matchesCategory =
        Boolean(q) ||
        selectedCategory === 'Semua' ||
        (p.category || '').toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Top 8 best-seller items for the horizontal slide carousel
  const featuredProducts = products.slice(0, 8);
  const featuredCarouselRef = useRef<HTMLDivElement>(null);

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (featuredCarouselRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      featuredCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Store Availability Check (Toko Libur / Tutup Sementara)
  const isStoreUnavailable = useMemo(() => {
    return !storeSettings.isStoreOpen || Boolean(storeSettings.isStoreHoliday);
  }, [storeSettings.isStoreOpen, storeSettings.isStoreHoliday]);

  const storeUnavailableMsg = useMemo(() => {
    if (storeSettings.isStoreHoliday) {
      return storeSettings.holidayReason || 'Toko sedang libur hari ini. Pembeli belum dapat melakukan checkout atau pembayaran.';
    }
    return `Toko sedang tutup. Jam operasional: ${storeSettings.operatingHours}. Pembeli belum dapat melakukan checkout atau pembayaran.`;
  }, [storeSettings.isStoreHoliday, storeSettings.holidayReason, storeSettings.operatingHours]);

  const handleOpenProductModal = (product: Product) => {
    setSelectedProduct(product);
    setModalQty(1);
    setModalUseCup(customerServiceType === 'TAKEAWAY');
    setModalNotes('');
  };

  const hasAutoOpenedRef = useRef<boolean>(false);

  // DEEP LINKING: Deteksi ?menu= atau ?product= di URL saat halaman dimuat untuk langsung membuka modal menu yang dibagikan
  useEffect(() => {
    if (hasAutoOpenedRef.current) return;
    if (typeof window === 'undefined' || !products || products.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const menuQuery = params.get('menu') || params.get('product') || params.get('item');

    if (menuQuery) {
      const decoded = decodeURIComponent(menuQuery).trim().toLowerCase();
      const targetProduct = products.find(
        (p) =>
          p.id.toLowerCase() === decoded ||
          p.name.toLowerCase() === decoded ||
          p.name.toLowerCase().replace(/\s+/g, '-') === decoded
      );

      if (targetProduct) {
        hasAutoOpenedRef.current = true;
        handleOpenProductModal(targetProduct);
      }
    }
  }, [products]);

  const handleConfirmAddToCart = () => {
    if (isStoreUnavailable) {
      triggerToast(
        storeSettings.isStoreHoliday
          ? '🏖️ Toko sedang libur. Pembeli tidak dapat memesan saat ini.'
          : '🔒 Toko sedang tutup. Pembeli tidak dapat memesan saat ini.'
      );
      return;
    }
    if (selectedProduct) {
      addToCustomerCart(selectedProduct, modalQty, modalUseCup, modalNotes);
      setSelectedProduct(null);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStoreUnavailable) {
      triggerToast(
        storeSettings.isStoreHoliday
          ? '🏖️ Toko sedang libur. Pembeli tidak dapat melakukan checkout atau pembayaran saat ini.'
          : '🔒 Toko sedang tutup sementara. Pembeli tidak dapat melakukan checkout atau pembayaran saat ini.'
      );
      return;
    }
    if (customerCart.length === 0) return;
    try {
      const newOrder = createCustomerOrder(customerName, customerPhone, paymentMethod, transferProof || undefined);
      setIsCheckoutOpen(false);

      if (paymentMethod === 'TRANSFER') {
        setTransferConfirmationOrder(newOrder);
      } else {
        setActiveTrackingOrder(newOrder);
      }
    } catch (err: any) {
      triggerToast(`Gagal memproses pesanan: ${err.message || 'Toko tidak tersedia'}`);
    }
  };

  return (
    <div className="min-h-screen bg-tofu-silkblaze text-stone-800 w-full max-w-md mx-auto relative flex flex-col shadow-none md:shadow-xl">
      {/* Native Web App Scrollable Body */}
      <div className="flex-1 pb-28">
        
        {/* FULL FRAME HERO BANNER SECTION (Inspired by Domino's / GoFood Full Bleed Hero) */}
        <div className="w-full relative overflow-hidden bg-matcha-leaf rounded-b-3xl shadow-lg text-tofu-silkblaze">
            
            {/* Full-bleed Hero Background Image with Seamless Dark Matcha Gradient */}
            <div className="absolute inset-0 z-0">
              <Image
                src={storeSettings.bannerImage || '/images/hero-banner-wide.jpg'}
                alt="Hero Banner Bubur Khalid"
                fill
                priority
                className="object-cover object-right"
              />
              {/* Seamless Deep Matcha Gradient from left to preserve typography contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-matcha-leaf via-matcha-leaf/95 via-55% to-transparent" />
              {/* Top & Bottom Ambient Shadows for Depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-matcha-leaf/90 via-transparent to-black/40" />
            </div>

            {/* Top Navigation Bar Overlaid on Hero (Domino's Pizza Reference Style) */}
            <div className="relative z-20 px-4 pt-3 pb-2 flex items-center justify-between">
              {/* Left: Quick Home / Brand Icon */}
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center p-0.5 border border-white/60 flex-shrink-0 overflow-hidden relative">
                  <Image 
                    src={storeSettings.storeLogo || '/images/logo/bubur-khalid-logo.png'} 
                    alt="Logo Bubur Khalid" 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <div className="drop-shadow-sm">
                  <span className="font-black text-sm text-white tracking-tight block leading-none">
                    {storeSettings.storeName}
                  </span>
                  <span className="text-[10px] text-noodle-cream font-medium">Asli Minang</span>
                </div>
              </div>

              {/* Right: Action Buttons (Favorites & Queue Tracker) */}
              <div className="flex items-center space-x-2">
                {/* Favorite Icon Pill */}
                <button
                  type="button"
                  onClick={() => triggerToast(savedProducts.length > 0 ? `Tersimpan ${savedProducts.length} menu favorit` : 'Belum ada menu favorit tersimpan')}
                  className="w-8 h-8 rounded-full bg-white/95 text-stone-800 shadow-md flex items-center justify-center hover:bg-white transition relative border border-white/40"
                  title="Menu Favorit"
                >
                  <Heart className={`w-4 h-4 ${savedProducts.length > 0 ? 'text-spicy-ember fill-spicy-ember' : 'text-stone-700'}`} />
                  {savedProducts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-spicy-ember text-white text-[9px] font-black flex items-center justify-center">
                      {savedProducts.length}
                    </span>
                  )}
                </button>

                {/* Active Order Tracker Badge (Hanya muncul jika ada pesanan aktif) */}
                {activeTrackingOrder && (
                  <button
                    onClick={() => setActiveTrackingOrder(activeTrackingOrder)}
                    className="bg-spicy-ember hover:bg-spicy-hover text-white text-[11px] px-3 py-1.5 rounded-full font-bold flex items-center space-x-1.5 shadow-md transition animate-pulse border border-white/30 cursor-pointer"
                    title="Lacak Antrean Aktif"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Antrean {activeTrackingOrder.queue_number}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Floating Animated Promo Sticker (Domino's Pizza Reference "+ EXTRA DISCOUNT 30%") */}
            <div className="absolute top-14 right-3 sm:right-6 z-20 pointer-events-none">
              <div className="relative">
                {/* Glowing Animated Ring */}
                <div className="absolute -inset-1 rounded-full bg-spicy-ember opacity-70 blur-xs animate-ping" />
                
                {/* Rotating Animated Badge */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-spicy-ember via-spicy-hover to-spicy-ember text-white flex flex-col items-center justify-center p-1 shadow-2xl border-2 border-white transform rotate-12 animate-pulse select-none">
                  <span className="text-[7px] font-black uppercase tracking-tight leading-none text-yolk-blaze">EKSTRA</span>
                  <span className="text-[12px] sm:text-[13px] font-black leading-none my-0.5 tracking-tight">GURIH</span>
                  <span className="text-[7px] font-extrabold leading-none opacity-95">100% ASLI</span>
                </div>
              </div>
            </div>

            {/* Hero Body Content */}
            <div className="relative z-10 px-4 pt-3 pb-8">
              <div className="max-w-[64%] space-y-2">
                {/* Rekomendasi Juara Tag */}
                <div className="inline-flex items-center space-x-1.5 bg-spicy-ember/90 text-white font-black px-2 py-0.5 rounded-md uppercase tracking-wider text-[9px] shadow-sm">
                  <span>⭐ Rekomendasi Juara</span>
                </div>

                {/* Banner Headline */}
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                  {(storeSettings.bannerTitle || 'Bubur Kampiun Komplit').replace(/👋/g, '').trim()}
                </h2>

                {/* Banner Subtitle */}
                <p className="text-[11px] text-noodle-cream leading-relaxed line-clamp-2 drop-shadow-sm font-medium">
                  {storeSettings.bannerSubtitle || 'Paduan komplit khas Minang: sumsum lembut, pulut hitam legit & santan gula aren asli.'}
                </p>

                {/* Price Tag (Domino's Style Price Callout) */}
                <div className="pt-1 flex items-baseline space-x-1.5">
                  <span className="text-[10px] text-noodle-cream/80 font-medium">Mulai</span>
                  <span className="text-2xl sm:text-3xl font-black text-yolk-blaze tracking-tight drop-shadow-md">
                    Rp10<span className="text-xs font-bold text-noodle-cream">.000</span>
                  </span>
                  <span className="bg-spicy-ember text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                    / porsi
                  </span>
                </div>
              </div>

              {/* Operating Hours Strip with Ample Breathing Room */}
              <div className="mt-4 pt-3 pb-1 border-t border-white/15 flex items-center justify-between text-[10.5px] text-noodle-cream/90">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${storeSettings.isStoreHoliday ? 'bg-amber-400 animate-ping' : storeSettings.isStoreOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                  <span className="font-semibold tracking-wide">
                    {storeSettings.isStoreHoliday
                      ? `🏖️ Toko Sedang Libur (${storeSettings.operatingHours})`
                      : storeSettings.isStoreOpen
                      ? storeSettings.operatingHours
                      : 'Toko Sedang Tutup'}
                  </span>
                </div>
                <span className="text-noodle-cream/80 hidden sm:inline font-medium text-[10px]">Hangat &amp; Gurih Setiap Hari</span>
              </div>
            </div>
          </div>

          <div className="px-3 space-y-4">
            {/* Search Bar with Instant Live Dropdown */}
            <div className="relative -mt-4 z-40">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari bubur lezat favoritmu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white pl-11 pr-10 py-3 rounded-full border border-stone-200 text-xs text-matcha-leaf placeholder:text-stone-400 focus:outline-none focus:border-spicy-ember shadow-lg font-medium transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Instant Search Dropdown Results Overlay */}
              {searchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-floating border border-stone-200 overflow-hidden z-50 animate-fadeIn">
                  <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-matcha-leaf">
                      Hasil Pencarian: &quot;{searchQuery}&quot;
                    </span>
                    <span className="font-bold text-stone-500">
                      {liveSearchResults.length} menu ditemukan
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                    {liveSearchResults.length === 0 ? (
                      <div className="py-6 px-4 text-center">
                        <span className="text-2xl block mb-1">🥣</span>
                        <p className="text-xs font-bold text-stone-700">Tidak ada menu yang cocok</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">Coba cari &quot;kampiun&quot;, &quot;kolak&quot;, atau &quot;ketan&quot;</p>
                      </div>
                    ) : (
                      liveSearchResults.map((product) => {
                        const isSoldOut = !product.is_available;
                        return (
                          <div
                            key={product.id}
                            onClick={() => {
                              handleOpenProductModal(product);
                            }}
                            className="p-3 flex items-center space-x-3 hover:bg-noodle-cream/40 cursor-pointer transition active:bg-noodle-cream"
                          >
                            <div className="w-12 h-12 rounded-xl overflow-hidden relative flex-shrink-0 bg-tofu-silkblaze border border-stone-100">
                              <Image
                                src={getProductImage(product.image, product.id)}
                                alt={product.name}
                                fill
                                className={`object-cover ${isSoldOut ? 'grayscale opacity-60' : ''}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-extrabold text-xs text-matcha-leaf truncate">{product.name}</h4>
                                {isSoldOut && (
                                  <span className="bg-red-100 text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded">
                                    Habis
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                                {product.description}
                              </p>
                              <div className="text-xs font-black text-spicy-ember mt-0.5">
                                Rp{product.price.toLocaleString('id-ID')}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="px-2.5 py-1 bg-spicy-ember hover:bg-spicy-hover text-white text-[10px] font-bold rounded-lg shadow-2xs shrink-0"
                            >
                              Lihat
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {liveSearchResults.length > 0 && (
                    <div className="p-2.5 bg-stone-50 border-t border-stone-100 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const menuSection = document.getElementById('daftar-menu-section');
                          if (menuSection) {
                            menuSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="text-[11px] font-extrabold text-spicy-ember hover:underline flex items-center justify-center space-x-1 mx-auto"
                      >
                        <span>Lihat di Daftar Menu Lengkap ({liveSearchResults.length} menu)</span>
                        <span>↓</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Toko Libur / Tutup Alert Banner */}
            {storeSettings.isStoreHoliday ? (
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-matcha-deep p-3.5 rounded-2xl shadow-md flex items-center space-x-3 text-xs border border-amber-400 animate-fadeIn">
                <span className="text-2xl flex-shrink-0">🏖️</span>
                <div className="text-left leading-tight">
                  <div className="font-black text-sm">Pemberitahuan: Toko Sedang Libur</div>
                  <div className="text-[11px] font-semibold text-matcha-deep/90 mt-0.5">
                    {storeSettings.holidayReason || 'Bubur Khalid sedang libur hari ini. Anda tetap dapat melihat daftar menu kami.'}
                  </div>
                </div>
              </div>
            ) : !storeSettings.isStoreOpen ? (
              <div className="bg-red-600 text-white p-3 rounded-2xl shadow-md flex items-center justify-center space-x-2 text-xs font-bold animate-pulse">
                <span className="text-base">🔒</span>
                <span>Toko Sedang Tutup — Belum menerima pesanan saat ini. Anda tetap dapat melihat menu.</span>
              </div>
            ) : null}

            {/* Quick Action Category Pills */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <button
                type="button"
                onClick={() => setCustomerServiceType('DINE_IN')}
                className={`p-2 rounded-2xl border flex flex-col items-center justify-center transition ${
                  customerServiceType === 'DINE_IN'
                    ? 'bg-noodle-cream border-spicy-ember shadow-sm'
                    : 'bg-white border-stone-200 hover:border-spicy-ember/40'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-spicy-light text-spicy-ember flex items-center justify-center mb-1">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-matcha-leaf block leading-tight">Di Tempat</span>
                <span className="text-[9px] text-stone-500 block">{selectedTable}</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomerServiceType('TAKEAWAY')}
                className={`p-2 rounded-2xl border flex flex-col items-center justify-center transition ${
                  customerServiceType === 'TAKEAWAY'
                    ? 'bg-noodle-cream border-spicy-ember shadow-sm'
                    : 'bg-white border-stone-200 hover:border-spicy-ember/40'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-yolk-light text-yolk-dark flex items-center justify-center mb-1">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-matcha-leaf block leading-tight">Bungkus</span>
                <span className="text-[9px] text-stone-500 block">Takeaway</span>
              </button>

              {/* Lacak Struk Quick Action (Satu-satunya tombol Lacak Struk di beranda) */}
              <button
                type="button"
                onClick={() => {
                  setTrackingError(null);
                  setIsTrackingModalOpen(true);
                }}
                className="p-2 rounded-2xl border bg-white border-stone-200 hover:border-spicy-ember flex flex-col items-center justify-center transition active:scale-95 cursor-pointer shadow-xs group"
                title="Lacak Status Pesanan / Nomor Struk"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 text-spicy-ember flex items-center justify-center mb-1 group-hover:bg-spicy-ember group-hover:text-white transition">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-matcha-leaf block leading-tight">Lacak</span>
                <span className="text-[9px] text-stone-500 block">Struk</span>
              </button>
            </div>

            {/* Meja Selector if Dine-In */}
            {customerServiceType === 'DINE_IN' && (
              <div className="bg-noodle-light p-2.5 rounded-xl border border-noodle-dark flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <QrCode className="w-3.5 h-3.5 text-spicy-ember" />
                  <span className="font-semibold text-matcha-leaf">Nomor Meja Pelanggan:</span>
                  <span className="bg-matcha-leaf text-tofu-silkblaze px-2 py-0.5 rounded font-bold">
                    {selectedTable}
                  </span>
                </div>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-white border border-stone-300 text-stone-800 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-spicy-ember font-bold"
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.table_number}>
                      {t.table_number}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Menu Andalan Horizontal Section (Slide Kiri dan Kanan) */}
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-black text-sm text-matcha-leaf">
                    Menu Andalan
                  </h3>
                </div>
                
                {/* Carousel Left/Right Slide Buttons */}
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => scrollFeatured('left')}
                    className="w-7 h-7 rounded-full bg-white border border-stone-200 text-stone-600 hover:text-spicy-ember hover:border-spicy-ember shadow-2xs flex items-center justify-center transition active:scale-90"
                    title="Geser ke Kiri"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollFeatured('right')}
                    className="w-7 h-7 rounded-full bg-white border border-stone-200 text-stone-600 hover:text-spicy-ember hover:border-spicy-ember shadow-2xs flex items-center justify-center transition active:scale-90"
                    title="Geser ke Kanan"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Smooth Slide Left & Right Carousel Container */}
              <div
                ref={featuredCarouselRef}
                className="flex space-x-3 overflow-x-auto pb-2.5 -mx-3 px-3 hide-scrollbar scroll-smooth"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {featuredProducts.map((p) => {
                  const isSoldOut = !p.is_available;
                  const inCartQty = getItemCartQty(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleOpenProductModal(p)}
                      className={`min-w-[145px] w-[145px] bg-white rounded-2xl p-2.5 shadow-sm border border-stone-100 flex-shrink-0 cursor-pointer hover:shadow-md transition active:scale-[0.98] snap-start flex flex-col justify-between ${
                        isSoldOut ? 'opacity-75 bg-stone-50/80' : ''
                      }`}
                    >
                      <div>
                        <div className="w-full h-24 rounded-xl overflow-hidden relative mb-2 bg-tofu-silkblaze border border-stone-100">
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            className={`object-cover ${isSoldOut ? 'grayscale contrast-75' : ''}`}
                          />
                          {isSoldOut ? (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[0.5px] flex flex-col items-center justify-center p-1">
                              <span className="bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                                Habis
                              </span>
                            </div>
                          ) : (
                            <span className="absolute top-1.5 left-1.5 bg-black/50 backdrop-blur-xs text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
                              ⭐ Terlaris
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-xs text-matcha-leaf line-clamp-1">{p.name}</div>
                        <div className="text-spicy-ember font-black text-xs mt-0.5">
                          Rp{p.price.toLocaleString('id-ID')}
                        </div>
                      </div>

                      {isSoldOut ? (
                        <div className="mt-2 w-full py-1 bg-stone-200 text-stone-500 rounded-lg text-[10px] font-bold text-center select-none">
                          Habis Terjual
                        </div>
                      ) : isStoreUnavailable ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerToast(
                              storeSettings.isStoreHoliday
                                ? '🏖️ Toko sedang libur. Pembeli tidak dapat checkout atau memesan saat ini.'
                                : '🔒 Toko sedang tutup. Pembeli tidak dapat checkout atau memesan saat ini.'
                            );
                          }}
                          className="mt-2 w-full py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-[10px] font-bold text-center border border-stone-200"
                        >
                          {storeSettings.isStoreHoliday ? '🏖️ Libur' : '🔒 Tutup'}
                        </button>
                      ) : inCartQty > 0 ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 flex items-center justify-between bg-spicy-light border border-spicy-ember/30 rounded-lg px-1.5 py-0.5"
                        >
                          <button
                            type="button"
                            onClick={() => updateCustomerCartQty(p.id, -1)}
                            className="w-5 h-5 rounded bg-white text-spicy-ember flex items-center justify-center text-xs font-bold active:scale-90"
                          >
                            -
                          </button>
                          <span className="text-xs font-black text-spicy-ember">
                            {inCartQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCustomerCart(p, 1, customerServiceType === 'TAKEAWAY')}
                            className="w-5 h-5 rounded bg-spicy-ember text-white flex items-center justify-center text-xs font-bold active:scale-90"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCustomerCart(p, 1, customerServiceType === 'TAKEAWAY');
                          }}
                          className="mt-2 w-full py-1 bg-spicy-ember hover:bg-spicy-hover active:scale-95 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 shadow-sm transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Promo Banner Carousel Looping (Tepat di Bawah Menu Unggulan) */}
            {activePromoBanners.length > 0 && (
              <div 
                className="relative my-2"
                onMouseEnter={() => setIsPromoPaused(true)}
                onMouseLeave={() => setIsPromoPaused(false)}
                onTouchStart={handlePromoTouchStart}
                onTouchEnd={handlePromoTouchEnd}
              >
                {/* Looping Carousel Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 shadow-md text-white">
                  
                  {/* Banner Content Container */}
                  <div className="relative p-3.5 sm:p-4 flex items-center justify-between gap-3 min-h-[110px]">
                    
                    {/* Left: Text & Badges */}
                    <div className="flex-1 z-10 space-y-1">
                      <div className="flex items-center space-x-2">
                        {activePromoBanners[currentPromoIdx].badge && (
                          <span className="bg-spicy-ember text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase shadow-xs">
                            {activePromoBanners[currentPromoIdx].badge}
                          </span>
                        )}
                        {activePromoBanners[currentPromoIdx].discount_label && (
                          <span className="bg-yolk-blaze/90 text-stone-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                            {activePromoBanners[currentPromoIdx].discount_label}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-black text-white leading-tight tracking-tight drop-shadow-sm line-clamp-1">
                        {activePromoBanners[currentPromoIdx].title}
                      </h4>

                      <p className="text-[11px] text-stone-300 line-clamp-2 leading-relaxed font-normal">
                        {activePromoBanners[currentPromoIdx].subtitle}
                      </p>

                      <div className="pt-0.5 flex items-center space-x-1.5 text-[10px] text-yolk-blaze font-bold">
                        <span>Pesan Sekarang</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>

                    {/* Right: Banner Image (Supports Google Drive Links & Local Images) */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 relative rounded-xl overflow-hidden shadow-md border border-white/10 bg-stone-800">
                      <Image
                        src={parseImageUrl(activePromoBanners[currentPromoIdx].image) || '/images/menu/bubur-kampiun.png'}
                        alt={activePromoBanners[currentPromoIdx].title}
                        fill
                        className="object-cover transition-transform duration-700 hover:scale-105"
                        sizes="(max-width: 640px) 100px, 120px"
                      />
                    </div>
                  </div>

                  {/* Navigation Arrow Controls */}
                  {activePromoBanners.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPromoIdx((prev) => (prev - 1 + activePromoBanners.length) % activePromoBanners.length);
                        }}
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-xs transition z-20 cursor-pointer"
                        title="Banner Sebelumnya"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPromoIdx((prev) => (prev + 1) % activePromoBanners.length);
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-xs transition z-20 cursor-pointer"
                        title="Banner Selanjutnya"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {/* Dots Looping Indicator */}
                  {activePromoBanners.length > 1 && (
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 z-20">
                      {activePromoBanners.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={() => setCurrentPromoIdx(dotIdx)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            currentPromoIdx === dotIdx
                              ? 'w-5 bg-spicy-ember'
                              : 'w-1.5 bg-white/40 hover:bg-white/70'
                          }`}
                          aria-label={`Ke banner ${dotIdx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Main Product Catalog Section with Mobile Adaptation (Geser Kategori & Scroll ke Bawah) */}
            <div className="space-y-3 pt-1">
              
              {/* Category Pills Bar (Horizontal Swipeable / Geser Samping Sesuai UX Mobile) */}
              <div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 -mx-3 px-3 hide-scrollbar">
                  {[
                    { id: 'Semua', label: 'Semua Menu', icon: '✨' },
                    { id: 'Bubur', label: 'Bubur', icon: '🥣' },
                    { id: 'Kolak', label: 'Kolak', icon: '🍌' },
                    { id: 'Lopis', label: 'Lopis', icon: '🍃' },
                    { id: 'Kerupuk', label: 'Kerupuk', icon: '🍘' },
                    { id: 'Paket', label: 'Paket', icon: '⭐' },
                  ].map((cat) => {
                    const count = cat.id === 'Semua' 
                      ? products.length 
                      : products.filter(p => p.category.toLowerCase() === cat.id.toLowerCase()).length;
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 border ${
                          isActive
                            ? 'bg-spicy-ember text-white border-spicy-ember shadow-md shadow-spicy-ember/20'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-spicy-ember/40'
                        }`}
                      >
                        <span className="text-sm leading-none">{cat.icon}</span>
                        <span>{cat.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section Header with Total Items & Layout Toggle (List vs Grid) */}
              <div id="daftar-menu-section" className="flex items-center justify-between pt-1">
                <div>
                  <h3 className="font-black text-sm text-matcha-leaf flex items-center space-x-1.5">
                    <span>{searchQuery ? `Hasil Pencarian "${searchQuery}"` : 'Daftar Menu Bubur Khalid'}</span>
                    <span className="text-[11px] text-stone-400 font-semibold">({filteredProducts.length})</span>
                  </h3>
                  <span className="text-[10px] text-stone-400 block">
                    {searchQuery ? 'Menampilkan menu yang cocok dengan kata kunci' : 'Scroll ke bawah untuk melihat menu'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-[10px] font-bold transition"
                    >
                      Reset Filter
                    </button>
                  )}
                  {/* View Switcher Toggle (List vs 2-Column Grid) */}
                  <div className="flex items-center bg-white p-0.5 rounded-xl border border-stone-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setLayoutMode('list')}
                      className={`p-1.5 rounded-lg transition ${
                        layoutMode === 'list'
                          ? 'bg-spicy-ember text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-700'
                      }`}
                      title="Tampilan List (Scroll ke Bawah)"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayoutMode('grid')}
                      className={`p-1.5 rounded-lg transition ${
                        layoutMode === 'grid'
                          ? 'bg-spicy-ember text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-700'
                      }`}
                      title="Tampilan Grid 2-Kolom (Modern Mobile)"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Empty State when no items match search or category */}
              {filteredProducts.length === 0 ? (
                <div className="py-12 px-4 text-center bg-white rounded-3xl border border-dashed border-stone-200 shadow-xs flex flex-col items-center justify-center animate-fadeIn">
                  <span className="text-4xl mb-2">🥣</span>
                  <h4 className="font-black text-sm text-matcha-leaf">Menu Tidak Ditemukan</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs">
                    {searchQuery
                      ? `Tidak ada menu yang sesuai dengan kata kunci "${searchQuery}".`
                      : 'Belum ada menu di kategori ini.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('Semua');
                    }}
                    className="mt-4 px-4 py-2 bg-spicy-ember hover:bg-spicy-hover text-white rounded-xl text-xs font-extrabold shadow-sm transition active:scale-95"
                  >
                    Lihat Semua Menu
                  </button>
                </div>
              ) : layoutMode === 'list' ? (
                <div className="space-y-2.5">
                  {filteredProducts.map((product) => {
                    const isSoldOut = !product.is_available;
                    const inCartQty = getItemCartQty(product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleOpenProductModal(product)}
                        className={`bg-white rounded-2xl p-3 shadow-sm border border-stone-100 flex items-center space-x-3 cursor-pointer hover:shadow-md transition active:scale-[0.99] relative ${
                          isSoldOut ? 'opacity-80 bg-stone-50/60' : ''
                        }`}
                      >
                        {/* Food Image with Sold Out Badge */}
                        <div className="w-20 h-20 rounded-xl overflow-hidden relative flex-shrink-0 bg-tofu-silkblaze border border-stone-100 shadow-xs">
                          <Image
                            src={getProductImage(product.image, product.id)}
                            alt={product.name}
                            fill
                            onError={() => setBrokenImages((prev) => ({ ...prev, [product.id]: true }))}
                            className={`object-cover ${isSoldOut ? 'grayscale contrast-75' : ''}`}
                          />
                          {isSoldOut && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[0.5px] flex flex-col items-center justify-center p-1">
                              <span className="bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                                Habis
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Middle Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] bg-noodle-cream text-matcha-leaf font-bold px-1.5 py-0.2 rounded">
                              {product.category}
                            </span>
                            {isSoldOut && (
                              <span className="text-[9px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                                Habis Hari Ini
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs text-matcha-leaf mt-1 line-clamp-1">
                            {product.name}
                          </h4>
                          <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-tight">
                            {product.description}
                          </p>
                          
                          {/* Price & Action Stepper */}
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className={`font-black text-sm tracking-tight ${isSoldOut ? 'text-stone-400' : 'text-spicy-ember'}`}>
                              Rp{product.price.toLocaleString('id-ID')}
                            </span>
                            
                            {isSoldOut ? (
                              <span className="px-2 py-1 bg-stone-100 border border-stone-200 text-stone-400 rounded-lg text-[10px] font-bold select-none">
                                Habis
                              </span>
                            ) : isStoreUnavailable ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerToast(
                                    storeSettings.isStoreHoliday
                                      ? '🏖️ Toko sedang libur. Pembeli tidak dapat memesan saat ini.'
                                      : '🔒 Toko sedang tutup. Pembeli tidak dapat memesan saat ini.'
                                  );
                                }}
                                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-[10px] font-bold border border-stone-200"
                              >
                                {storeSettings.isStoreHoliday ? '🏖️ Libur' : '🔒 Tutup'}
                              </button>
                            ) : inCartQty > 0 ? (
                              /* In-Cart Quick Stepper */
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center space-x-1.5 bg-spicy-light border border-spicy-ember/30 rounded-xl px-1 py-0.5"
                              >
                                <button
                                  type="button"
                                  onClick={() => updateCustomerCartQty(product.id, -1)}
                                  className="w-6 h-6 rounded-lg bg-white text-spicy-ember flex items-center justify-center shadow-xs font-bold active:scale-90"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black text-spicy-ember px-1 min-w-[16px] text-center">
                                  {inCartQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addToCustomerCart(product, 1, customerServiceType === 'TAKEAWAY')}
                                  className="w-6 h-6 rounded-lg bg-spicy-ember text-white flex items-center justify-center shadow-xs font-bold active:scale-90"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              /* Standard Add Button */
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCustomerCart(product, 1, customerServiceType === 'TAKEAWAY');
                                }}
                                className="w-8 h-8 bg-spicy-ember hover:bg-spicy-hover active:scale-90 text-white rounded-xl flex items-center justify-center shadow-md transition"
                                title="Tambah ke Keranjang"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* GRID MODE (Tampilan 2-Kolom Modern Mobile) */
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredProducts.map((product) => {
                    const isSoldOut = !product.is_available;
                    const inCartQty = getItemCartQty(product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleOpenProductModal(product)}
                        className={`bg-white rounded-2xl p-2.5 shadow-sm border border-stone-100 flex flex-col justify-between cursor-pointer hover:shadow-md transition active:scale-[0.98] ${
                          isSoldOut ? 'opacity-80 bg-stone-50/60' : ''
                        }`}
                      >
                        <div>
                          {/* Image */}
                          <div className="w-full h-28 rounded-xl overflow-hidden relative mb-2 bg-tofu-silkblaze border border-stone-100">
                            <Image
                              src={getProductImage(product.image, product.id)}
                              alt={product.name}
                              fill
                              onError={() => setBrokenImages((prev) => ({ ...prev, [product.id]: true }))}
                              className={`object-cover ${isSoldOut ? 'grayscale contrast-75' : ''}`}
                            />
                            {isSoldOut ? (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-[0.5px] flex flex-col items-center justify-center p-1">
                                <span className="bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                                  Habis
                                </span>
                              </div>
                            ) : (
                              <span className="absolute top-1.5 left-1.5 bg-noodle-cream/90 backdrop-blur-xs text-matcha-leaf text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                                {product.category}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-xs text-matcha-leaf line-clamp-1 leading-snug">
                            {product.name}
                          </h4>
                          <p className="text-[10px] text-stone-500 line-clamp-2 mt-0.5 leading-tight">
                            {product.description}
                          </p>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between">
                          <span className={`font-black text-xs ${isSoldOut ? 'text-stone-400' : 'text-spicy-ember'}`}>
                            Rp{product.price.toLocaleString('id-ID')}
                          </span>
                          
                          {isSoldOut ? (
                            <span className="text-[9px] text-stone-400 font-bold">Habis</span>
                          ) : isStoreUnavailable ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerToast(
                                  storeSettings.isStoreHoliday
                                    ? '🏖️ Toko sedang libur. Pembeli tidak dapat memesan saat ini.'
                                    : '🔒 Toko sedang tutup. Pembeli tidak dapat memesan saat ini.'
                                );
                              }}
                              className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-[9px] font-bold border border-stone-200"
                            >
                              {storeSettings.isStoreHoliday ? 'Libur' : 'Tutup'}
                            </button>
                          ) : inCartQty > 0 ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center space-x-1 bg-spicy-light rounded-lg px-1 py-0.5 border border-spicy-ember/30"
                            >
                              <button
                                type="button"
                                onClick={() => updateCustomerCartQty(product.id, -1)}
                                className="w-5 h-5 rounded bg-white text-spicy-ember flex items-center justify-center text-xs font-bold active:scale-90"
                              >
                                -
                              </button>
                              <span className="text-[11px] font-black text-spicy-ember px-0.5">
                                {inCartQty}
                              </span>
                              <button
                                type="button"
                                onClick={() => addToCustomerCart(product, 1, customerServiceType === 'TAKEAWAY')}
                                className="w-5 h-5 rounded bg-spicy-ember text-white flex items-center justify-center text-xs font-bold active:scale-90"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCustomerCart(product, 1, customerServiceType === 'TAKEAWAY');
                              }}
                              className="w-7 h-7 bg-spicy-ember hover:bg-spicy-hover active:scale-90 text-white rounded-lg flex items-center justify-center shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Sticky Cart Bar (Floating at bottom) */}
        {customerCart.length > 0 && (
          <div className="fixed bottom-4 left-0 right-0 px-4 max-w-md mx-auto z-30 pointer-events-none">
            <button
              type="button"
              onClick={() => {
                if (isStoreUnavailable) {
                  triggerToast(
                    storeSettings.isStoreHoliday
                      ? '🏖️ Toko sedang libur. Pembeli tidak dapat checkout atau membayar saat ini.'
                      : '🔒 Toko sedang tutup sementara. Pembeli tidak dapat checkout atau membayar saat ini.'
                  );
                  return;
                }
                setIsCheckoutOpen(true);
              }}
              className={`pointer-events-auto w-full px-4 py-3 rounded-2xl shadow-floating flex items-center justify-between transition-all transform active:scale-[0.98] ${
                isStoreUnavailable
                  ? 'bg-stone-800 text-stone-200 border border-stone-700'
                  : 'bg-spicy-ember hover:bg-spicy-hover text-white'
              }`}
            >
              <div className="flex items-center space-x-3 text-left">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  isStoreUnavailable ? 'bg-white/10 text-stone-300' : 'bg-black/20 text-white'
                }`}>
                  {customerCartTotal.itemCount}
                </div>
                <div>
                  <div className="text-[11px] opacity-80 leading-none">
                    {isStoreUnavailable
                      ? storeSettings.isStoreHoliday ? '🏖️ Toko Sedang Libur' : '🔒 Toko Tutup Sementara'
                      : customerServiceType === 'DINE_IN' ? `Makan di ${selectedTable}` : 'Bungkus / Takeaway'}
                  </div>
                  <div className="text-sm font-extrabold mt-0.5">
                    Rp{customerCartTotal.total.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
              <div className={`flex items-center space-x-1 font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm ${
                isStoreUnavailable
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-white text-spicy-ember'
              }`}>
                {isStoreUnavailable ? (
                  <span>Tidak Bisa Checkout</span>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Lihat Keranjang</span>
                  </>
                )}
              </div>
            </button>
          </div>
        )}

        {/* Product Detail Modal (Matches Image 1 & 2 exact UX) */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5 relative shadow-floating animate-slideUp">
              
              {/* Swipe Drag Handle (Image 1 top bar) */}
              <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-3" />

              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setShowProductInfo(false);
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 z-10 transition"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Large Product Image (Image 1) */}
              <div className="w-full h-56 rounded-2xl overflow-hidden relative mb-4 bg-tofu-silkblaze border border-stone-100 shadow-xs">
                <Image
                  src={getProductImage(selectedProduct.image, selectedProduct.id)}
                  alt={selectedProduct.name}
                  fill
                  onError={() => setBrokenImages((prev) => ({ ...prev, [selectedProduct.id]: true }))}
                  className={`object-cover ${!selectedProduct.is_available ? 'grayscale contrast-75' : ''}`}
                />
                {!selectedProduct.is_available && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center">
                    <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-md mb-1">
                      Habis Terjual
                    </span>
                    <span className="text-white/90 text-xs font-semibold">
                      Stok menu ini habis untuk hari ini
                    </span>
                  </div>
                )}
              </div>

              {/* Product Title & Category */}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] bg-noodle-cream text-matcha-leaf font-bold px-2 py-0.5 rounded">
                    {selectedProduct.category}
                  </span>
                  {!selectedProduct.is_available && (
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200">
                      Habis
                    </span>
                  )}
                </div>
                <h3 className="font-black text-lg text-matcha-leaf mt-1 leading-snug">
                  {selectedProduct.name}
                </h3>
              </div>

              {/* Description (Image 1: Nasi + ayam suwir...) */}
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                {selectedProduct.description}
              </p>

              {/* Price (Image 1: 23.500) */}
              <div className="mt-3 flex items-baseline space-x-1">
                <span className={`text-xl font-black ${!selectedProduct.is_available ? 'text-stone-400' : 'text-spicy-ember'}`}>
                  Rp{selectedProduct.price.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-stone-400">/ porsi</span>
              </div>

              {/* 3 Action Buttons (Image 1: Save, Report/Info, Share) */}
              <div className="flex items-center space-x-2 py-3 border-y border-stone-100 my-3">
                {/* Save Button */}
                <button
                  type="button"
                  onClick={() => handleToggleSaveProduct(selectedProduct.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition active:scale-95 ${
                    savedProducts.includes(selectedProduct.id)
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      savedProducts.includes(selectedProduct.id) ? 'fill-rose-600 text-rose-600' : 'text-stone-500'
                    }`}
                  />
                  <span>{savedProducts.includes(selectedProduct.id) ? 'Disimpan' : 'Save'}</span>
                </button>

                {/* Info Button */}
                <button
                  type="button"
                  onClick={() => setShowProductInfo(!showProductInfo)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition active:scale-95 ${
                    showProductInfo
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <Info className="w-3.5 h-3.5 text-stone-500" />
                  <span>Info Bahan</span>
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={() => handleShareProduct(selectedProduct)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 flex items-center justify-center space-x-1.5 transition active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5 text-stone-500" />
                  <span>Share</span>
                </button>
              </div>

              {/* Info Popover Content if clicked */}
              {showProductInfo && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] text-amber-950 space-y-1 mb-3 animate-fadeIn">
                  <div className="font-extrabold flex items-center space-x-1">
                    <span>🌿</span>
                    <span>Komitmen Kualitas Alami:</span>
                  </div>
                  <p className="leading-relaxed">
                    Dibuat segar setiap hari dengan 100% Gula Aren Murni, Santan Kelapa Asli, tanpa pengawet atau pemanis buatan.
                  </p>
                </div>
              )}

              {!selectedProduct.is_available ? (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700">
                  <div className="font-bold flex items-center space-x-1.5 mb-1">
                    <span>⚠️</span>
                    <span>Menu Ini Sedang Habis</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Maaf, menu <strong>{selectedProduct.name}</strong> sudah habis terjual untuk hari ini. Silakan coba menu Bubur Khalid lainnya!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Notes Section (Image 2: Notes) */}
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-matcha-leaf">
                      <FileText className="w-3.5 h-3.5 text-spicy-ember" />
                      <span>Catatan Pesanan (Notes):</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Contoh: santan dipisah, sedikit gula kinca, kuah hangat..."
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-matcha-leaf placeholder:text-stone-400 focus:outline-none focus:border-spicy-ember"
                    />
                  </div>

                  {/* Cup Packaging Toggle (Only visible if enabled) */}
                  {storeSettings.cupEnabled !== false && (
                    <div className="p-3 bg-noodle-cream/40 rounded-xl border border-noodle-dark flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-matcha-leaf">
                          {storeSettings.cupName || 'Kemasan Cup Bawa Pulang'}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          +Rp{(storeSettings.cupFee ?? 1000).toLocaleString('id-ID')} / cup ({storeSettings.cupDescription || 'higienis & anti tumpah'})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalUseCup(!modalUseCup)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          modalUseCup ? 'bg-spicy-ember text-white' : 'bg-white border border-stone-300 text-stone-700'
                        }`}
                      >
                        {modalUseCup
                          ? `Gunakan (+${Math.round((storeSettings.cupFee ?? 1000) / 1000)}rb)`
                          : 'Tanpa Cup'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Stepper & Add to Cart (Image 2 & Image 1) */}
              <div className="mt-5 flex items-center space-x-3 pt-3 border-t border-stone-100">
                {isStoreUnavailable ? (
                  <div className="w-full text-center">
                    <button
                      disabled
                      className={`w-full py-3 rounded-xl text-xs font-black cursor-not-allowed select-none border ${
                        storeSettings.isStoreHoliday
                          ? 'bg-amber-100 border-amber-300 text-amber-900'
                          : 'bg-stone-200 border-stone-300 text-stone-600'
                      }`}
                    >
                      {storeSettings.isStoreHoliday
                        ? '🏖️ Toko Sedang Libur — Hanya Lihat Menu'
                        : '🔒 Toko Sedang Tutup — Hanya Lihat Menu'}
                    </button>
                    <p className="text-[10px] text-stone-500 mt-1.5 font-medium leading-tight">
                      {storeUnavailableMsg}
                    </p>
                  </div>
                ) : !selectedProduct.is_available ? (
                  <button
                    disabled
                    className="w-full bg-stone-200 text-stone-500 py-3 rounded-xl text-xs font-bold cursor-not-allowed text-center select-none"
                  >
                    Menu Habis Terjual Hari Ini
                  </button>
                ) : (
                  <>
                    {/* Stepper with circular buttons (Image 2: - 1 +) */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                        className="w-9 h-9 rounded-full border-2 border-emerald-700 text-emerald-800 hover:bg-emerald-50 flex items-center justify-center font-bold text-base transition active:scale-95"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-black text-matcha-leaf">
                        {modalQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setModalQty(modalQty + 1)}
                        className="w-9 h-9 rounded-full border-2 border-emerald-700 text-emerald-800 hover:bg-emerald-50 flex items-center justify-center font-bold text-base transition active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Add to Cart Button (Image 1: Add to cart) */}
                    <button
                      type="button"
                      onClick={handleConfirmAddToCart}
                      className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-2xl text-xs font-black shadow-md transition flex items-center justify-center space-x-1 active:scale-98"
                    >
                      <span>Add to cart • Rp</span>
                      <span>
                        {(
                          (selectedProduct.price +
                            (modalUseCup && storeSettings.cupEnabled !== false ? (storeSettings.cupFee ?? 1000) : 0)) *
                          modalQty
                        ).toLocaleString('id-ID')}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transfer Confirmation Modal (Otomatis keluar rekening owner & WhatsApp auto-open) */}
        {transferConfirmationOrder && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 relative shadow-floating animate-slideUp space-y-4">
              
              <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto" />

              <div className="text-center space-y-1">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Pesanan Berhasil Dibuat
                </span>
                <h3 className="font-black text-xl text-matcha-leaf">
                  Konfirmasi Pembayaran
                </h3>
                <p className="text-xs text-stone-500">
                  Lampirkan bukti transfer m-banking untuk verifikasi pesanan Anda
                </p>
              </div>

              {/* Queue Number Callout */}
              <div className="bg-gradient-to-r from-matcha-leaf to-matcha-deep text-noodle-cream p-4 rounded-2xl text-center shadow-sm relative overflow-hidden">
                <span className="text-[11px] font-bold text-noodle-dark uppercase tracking-wider block">
                  Nomor Antrean Anda
                </span>
                <div className="text-4xl font-black text-yolk-blaze tracking-widest my-1">
                  {transferConfirmationOrder.queue_number}
                </div>
                <span className="text-[10px] text-noodle-cream/90 bg-white/10 px-2 py-0.5 rounded-full inline-block">
                  {transferConfirmationOrder.service_type === 'DINE_IN'
                    ? `Makan di Tempat (${transferConfirmationOrder.table_number || 'Meja'})`
                    : 'Bungkus / Takeaway'}
                </span>
              </div>

              {/* Upload Screenshot M-Banking */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    {transferConfirmationOrder.transfer_proof_image || transferProof ? (
                      <div className="w-11 h-11 rounded-lg border border-emerald-400 overflow-hidden relative flex-shrink-0 bg-white">
                        <Image
                          src={transferConfirmationOrder.transfer_proof_image || transferProof}
                          alt="Screenshot M-Banking"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="text-[11px] font-extrabold text-matcha-leaf">
                        {transferConfirmationOrder.transfer_proof_image || transferProof
                          ? '✓ Screenshot M-Banking Terlampir'
                          : 'Lampirkan Screenshot M-Banking'}
                      </div>
                    </div>
                  </div>
                  <label className="cursor-pointer px-2.5 py-1.5 bg-white hover:bg-emerald-50 rounded-lg text-[10px] font-bold text-emerald-900 flex items-center space-x-1 border border-emerald-300 transition flex-shrink-0">
                    <Upload className="w-3 h-3 text-emerald-700" />
                    <span>{transferConfirmationOrder.transfer_proof_image || transferProof ? 'Ganti' : 'Pilih SS'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const proofUrl = reader.result as string;
                            setTransferProof(proofUrl);
                            attachTransferProof(transferConfirmationOrder.id, proofUrl);
                            setTransferConfirmationOrder((prev) =>
                              prev ? { ...prev, transfer_proof_image: proofUrl } : null
                            );
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isSharingOrderPNG}
                  onClick={() => handleShareOrderPNGToWhatsApp(transferConfirmationOrder)}
                  className="w-full bg-[#25D366] hover:bg-[#1ebd59] disabled:opacity-60 text-white py-3 rounded-xl font-black text-xs shadow-md flex items-center justify-center space-x-2 transition active:scale-98 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isSharingOrderPNG ? 'Menyiapkan Struk PNG...' : 'Konfirmasi'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTrackingOrder(transferConfirmationOrder);
                    setTransferConfirmationOrder(null);
                  }}
                  className="w-full bg-matcha-leaf hover:bg-matcha-surface text-tofu-silkblaze py-2.5 rounded-xl font-bold text-xs transition"
                >
                  Lacak Status Antrean ({transferConfirmationOrder.queue_number}) →
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border border-stone-700 flex items-center space-x-2 animate-bounce select-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Checkout Modal / Drawer */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5 relative shadow-floating">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsCheckoutOpen(false)}
                    className="p-1 text-stone-500 hover:text-stone-800"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-extrabold text-sm text-matcha-leaf">Konfirmasi Pesanan</h3>
                </div>
                <span className="text-xs bg-noodle-cream text-matcha-leaf font-bold px-2 py-0.5 rounded">
                  {customerServiceType === 'DINE_IN' ? selectedTable : 'Takeaway'}
                </span>
              </div>

              {/* Alert jika Toko Libur / Tutup */}
              {isStoreUnavailable && (
                <div className="mt-3 p-3 bg-red-50 border-2 border-red-300 rounded-2xl text-xs text-red-900 font-bold flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold text-sm text-red-800">
                      {storeSettings.isStoreHoliday ? '🏖️ Toko Sedang Libur' : '🔒 Toko Tutup Sementara'}
                    </div>
                    <div className="text-[11px] font-medium text-red-700 mt-0.5 leading-relaxed">
                      {storeUnavailableMsg} Pembeli tidak dapat melakukan checkout atau pembayaran saat ini.
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleCheckoutSubmit} className="mt-4 space-y-4">
                {/* Customer Contact Details */}
                <div className="bg-tofu-silkblaze p-3 rounded-xl border border-noodle-dark/40 space-y-2">
                  <div className="text-xs font-bold text-matcha-leaf">Data Pelanggan:</div>
                  <input
                    type="text"
                    required
                    placeholder="Nama Anda *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                  />
                  <input
                    type="tel"
                    placeholder="Nomor WhatsApp (untuk notifikasi status)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-matcha-leaf focus:outline-none focus:border-spicy-ember"
                  />
                </div>

                {/* Items Summary in Cart */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-matcha-leaf">Rincian Item:</div>
                  {customerCart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-100 text-xs"
                    >
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-matcha-leaf">{item.product.name}</div>
                        <div className="text-[11px] text-stone-500">
                          Rp{item.product.price.toLocaleString('id-ID')} x {item.quantity}
                          {item.useCup && ' • Cup (+Rp1.000)'}
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-spicy-ember italic mt-0.5">
                            Catatan: {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => updateCustomerCartQty(item.product.id, -1)}
                          className="w-6 h-6 rounded bg-stone-200 flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCustomerCartQty(item.product.id, 1)}
                          className="w-6 h-6 rounded bg-spicy-ember text-white flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Method Selector */}
                <div>
                  <div className="text-xs font-bold text-matcha-leaf mb-1.5">Pilih Metode Pembayaran:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {storeSettings?.paymentMethods?.transfer?.enabled !== false && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('TRANSFER')}
                        className={`p-2 rounded-xl border text-left text-xs font-bold transition flex flex-col justify-between ${
                          paymentMethod === 'TRANSFER'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-base">🏦</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1 rounded">
                            WhatsApp
                          </span>
                        </div>
                        <div>
                          <div className="text-[11px] font-bold leading-tight">Transfer Bank</div>
                          <div className="text-[9px] font-normal text-stone-500 mt-0.5">
                            {storeSettings?.paymentMethods?.transfer?.bankName || 'BCA / Mandiri'}
                          </div>
                        </div>
                      </button>
                    )}
                    {storeSettings?.paymentMethods?.qris?.enabled !== false && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('QRIS')}
                        className={`p-2 rounded-xl border text-left text-xs font-bold transition flex flex-col justify-between ${
                          paymentMethod === 'QRIS'
                            ? 'border-spicy-ember bg-spicy-light text-spicy-ember ring-2 ring-spicy-ember/30'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <span className="text-base mb-1">📱</span>
                        <div>
                          <div className="text-[11px] font-bold leading-tight">{storeSettings?.paymentMethods?.qris?.name || 'QRIS Digital'}</div>
                          <div className="text-[9px] font-normal text-stone-500 mt-0.5">{storeSettings?.paymentMethods?.qris?.description || 'Gopay, OVO, Shopee'}</div>
                        </div>
                      </button>
                    )}
                    {storeSettings?.paymentMethods?.cash?.enabled !== false && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CASH')}
                        className={`p-2 rounded-xl border text-left text-xs font-bold transition flex flex-col justify-between ${
                          paymentMethod === 'CASH'
                            ? 'border-spicy-ember bg-spicy-light text-spicy-ember ring-2 ring-spicy-ember/30'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <span className="text-base mb-1">💵</span>
                        <div>
                          <div className="text-[11px] font-bold leading-tight">{storeSettings?.paymentMethods?.cash?.name || 'Bayar di Kasir'}</div>
                          <div className="text-[9px] font-normal text-stone-500 mt-0.5">{storeSettings?.paymentMethods?.cash?.description || 'Tunai sebelum diproses'}</div>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Transfer Bank Detail Box */}
                  {paymentMethod === 'TRANSFER' && (
                    <div className="mt-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-950 flex items-center space-x-1">
                          <span>🏛️</span>
                          <span>Rekening Tujuan Transfer:</span>
                        </span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-1.5 py-0.2 rounded">
                          {storeSettings?.paymentMethods?.transfer?.bankName || 'BCA'}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-stone-500">Nomor Rekening:</div>
                          <div className="text-sm font-mono font-black text-matcha-leaf">
                            {storeSettings?.paymentMethods?.transfer?.accountNumber || '8920192831'}
                          </div>
                          <div className="text-[10px] font-semibold text-stone-600">
                            a.n {storeSettings?.paymentMethods?.transfer?.accountHolder || 'BUBUR KHALID'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(storeSettings?.paymentMethods?.transfer?.accountNumber || '8920192831');
                            alert('Nomor rekening berhasil disalin!');
                          }}
                          className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-[10px] font-bold text-emerald-900 flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Salin</span>
                        </button>
                      </div>

                      {/* Attach Proof Input */}
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                          Lampirkan Foto Struk / Bukti Transfer:
                        </label>
                        <div className="flex items-center space-x-2">
                          <label className="flex-1 bg-white border border-dashed border-emerald-400 rounded-lg p-2 text-center cursor-pointer hover:bg-emerald-50/70 transition">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    setTransferProof(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <div className="text-[11px] font-bold text-emerald-900 flex items-center justify-center space-x-1">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{transferProof ? '✓ Struk Terlampir (Klik Ganti)' : 'Pilih Screenshot M-Banking'}</span>
                            </div>
                          </label>
                          {transferProof && (
                            <div className="w-10 h-10 rounded-lg border border-emerald-400 overflow-hidden relative flex-shrink-0">
                              <Image src={transferProof} alt="Bukti Transfer" fill className="object-cover" />
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] text-emerald-800 mt-1 leading-tight">
                          *Setelah order dibuat, Anda dapat mengirim konfirmasi berupa gambar PNG (struk, nomor antrean, &amp; SS M-Banking) langsung ke WhatsApp Admin.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal Makanan</span>
                    <span>Rp{customerCartTotal.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {customerCartTotal.cupFee > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Biaya Bungkus Cup</span>
                      <span>+Rp{customerCartTotal.cupFee.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm text-matcha-leaf pt-1 border-t border-stone-200">
                    <span>Total Pembayaran</span>
                    <span className="text-spicy-ember">
                      Rp{customerCartTotal.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isStoreUnavailable}
                  className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-md transition ${
                    !isStoreUnavailable
                      ? 'bg-spicy-ember hover:bg-spicy-hover text-white cursor-pointer active:scale-[0.99]'
                      : 'bg-stone-300 text-stone-500 cursor-not-allowed border border-stone-400/50'
                  }`}
                >
                  {storeSettings.isStoreHoliday
                    ? '🏖️ Toko Sedang Libur — Pembayaran & Checkout Dinonaktifkan'
                    : !storeSettings.isStoreOpen
                    ? '🔒 Toko Sedang Tutup — Pembayaran & Checkout Dinonaktifkan'
                    : `Bayar Sekarang • Rp${customerCartTotal.total.toLocaleString('id-ID')}`}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Live Order Tracking Modal (Ref mockup middle screen) */}
        {activeTrackingOrder && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-2xl max-h-[92vh] overflow-y-auto p-5 relative shadow-floating">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTrackingOrder(null)}
                    className="p-1 text-stone-500 hover:text-stone-800"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-extrabold text-sm text-matcha-leaf">Detail Pesanan & Live Tracking</h3>
                </div>
                <button
                  onClick={() => setActiveTrackingOrder(null)}
                  className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-2 py-1 rounded"
                >
                  Tutup
                </button>
              </div>

              {/* Queue Number Card (Matches visual reference exact layout) */}
              <div className="mt-4 bg-noodle-cream rounded-2xl p-4 border border-noodle-dark/60 text-center relative overflow-hidden shadow-sm">
                <span className="text-xs text-matcha-leaf font-bold">Nomor Antrean Anda</span>
                <div className="text-4xl font-black text-matcha-deep tracking-wider my-1">
                  {activeTrackingOrder.queue_number}
                </div>
                
                {/* Status Badge */}
                <div
                  className={`inline-flex items-center space-x-1.5 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-sm ${
                    activeTrackingOrder.order_status === 'CANCELLED'
                      ? 'bg-red-600'
                      : activeTrackingOrder.order_status === 'COMPLETED' || activeTrackingOrder.order_status === 'READY'
                      ? 'bg-emerald-600'
                      : 'bg-yolk-blaze'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {activeTrackingOrder.order_status === 'CANCELLED'
                      ? 'Pesanan Dibatalkan'
                      : activeTrackingOrder.order_status === 'COMPLETED'
                      ? 'Pesanan Selesai'
                      : activeTrackingOrder.order_status === 'READY'
                      ? 'Siap Diambil / Disajikan'
                      : activeTrackingOrder.order_status === 'PREPARING'
                      ? 'Sedang Disiapkan'
                      : activeTrackingOrder.order_status === 'CONFIRMED'
                      ? 'Pesanan Dikonfirmasi'
                      : activeTrackingOrder.payment_status === 'PAID'
                      ? 'Pesanan Diterima (Antre Dapur)'
                      : 'Pesanan Diterima'}
                  </span>
                </div>

                {/* Sub info pills */}
                <div className="mt-3 flex flex-wrap justify-center items-center gap-1.5 text-[11px] text-stone-700">
                  <span className="bg-white/80 px-2.5 py-0.5 rounded-full font-medium">
                    {activeTrackingOrder.service_type === 'DINE_IN'
                      ? `Makan di ${activeTrackingOrder.table_number || 'Meja'}`
                      : 'Takeaway'}
                  </span>
                  <span className="bg-white/80 px-2.5 py-0.5 rounded-full font-medium">
                    {new Date(activeTrackingOrder.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1 ${
                      activeTrackingOrder.payment_status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <span>{activeTrackingOrder.payment_status === 'PAID' ? '✓' : '⏳'}</span>
                    <span>
                      {activeTrackingOrder.payment_status === 'PAID'
                        ? 'Pembayaran Berhasil'
                        : 'Menunggu Konfirmasi Transfer'}
                    </span>
                  </span>
                </div>
              </div>

              {/* WhatsApp Direct Confirmation & Proof Sender Card */}
              <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-500/80 shadow-soft space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
                      <MessageCircle className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-matcha-leaf">
                        Kirim Bukti Bayar ke WhatsApp Admin
                      </h4>
                      <p className="text-[10px] text-emerald-800 font-medium">
                        Nomor Antrean & Rincian Otomatis Terlampir
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-950 font-black px-2 py-0.5 rounded-full font-mono">
                    {activeTrackingOrder.queue_number}
                  </span>
                </div>

                {/* Proof Attachment Slot */}
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    {activeTrackingOrder.transfer_proof_image || transferProof ? (
                      <div className="w-11 h-11 rounded-lg border border-emerald-300 overflow-hidden relative flex-shrink-0 bg-stone-100">
                        <Image
                          src={activeTrackingOrder.transfer_proof_image || transferProof}
                          alt="Bukti Transfer"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        📄
                      </div>
                    )}
                    <div>
                      <div className="text-[11px] font-bold text-matcha-leaf">
                        {activeTrackingOrder.transfer_proof_image || transferProof
                          ? '✓ Bukti Transfer'
                          : 'Belum Lampirkan Bukti Bayar?'}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {activeTrackingOrder.transfer_proof_image || transferProof
                          ? 'Foto struk tersimpan di sistem'
                          : 'Pilih foto screenshot struk transfer'}
                      </div>
                    </div>
                  </div>

                  <label className="cursor-pointer px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-[10px] font-bold text-emerald-900 flex items-center space-x-1 border border-emerald-300 transition">
                    <Upload className="w-3 h-3 text-emerald-700" />
                    <span>{activeTrackingOrder.transfer_proof_image || transferProof ? 'Ganti Foto' : 'Pilih Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const proofUrl = reader.result as string;
                            setTransferProof(proofUrl);
                            attachTransferProof(activeTrackingOrder.id, proofUrl);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Direct One-Click WhatsApp PNG Action Button */}
                <button
                  type="button"
                  disabled={isSharingOrderPNG}
                  onClick={() => handleShareOrderPNGToWhatsApp(activeTrackingOrder)}
                  className="w-full bg-[#25D366] hover:bg-[#20ba59] disabled:opacity-60 active:scale-[0.98] text-white py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 shadow-md transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>
                    {isSharingOrderPNG
                      ? 'Menyiapkan Struk PNG...'
                      : `Kirim ke Admin (${activeTrackingOrder.queue_number})`}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress Pesanan (Dynamic Vertical Timeline Stepper Synced with Data Pesanan) */}
              {(() => {
                const isPaid = activeTrackingOrder.payment_status === 'PAID';
                const status = activeTrackingOrder.order_status;
                const isCancelled = status === 'CANCELLED';
                const orderTimeStr = `${new Date(activeTrackingOrder.created_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })} WIB`;

                const isStep1Done = isPaid && !isCancelled;
                const isStep2Done = isPaid && !isCancelled;
                const isStep3Done = isPaid && ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'].includes(status);
                const isStep4Active = isPaid && status === 'PREPARING';
                const isStep4Done = isPaid && ['READY', 'COMPLETED'].includes(status);
                const isStep5Active = isPaid && status === 'READY';
                const isStep5Done = isPaid && status === 'COMPLETED';
                const isStep6Done = isPaid && status === 'COMPLETED';

                return (
                  <div className="mt-5">
                    <h4 className="font-extrabold text-xs text-matcha-leaf mb-3">Progress Pesanan</h4>
                    {isCancelled ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
                        ✕ Pesanan ini telah dibatalkan oleh kasir/admin.
                      </div>
                    ) : (
                      <div className="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                        {/* Step 1: Pembayaran */}
                        <div className={`relative flex items-start space-x-3 ${!isPaid ? '' : ''}`}>
                          <span
                            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold ${
                              isStep1Done ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
                            }`}
                          >
                            {isStep1Done ? '✓' : '●'}
                          </span>
                          <div>
                            <div className={`font-bold text-xs ${isStep1Done ? 'text-matcha-leaf' : 'text-amber-700'}`}>
                              {isStep1Done ? 'Pembayaran Berhasil' : 'Menunggu Konfirmasi Pembayaran'}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {isStep1Done
                                ? `${orderTimeStr} • Pembayaran terkonfirmasi`
                                : `${orderTimeStr} • Menunggu verifikasi kasir/admin`}
                            </div>
                          </div>
                        </div>

                        {/* Step 2: Pesanan Diterima */}
                        <div className={`relative flex items-start space-x-3 ${isStep2Done ? '' : 'opacity-45'}`}>
                          <span
                            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isStep2Done ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-500'
                            }`}
                          >
                            {isStep2Done ? '✓' : '2'}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-matcha-leaf">Pesanan Diterima</div>
                            <div className="text-[10px] text-stone-500">
                              {isStep2Done ? `${orderTimeStr} • Masuk antrean dapur` : 'Menunggu pembayaran terverifikasi'}
                            </div>
                          </div>
                        </div>

                        {/* Step 3: Pesanan Dikonfirmasi */}
                        <div className={`relative flex items-start space-x-3 ${isPaid ? '' : 'opacity-45'}`}>
                          <span
                            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isStep3Done
                                ? 'bg-emerald-600 text-white'
                                : isPaid
                                ? 'bg-spicy-ember text-white animate-pulse'
                                : 'bg-stone-200 text-stone-500'
                            }`}
                          >
                            {isStep3Done ? '✓' : isPaid ? '●' : '3'}
                          </span>
                          <div>
                            <div className={`font-bold text-xs ${isPaid && !isStep3Done ? 'text-spicy-ember' : 'text-matcha-leaf'}`}>
                              Pesanan Dikonfirmasi
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {isStep3Done ? 'Diteruskan ke dapur Bubur Khalid' : 'Menunggu tim dapur memproses'}
                            </div>
                          </div>
                        </div>

                        {/* Step 4: Sedang Disiapkan */}
                        <div className={`relative flex items-start space-x-3 ${isStep4Done || isStep4Active ? '' : 'opacity-50'}`}>
                          <span
                            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isStep4Done
                                ? 'bg-emerald-600 text-white'
                                : isStep4Active
                                ? 'bg-spicy-ember text-white animate-pulse'
                                : 'bg-stone-300 text-stone-600'
                            }`}
                          >
                            {isStep4Done ? '✓' : isStep4Active ? '●' : '4'}
                          </span>
                          <div>
                            <div className={`font-bold text-xs ${isStep4Active ? 'text-spicy-ember' : 'text-matcha-leaf'}`}>
                              Sedang Disiapkan
                            </div>
                            <div className="text-[10px] text-stone-600">
                              {isStep4Done
                                ? 'Selesai dimasak oleh tim dapur'
                                : isStep4Active
                                ? 'Sedang dimasak hangat oleh tim dapur'
                                : 'Menunggu giliran dimasak'}
                            </div>
                          </div>
                        </div>

                        {/* Step 5: Siap Diambil */}
                        <div className={`relative flex items-start space-x-3 ${isStep5Done || isStep5Active ? '' : 'opacity-45'}`}>
                          <span
                            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isStep5Done
                                ? 'bg-emerald-600 text-white'
                                : isStep5Active
                                ? 'bg-emerald-600 text-white animate-pulse'
                                : 'bg-stone-300 text-stone-600'
                            }`}
                          >
                            {isStep5Done ? '✓' : isStep5Active ? '●' : '5'}
                          </span>
                          <div>
                            <div className={`font-bold text-xs ${isStep5Active ? 'text-emerald-700' : 'text-matcha-leaf'}`}>
                              Siap Diambil / Disajikan
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {isStep5Active
                                ? 'Pesanan Anda sudah siap! Silakan diambil'
                                : isStep5Done
                                ? 'Pesanan telah diserahkan'
                                : 'Estimasi ± 5 menit setelah dimasak'}
                            </div>
                          </div>
                        </div>

                        {/* Step 6: Selesai */}
                        <div className={`relative flex items-start space-x-3 ${isStep6Done ? '' : 'opacity-40'}`}>
                          <span
                            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isStep6Done ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-400'
                            }`}
                          >
                            {isStep6Done ? '✓' : '6'}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-matcha-leaf">Pesanan Selesai</div>
                            <div className="text-[10px] text-stone-400">Terima kasih atas kunjungan Anda</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Items Summary */}
              <div className="mt-5 p-3 bg-tofu-silkblaze rounded-xl border border-noodle-dark/50 text-xs">
                <div className="font-bold text-matcha-leaf mb-2">Item dalam Pesanan ini:</div>
                {activeTrackingOrder.items.map((it) => (
                  <div key={it.id} className="flex justify-between py-1 border-b border-stone-200/60 last:border-0">
                    <span>
                      {it.quantity}x {it.product_name_snapshot}
                    </span>
                    <span className="font-bold">Rp{it.line_total.toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-extrabold text-spicy-ember border-t border-stone-300 mt-2">
                  <span>Total Transaksi</span>
                  <span>Rp{activeTrackingOrder.total_amount.toLocaleString('id-ID')}</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Modal Lacak Pesanan / Input Kode Struk */}
        {isTrackingModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-3xl p-5 relative shadow-floating border border-stone-200 animate-scaleUp">
              <button
                onClick={() => {
                  setIsTrackingModalOpen(false);
                  setTrackingError(null);
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-spicy-light text-spicy-ember flex items-center justify-center text-xl shadow-xs border border-spicy-ember/20">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-matcha-leaf">Live Tracking Pesanan</h3>
                  <p className="text-[11px] text-stone-500">Pantau status antrean dari dapur secara realtime</p>
                </div>
              </div>

              {/* Form Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTrackByCode();
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-matcha-leaf mb-1">
                    Nomor Antrean / Kode Struk:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="Contoh: OT-001 atau WB-002"
                      value={trackingCodeInput}
                      onChange={(e) => {
                        setTrackingCodeInput(e.target.value.toUpperCase());
                        setTrackingError(null);
                      }}
                      className="w-full bg-stone-50 border-2 border-stone-300 focus:border-spicy-ember rounded-2xl px-4 py-3 text-sm font-mono font-black text-matcha-leaf tracking-wider uppercase focus:outline-none placeholder:font-sans placeholder:font-normal placeholder:tracking-normal"
                    />
                    {trackingCodeInput && (
                      <button
                        type="button"
                        onClick={() => setTrackingCodeInput('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Examples */}
                <div className="flex items-center space-x-1.5 text-[10px] text-stone-500">
                  <span>Contoh cepat:</span>
                  <button
                    type="button"
                    onClick={() => setTrackingCodeInput('OT-001')}
                    className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono font-bold cursor-pointer"
                  >
                    OT-001
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackingCodeInput('WB-001')}
                    className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono font-bold cursor-pointer"
                  >
                    WB-001
                  </button>
                </div>

                {/* Error Banner */}
                {trackingError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start space-x-2 animate-shake">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                    <span>{trackingError}</span>
                  </div>
                )}

                {/* Visual Tips Card */}
                <div className="p-3 bg-noodle-cream/40 rounded-2xl border border-noodle-dark/50 text-[11px] text-stone-600 space-y-1">
                  <div className="font-bold text-matcha-leaf flex items-center space-x-1">
                    <span>💡</span>
                    <span>Di mana letak kode unik struk?</span>
                  </div>
                  <p className="leading-relaxed">
                    Lihat struk fisik kasir Anda pada tulisan <strong>&quot;NOMOR ANTREAN TOKO&quot;</strong> (misal <strong>OT-001</strong>), atau nomor antrean WhatsApp saat selesai checkout web.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSearchingTracking || !trackingCodeInput.trim()}
                  className="w-full bg-spicy-ember hover:bg-spicy-hover text-white py-3 rounded-2xl font-black text-xs shadow-md transition flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {isSearchingTracking ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>{isSearchingTracking ? 'Mencari di Dapur...' : 'Lacak Status Antrean Sekarang'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

    </div>
  );
}
