'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useApp } from '@/lib/store/AppContext';
import { Product, Order, PromoBanner } from '@/lib/types';
import { parseImageUrl } from '@/lib/utils/image';
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
  } = useApp();

  // Active Promo Banners & Looping Carousel State
  const activePromoBanners = useMemo(() => {
    return (promoBanners || []).filter((b) => b.is_active);
  }, [promoBanners]);

  const [currentPromoIdx, setCurrentPromoIdx] = useState<number>(0);
  const [isPromoPaused, setIsPromoPaused] = useState<boolean>(false);

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

  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(
    orders.find((o) => o.queue_channel === 'ONLINE') || null
  );

  // User interactions: Save / Favorites, Share, and Order Feedback
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [showProductInfo, setShowProductInfo] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [transferConfirmationOrder, setTransferConfirmationOrder] = useState<Order | null>(null);

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
    const text = `Nikmati ${product.name} khas Minang dari Bubur Khalid - hanya Rp${product.price.toLocaleString('id-ID')}!`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: product.name,
          text,
          url: window.location.href,
        })
        .catch(() => {});
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(`${text} Pesan di: ${window.location.href}`);
      triggerToast('Tautan menu berhasil disalin ke clipboard! 📋');
    }
  };

  const generateWhatsAppLink = (order: Order) => {
    const rawNumber = storeSettings.adminWhatsapp || '6281234567890';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const phone = cleanNumber.startsWith('0') ? '62' + cleanNumber.slice(1) : cleanNumber;

    const itemsSummary = order.items
      .map((it) => `• ${it.quantity}x ${it.product_name_snapshot} (Rp${it.line_total.toLocaleString('id-ID')})`)
      .join('\n');

    const serviceLabel =
      order.service_type === 'DINE_IN'
        ? `Makan di Tempat (${order.table_number || 'Meja Toko'})`
        : 'Bungkus / Takeaway';

    const message = `*KONFIRMASI BUKTI BAYAR - BUBUR KHALID*
----------------------------------------
*Nomor Antrean:* *${order.queue_number}*
*Nama Pelanggan:* ${order.customer_name || 'Pelanggan'}
*No. WhatsApp:* ${order.customer_phone || '-'}
*Layanan:* ${serviceLabel}
*Waktu:* ${new Date(order.created_at).toLocaleTimeString('id-ID')} WIB
*Metode:* ${
      order.payment_method === 'TRANSFER'
        ? 'Transfer Bank Manual'
        : order.payment_method === 'QRIS'
        ? 'QRIS Digital'
        : 'Bayar Tunai Kasir'
    }

*Rincian Menu:*
${itemsSummary}
${order.cup_fee > 0 ? `• Biaya Cup: Rp${order.cup_fee.toLocaleString('id-ID')}\n` : ''}
*Total Tagihan:* *Rp${order.total_amount.toLocaleString('id-ID')}*
----------------------------------------
Halo Admin Bubur Khalid, saya telah memesan dengan No. Antrean *${order.queue_number}*. Berikut saya kirimkan konfirmasi dan lampiran bukti transfer saya untuk diverifikasi. Mohon segera diproses ya. Terima kasih! 🙏`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // Cart item quantity helper
  const getItemCartQty = (productId: string) => {
    return customerCart
      .filter((it) => it.product.id === productId)
      .reduce((sum, it) => sum + it.quantity, 0);
  };

  // Filtered products: Search query + Category filter
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Semua' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Top 8 best-seller items for the horizontal slide carousel
  const featuredProducts = products.slice(0, 8);
  const featuredCarouselRef = useRef<HTMLDivElement>(null);

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (featuredCarouselRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      featuredCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOpenProductModal = (product: Product) => {
    setSelectedProduct(product);
    setModalQty(1);
    setModalUseCup(customerServiceType === 'TAKEAWAY');
    setModalNotes('');
  };

  const handleConfirmAddToCart = () => {
    if (selectedProduct) {
      addToCustomerCart(selectedProduct, modalQty, modalUseCup, modalNotes);
      setSelectedProduct(null);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerCart.length === 0) return;
    const newOrder = createCustomerOrder(customerName, customerPhone, paymentMethod, transferProof || undefined);
    setIsCheckoutOpen(false);

    if (paymentMethod === 'TRANSFER') {
      const waUrl = generateWhatsAppLink(newOrder);
      if (typeof window !== 'undefined') {
        window.open(waUrl, '_blank');
      }
      setTransferConfirmationOrder(newOrder);
    } else {
      setActiveTrackingOrder(newOrder);
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
                <div className="w-8 h-8 rounded-full bg-white/95 text-stone-900 shadow-md flex items-center justify-center font-extrabold text-sm border border-white/40 flex-shrink-0">
                  {storeSettings.storeLogo ? (
                    <div className="w-6 h-6 rounded-full overflow-hidden relative">
                      <Image src={storeSettings.storeLogo} alt="Logo" fill className="object-cover" />
                    </div>
                  ) : (
                    <span>🥣</span>
                  )}
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

                {/* Active Order Tracker / Store Status */}
                {activeTrackingOrder ? (
                  <button
                    onClick={() => setActiveTrackingOrder(activeTrackingOrder)}
                    className="bg-spicy-ember hover:bg-spicy-hover text-white text-[11px] px-2.5 py-1.5 rounded-full font-bold flex items-center space-x-1 shadow-md transition animate-pulse border border-white/30"
                    title="Lacak Antrean"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{activeTrackingOrder.queue_number}</span>
                  </button>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/95 text-stone-800 shadow-md flex items-center justify-center border border-white/40" title="Riwayat Pesanan">
                    <Clock className="w-4 h-4 text-stone-700" />
                  </div>
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
                  <span className={`w-2 h-2 rounded-full ${storeSettings.isStoreOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                  <span className="font-semibold tracking-wide">{storeSettings.isStoreOpen ? storeSettings.operatingHours : 'Toko Sedang Tutup'}</span>
                </div>
                <span className="text-noodle-cream/80 hidden sm:inline font-medium text-[10px]">Hangat & Gurih Setiap Hari</span>
              </div>
            </div>
          </div>

          <div className="px-3 space-y-4">
            {/* Search Bar (Domino's / GoFood Style floating over bottom of Hero Banner with comfortable breathing space) */}
            <div className="relative -mt-4 z-30">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Mau makan bubur apa hari ini?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white pl-11 pr-11 py-3 rounded-full border border-stone-200 text-xs text-matcha-leaf placeholder:text-stone-400 focus:outline-none focus:border-spicy-ember shadow-lg font-medium"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-spicy-ember select-none text-base">
                🍴
              </div>
            </div>

            {/* Quick Action Category Pills (Like GoFood Restos Nearby, Ongkir Murah, Group Order, Promo) */}
            <div className="grid grid-cols-4 gap-2 text-center">
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

              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-2 rounded-2xl border bg-white border-stone-200 hover:border-amber-300 flex flex-col items-center justify-center transition"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
                  <Flame className="w-4 h-4 text-yolk-blaze" />
                </div>
                <span className="text-[11px] font-bold text-matcha-leaf block leading-tight">Andalan</span>
                <span className="text-[9px] text-stone-500 block">Terlaris</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const lopis = products.find((p) => p.name.toLowerCase().includes('lopis'));
                  if (lopis) handleOpenProductModal(lopis);
                }}
                className="p-2 rounded-2xl border bg-white border-stone-200 hover:border-spicy-ember flex flex-col items-center justify-center transition"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-1">
                  <Tag className="w-4 h-4 text-spicy-ember" />
                </div>
                <span className="text-[11px] font-bold text-matcha-leaf block leading-tight">Hemat</span>
                <span className="text-[9px] text-stone-500 block">Paket</span>
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
                  <h3 className="font-black text-sm text-matcha-leaf flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-yolk-blaze" />
                    <span>Menu Andalan</span>
                  </h3>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full select-none">
                    Geser 👈 👉
                  </span>
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
                className="flex space-x-3 overflow-x-auto pb-2.5 -mx-3 px-3 hide-scrollbar snap-x snap-mandatory scroll-smooth touch-pan-x"
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
                className="relative my-2 select-none"
                onMouseEnter={() => setIsPromoPaused(true)}
                onMouseLeave={() => setIsPromoPaused(false)}
                onTouchStart={() => setIsPromoPaused(true)}
                onTouchEnd={() => setIsPromoPaused(false)}
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
                <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 -mx-3 px-3 hide-scrollbar select-none">
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
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h3 className="font-black text-sm text-matcha-leaf flex items-center space-x-1.5">
                    <span>Daftar Menu Bubur Khalid</span>
                    <span className="text-[11px] text-stone-400 font-semibold">({filteredProducts.length})</span>
                  </h3>
                  <span className="text-[10px] text-stone-400 block">Scroll ke bawah untuk melihat menu</span>
                </div>

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

              {/* LIST MODE (Tampilan List Vertikal - Scroll ke Bawah) */}
              {layoutMode === 'list' ? (
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
                            src={product.image}
                            alt={product.name}
                            fill
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
                              src={product.image}
                              alt={product.name}
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
              onClick={() => setIsCheckoutOpen(true)}
              className="pointer-events-auto w-full bg-spicy-ember hover:bg-spicy-hover text-white px-4 py-3 rounded-2xl shadow-floating flex items-center justify-between transition-all transform active:scale-[0.98]"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center font-bold text-sm">
                  {customerCartTotal.itemCount}
                </div>
                <div>
                  <div className="text-[11px] text-white/80 leading-none">
                    {customerServiceType === 'DINE_IN' ? `Makan di ${selectedTable}` : 'Bungkus / Takeaway'}
                  </div>
                  <div className="text-sm font-extrabold mt-0.5">
                    Rp{customerCartTotal.total.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 font-bold text-xs bg-white text-spicy-ember px-3 py-1.5 rounded-xl shadow-sm">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Lihat Keranjang</span>
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
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  fill
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
                {!selectedProduct.is_available ? (
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
                  Transfer ke Rekening Owner
                </h3>
                <p className="text-xs text-stone-500">
                  Silakan selesaikan pembayaran dan kirimkan bukti bayar ke WhatsApp Owner
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

              {/* Owner Bank Account Box */}
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-300 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                  <span className="text-xs font-extrabold text-emerald-950 flex items-center space-x-1.5">
                    <span>🏛️</span>
                    <span>Rekening Resmi Owner Khalid:</span>
                  </span>
                  <span className="text-xs bg-emerald-200 text-emerald-900 font-black px-2 py-0.5 rounded">
                    {storeSettings.paymentMethods.transfer.bankName || 'BCA'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 font-semibold uppercase block">Nomor Rekening</span>
                    <div className="text-base font-mono font-black text-matcha-leaf">
                      {storeSettings.paymentMethods.transfer.accountNumber || '8920192831'}
                    </div>
                    <span className="text-[11px] text-stone-600 font-bold block mt-0.5">
                      a.n {storeSettings.paymentMethods.transfer.accountHolder || 'BUBUR KHALID'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined') {
                        navigator.clipboard.writeText(storeSettings.paymentMethods.transfer.accountNumber || '8920192831');
                        triggerToast('Nomor rekening berhasil disalin! 📋');
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </button>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 font-semibold uppercase block">Total Nominal Transfer</span>
                    <div className="text-lg font-black text-spicy-ember">
                      Rp {transferConfirmationOrder.total_amount.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined') {
                        navigator.clipboard.writeText(String(transferConfirmationOrder.total_amount));
                        triggerToast('Nominal transfer berhasil disalin! 📋');
                      }
                    }}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold flex items-center space-x-1 transition active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </button>
                </div>
              </div>

              {/* WhatsApp Auto-Trigger Callout */}
              <div className="p-3 bg-emerald-100/70 rounded-xl border border-emerald-300 text-xs text-emerald-950 flex items-start space-x-2">
                <span className="text-lg">💬</span>
                <div className="leading-snug">
                  <strong>Pesan WhatsApp Terisi Otomatis:</strong> Aplikasi telah membuka WhatsApp Owner dengan nomor antrean <strong>{transferConfirmationOrder.queue_number}</strong> dan rincian pesanan Anda.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <a
                  href={generateWhatsAppLink(transferConfirmationOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#1ebd59] text-white py-3 rounded-xl font-black text-xs shadow-md flex items-center justify-center space-x-2 transition active:scale-98"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Buka WhatsApp Owner ({storeSettings.adminWhatsapp || '628...'})</span>
                </a>

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
                    {storeSettings.paymentMethods.transfer.enabled && (
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
                            {storeSettings.paymentMethods.transfer.bankName || 'BCA / Mandiri'}
                          </div>
                        </div>
                      </button>
                    )}
                    {storeSettings.paymentMethods.qris.enabled && (
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
                          <div className="text-[11px] font-bold leading-tight">{storeSettings.paymentMethods.qris.name}</div>
                          <div className="text-[9px] font-normal text-stone-500 mt-0.5">{storeSettings.paymentMethods.qris.description}</div>
                        </div>
                      </button>
                    )}
                    {storeSettings.paymentMethods.cash.enabled && (
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
                          <div className="text-[11px] font-bold leading-tight">{storeSettings.paymentMethods.cash.name}</div>
                          <div className="text-[9px] font-normal text-stone-500 mt-0.5">{storeSettings.paymentMethods.cash.description}</div>
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
                          {storeSettings.paymentMethods.transfer.bankName || 'BCA'}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-stone-500">Nomor Rekening:</div>
                          <div className="text-sm font-mono font-black text-matcha-leaf">
                            {storeSettings.paymentMethods.transfer.accountNumber || '8920192831'}
                          </div>
                          <div className="text-[10px] font-semibold text-stone-600">
                            a.n {storeSettings.paymentMethods.transfer.accountHolder || 'BUBUR KHALID'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(storeSettings.paymentMethods.transfer.accountNumber || '8920192831');
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
                          *Setelah order dibuat, Anda langsung diarahkan ke tombol WhatsApp Admin dengan pesan otomatis beserta Nomor Antrean.
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
                  className="w-full bg-spicy-ember hover:bg-spicy-hover text-white py-3 rounded-xl font-extrabold text-xs shadow-md transition"
                >
                  Bayar Sekarang • Rp{customerCartTotal.total.toLocaleString('id-ID')}
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
                <div className="inline-flex items-center space-x-1.5 bg-yolk-blaze text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {activeTrackingOrder.order_status === 'PREPARING'
                      ? 'Sedang Disiapkan'
                      : activeTrackingOrder.order_status === 'CONFIRMED'
                      ? 'Pesanan Dikonfirmasi'
                      : activeTrackingOrder.order_status === 'READY'
                      ? 'Siap Diambil / Disajikan'
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
                    Hari ini, 16:20 WIB
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
                          ? '✓ Bukti Transfer Siap Dikirim'
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

                {/* Direct One-Click WhatsApp Action Button */}
                <a
                  href={generateWhatsAppLink(activeTrackingOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 shadow-md transition"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Kirim ke WhatsApp Admin ({activeTrackingOrder.queue_number})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="text-[10px] text-emerald-800 text-center leading-relaxed">
                  Tombol di atas otomatis membuka WhatsApp ke nomor <strong>Admin Bubur Khalid ({storeSettings.adminWhatsapp || '0812-3456-7890'})</strong> dengan pesan berisi <strong>No. Antrean {activeTrackingOrder.queue_number}</strong> dan rincian pesanan. Cukup kirimkan pesan & lampirkan foto struk di WhatsApp.
                </div>
              </div>

              {/* Progress Pesanan (Vertical Timeline Stepper) */}
              <div className="mt-5">
                <h4 className="font-extrabold text-xs text-matcha-leaf mb-3">Progress Pesanan</h4>
                <div className="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                  
                  {/* Step 1: Pembayaran Berhasil */}
                  <div className="relative flex items-start space-x-3">
                    <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <div>
                      <div className="font-bold text-xs text-matcha-leaf">Pembayaran Berhasil</div>
                      <div className="text-[10px] text-stone-500">16:20 WIB • Transaksi terverifikasi otomatis</div>
                    </div>
                  </div>

                  {/* Step 2: Pesanan Diterima */}
                  <div className="relative flex items-start space-x-3">
                    <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <div>
                      <div className="font-bold text-xs text-matcha-leaf">Pesanan Diterima</div>
                      <div className="text-[10px] text-stone-500">16:21 WIB • Pesanan masuk ke sistem kasir</div>
                    </div>
                  </div>

                  {/* Step 3: Pesanan Dikonfirmasi */}
                  <div className="relative flex items-start space-x-3">
                    <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <div>
                      <div className="font-bold text-xs text-matcha-leaf">Pesanan Dikonfirmasi</div>
                      <div className="text-[10px] text-stone-500">16:22 WIB • Diteruskan ke dapur Bubur Khalid</div>
                    </div>
                  </div>

                  {/* Step 4: Sedang Disiapkan (Active) */}
                  <div className="relative flex items-start space-x-3">
                    <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-spicy-ember text-white flex items-center justify-center text-[10px] font-bold animate-pulse">
                      ●
                    </span>
                    <div>
                      <div className="font-bold text-xs text-spicy-ember">Sedang Disiapkan</div>
                      <div className="text-[10px] text-stone-600">Sedang dimasak hangat oleh tim dapur</div>
                    </div>
                  </div>

                  {/* Step 5: Siap Diambil */}
                  <div className="relative flex items-start space-x-3 opacity-60">
                    <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-stone-300 text-stone-600 flex items-center justify-center text-[10px]">
                      5
                    </span>
                    <div>
                      <div className="font-bold text-xs text-matcha-leaf">Siap Diambil / Disajikan</div>
                      <div className="text-[10px] text-stone-500">Estimasi ± 5 menit</div>
                    </div>
                  </div>

                  {/* Step 6: Selesai */}
                  <div className="relative flex items-start space-x-3 opacity-40">
                    <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-stone-200 text-stone-400 flex items-center justify-center text-[10px]">
                      6
                    </span>
                    <div>
                      <div className="font-bold text-xs text-matcha-leaf">Pesanan Selesai</div>
                      <div className="text-[10px] text-stone-400">Terima kasih atas kunjungan Anda</div>
                    </div>
                  </div>

                </div>
              </div>

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

    </div>
  );
}
