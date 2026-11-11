'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Order, OrderStatus, PaymentMethod, TableInfo, AuditLog, FinancialSummary, StoreSettings, SystemUser, PromoBanner, UserRole } from '../types';
import { INITIAL_PRODUCTS, INITIAL_TABLES, CUP_FEE, INITIAL_STORE_SETTINGS, INITIAL_USERS, INITIAL_PROMO_BANNERS } from '../constants';
import { MOCK_ORDERS, MOCK_FINANCIAL_SUMMARY, MOCK_AUDIT_LOGS } from '../mock-data';
import { supabase } from '../supabase/client';

interface CartItem {
  product: Product;
  quantity: number;
  useCup: boolean;
  notes: string;
}

interface AppContextType {
  // Navigation & Role Simulation
  activeView: 'customer' | 'admin' | 'pos' | 'kds' | 'owner-financial';
  setActiveView: (view: 'customer' | 'admin' | 'pos' | 'kds' | 'owner-financial') => void;
  customerServiceType: 'DINE_IN' | 'TAKEAWAY';
  setCustomerServiceType: (type: 'DINE_IN' | 'TAKEAWAY') => void;
  selectedTable: string;
  setSelectedTable: (table: string) => void;

  // Products & Master Data
  products: Product[];
  trashProducts: Product[];
  toggleProductAvailability: (id: string) => void;
  updateProductPrice: (id: string, newPrice: number) => void;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  softDeleteProduct: (id: string) => void;
  restoreProduct: (id: string) => void;

  // Tables
  tables: TableInfo[];
  addTable: (table: Omit<TableInfo, 'id'>) => void;
  updateTable: (id: string, updates: Partial<TableInfo>) => void;
  deleteTable: (id: string) => void;
  toggleTableStatus: (id: string) => void;

  // Orders & Queue
  orders: Order[];
  createCustomerOrder: (customerName: string, customerPhone: string, paymentMethod: PaymentMethod, transferProof?: string) => Order;
  attachTransferProof: (orderId: string, proofUrl: string) => void;
  createPosOrder: (customerName: string, paymentMethod: 'CASH' | 'QRIS', cashReceived?: number, qrisRef?: string, qrisProvider?: string) => { order: Order; change: number };
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, actor?: string) => void;

  // Customer Cart
  customerCart: CartItem[];
  addToCustomerCart: (product: Product, quantity?: number, useCup?: boolean, notes?: string) => void;
  updateCustomerCartQty: (productId: string, delta: number) => void;
  toggleCustomerCartCup: (productId: string) => void;
  clearCustomerCart: () => void;
  customerCartTotal: { subtotal: number; cupFee: number; total: number; itemCount: number };

  // POS Cart
  posCart: CartItem[];
  addToPosCart: (product: Product) => void;
  updatePosCartQty: (productId: string, delta: number) => void;
  togglePosCartCup: (productId: string) => void;
  clearPosCart: () => void;
  posCartTotal: { subtotal: number; cupFee: number; total: number; itemCount: number };

  // Store & Banner Settings
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;

  // Promo Banners (Carousel Looping)
  promoBanners: PromoBanner[];
  addPromoBanner: (banner: Omit<PromoBanner, 'id'>) => void;
  updatePromoBanner: (id: string, updates: Partial<PromoBanner>) => void;
  deletePromoBanner: (id: string) => void;
  togglePromoBannerStatus: (id: string) => void;

  // Users & Security
  users: SystemUser[];
  addUser: (user: Omit<SystemUser, 'id' | 'created_at'>) => void;
  updateUser: (id: string, updated: Partial<SystemUser>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;

  // Authentication & Session
  currentUser: SystemUser | null;
  isAuthenticated: boolean;
  login: (identifier: string, passOrPin: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  signup: (userData: {
    name: string;
    email: string;
    username: string;
    password: string;
    role: UserRole;
    phone?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (emailOrUsername: string, newPass: string) => { success: boolean; message?: string };
  logout: () => void;

  // Financial & Security Gate
  financialSummary: FinancialSummary;
  isFinancialUnlocked: boolean;
  unlockFinancialGate: (passcode: string) => boolean;
  lockFinancialGate: () => void;
  financialLockRemainingSeconds: number;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: string, entity: string, entityId: string, details: string) => void;

  // Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<'customer' | 'admin' | 'pos' | 'kds' | 'owner-financial'>('customer');

  // Auto-detect Admin Domain (e.g. bubur-khalid-admin.vercel.app) or ?view=admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');

      if (viewParam && ['customer', 'admin', 'pos', 'kds', 'owner-financial'].includes(viewParam)) {
        setActiveView(viewParam as any);
      } else if (hostname.includes('admin') || hostname.includes('kasir') || process.env.NEXT_PUBLIC_DEFAULT_VIEW === 'admin') {
        setActiveView('admin');
      }

      // Deteksi Meja dari URL Barcode Scan Meja (misal: ?table=Meja 01 atau ?table=01)
      const tableParam = params.get('table') || params.get('meja');
      if (tableParam) {
        const decodedTable = decodeURIComponent(tableParam);
        const formattedTable = decodedTable.toLowerCase().startsWith('meja')
          ? decodedTable
          : `Meja ${decodedTable.padStart(2, '0')}`;
        setSelectedTable(formattedTable);
        setCustomerServiceType('DINE_IN');
      }
    }
  }, []);
  const [customerServiceType, setCustomerServiceType] = useState<'DINE_IN' | 'TAKEAWAY'>('TAKEAWAY');
  const [selectedTable, setSelectedTable] = useState<string>('Meja 04');

  // Master Data State with Full LocalStorage Persistence
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [trashProducts, setTrashProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<TableInfo[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>(INITIAL_PROMO_BANNERS);
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);

  // Initialize and restore all data from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Products
        const savedProducts = localStorage.getItem('bubur_khalid_products');
        if (savedProducts) {
          const parsed = JSON.parse(savedProducts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
          }
        }

        // Trash
        const savedTrash = localStorage.getItem('bubur_khalid_trash_products');
        if (savedTrash) {
          const parsed = JSON.parse(savedTrash);
          if (Array.isArray(parsed)) {
            setTrashProducts(parsed);
          }
        }

        // Store Settings
        const savedSettings = localStorage.getItem('bubur_khalid_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed && typeof parsed === 'object') {
            const cleanWhatsapp =
              parsed.adminWhatsapp && parsed.adminWhatsapp !== '6281234567890'
                ? parsed.adminWhatsapp
                : '6285274281819';
            setStoreSettings({
              ...parsed,
              adminWhatsapp: cleanWhatsapp,
            });
          }
        }

        // Promo Banners
        const savedBanners = localStorage.getItem('bubur_khalid_promo_banners');
        if (savedBanners) {
          const parsed = JSON.parse(savedBanners);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPromoBanners(parsed);
          }
        }

        // Tables
        const savedTables = localStorage.getItem('bubur_khalid_tables');
        if (savedTables) {
          const parsed = JSON.parse(savedTables);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTables(parsed);
          }
        }

        // Orders
        const savedOrders = localStorage.getItem('bubur_khalid_orders');
        if (savedOrders) {
          const parsed = JSON.parse(savedOrders);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        }

        // Users & Session: Bersihkan data dummy lama jika ada
        const savedUsers = localStorage.getItem('bubur_khalid_users');
        if (savedUsers) {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed)) {
            // Hapus pengguna dummy default lama (khalid_owner, ahmad_admin, siska_kasir, budi_kitchen)
            const cleanUsers = parsed.filter(
              (u: SystemUser) =>
                !['usr-1', 'usr-2', 'usr-3', 'usr-4'].includes(u.id) &&
                !['khalid_owner', 'ahmad_admin', 'siska_kasir', 'budi_kitchen'].includes(u.username)
            );
            setUsers(cleanUsers);
            localStorage.setItem('bubur_khalid_users', JSON.stringify(cleanUsers));
          }
        } else {
          setUsers([]);
        }

        const savedSession =
          sessionStorage.getItem('bubur_khalid_admin_session') ||
          localStorage.getItem('bubur_khalid_admin_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (
            ['usr-1', 'usr-2', 'usr-3', 'usr-4'].includes(parsed.id) ||
            ['khalid_owner', 'ahmad_admin', 'siska_kasir', 'budi_kitchen'].includes(parsed.username)
          ) {
            localStorage.removeItem('bubur_khalid_admin_session');
            sessionStorage.removeItem('bubur_khalid_admin_session');
            setCurrentUser(null);
          } else {
            setCurrentUser(parsed);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Failed to load local storage:', err);
      } finally {
        setIsHydrated(true);
      }
    }
  }, []);

  // Sync Master Data from Supabase Cloud on client hydration
  useEffect(() => {
    async function fetchCloudData() {
      try {
        // 1. Users
        const { data: cloudUsers, error: uErr } = await supabase.from('users').select('*');
        if (!uErr && cloudUsers && cloudUsers.length > 0) {
          const cleanUsers = cloudUsers.filter(
            (u: SystemUser) =>
              !['usr-1', 'usr-2', 'usr-3', 'usr-4'].includes(u.id) &&
              !['khalid_owner', 'ahmad_admin', 'siska_kasir', 'budi_kitchen'].includes(u.username)
          );
          setUsers(cleanUsers);
          localStorage.setItem('bubur_khalid_users', JSON.stringify(cleanUsers));
        }

        // 2. Products
        const { data: cloudProds, error: pErr } = await supabase.from('products').select('*');
        if (!pErr && cloudProds && cloudProds.length > 0) {
          const active = cloudProds.filter((p: any) => !p.deleted_at).map((p: any) => ({
            ...p,
            price: Number(p.price),
          }));
          const trashed = cloudProds.filter((p: any) => p.deleted_at).map((p: any) => ({
            ...p,
            price: Number(p.price),
          }));
          setProducts(active);
          setTrashProducts(trashed);
          localStorage.setItem('bubur_khalid_products', JSON.stringify(active));
          localStorage.setItem('bubur_khalid_trash_products', JSON.stringify(trashed));
        }

        // 3. Orders
        const { data: cloudOrders, error: oErr } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!oErr && cloudOrders && cloudOrders.length > 0) {
          const mappedOrders = cloudOrders.map((o: any) => ({
            ...o,
            subtotal: Number(o.subtotal),
            total_amount: Number(o.total_amount),
            cup_fee: Number(o.cup_fee || 0),
            discount: Number(o.discount || 0),
          }));
          setOrders(mappedOrders);
          localStorage.setItem('bubur_khalid_orders', JSON.stringify(mappedOrders));
        }

        // 4. Store Settings
        const { data: cloudSettings, error: sErr } = await supabase
          .from('store_settings')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (!sErr && cloudSettings) {
          setStoreSettings((prev) => ({
            ...prev,
            storeName: cloudSettings.store_name || prev.storeName,
            storeTagline: cloudSettings.store_tagline || prev.storeTagline,
            storeAddress: cloudSettings.store_address || prev.storeAddress,
            storeLogo: cloudSettings.store_logo || prev.storeLogo,
            bannerTitle: cloudSettings.banner_title || prev.bannerTitle,
            bannerSubtitle: cloudSettings.banner_subtitle || prev.bannerSubtitle,
            bannerImage: cloudSettings.banner_image || prev.bannerImage,
            operatingHours: cloudSettings.operating_hours || prev.operatingHours,
            adminWhatsapp:
              cloudSettings.admin_whatsapp && cloudSettings.admin_whatsapp !== '6281234567890'
                ? cloudSettings.admin_whatsapp
                : prev.adminWhatsapp || '6285274281819',
            isStoreOpen: cloudSettings.is_store_open ?? prev.isStoreOpen,
            cupFee: Number(cloudSettings.cup_fee ?? prev.cupFee),
            cupName: cloudSettings.cup_name || prev.cupName,
            cupDescription: cloudSettings.cup_description || prev.cupDescription,
            cupEnabled: cloudSettings.cup_enabled ?? prev.cupEnabled,
            paymentMethods: cloudSettings.payment_methods || prev.paymentMethods,
          }));
        }
      } catch (e) {
        console.warn('Supabase offline or table pending initialization:', e);
      }
    }

    if (isHydrated) {
      fetchCloudData();
    }
  }, [isHydrated]);

  // Auto-sync Products ke LocalStorage saat ada perubahan
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem('bubur_khalid_products', JSON.stringify(products));
      } catch (e) {}
    }
  }, [products, isHydrated]);

  // Auto-sync Trash Products ke LocalStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem('bubur_khalid_trash_products', JSON.stringify(trashProducts));
      } catch (e) {}
    }
  }, [trashProducts, isHydrated]);

  // Auto-sync Settings ke LocalStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem('bubur_khalid_settings', JSON.stringify(storeSettings));
      } catch (e) {}
    }
  }, [storeSettings, isHydrated]);

  // Auto-sync Promo Banners ke LocalStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem('bubur_khalid_promo_banners', JSON.stringify(promoBanners));
      } catch (e) {}
    }
  }, [promoBanners, isHydrated]);

  // Auto-sync Tables ke LocalStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem('bubur_khalid_tables', JSON.stringify(tables));
      } catch (e) {}
    }
  }, [tables, isHydrated]);

  // Auto-sync Orders ke LocalStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem('bubur_khalid_orders', JSON.stringify(orders));
      } catch (e) {}
    }
  }, [orders, isHydrated]);

  // Auto-sync Users ke LocalStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem('bubur_khalid_users', JSON.stringify(users));
      } catch (e) {}
    }
  }, [users, isHydrated]);

  const addPromoBanner = (newBanner: Omit<PromoBanner, 'id'>) => {
    const banner: PromoBanner = {
      ...newBanner,
      id: `promo-${Date.now()}`,
    };
    setPromoBanners((prev) => [...prev, banner]);
    addAuditLog('CREATE', 'PromoBanner', banner.id, `Menambahkan banner promosi: ${banner.title}`);
    showToast('Banner promosi berhasil ditambahkan!');
  };

  const updatePromoBanner = (id: string, updates: Partial<PromoBanner>) => {
    setPromoBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    addAuditLog('UPDATE', 'PromoBanner', id, `Memperbarui banner promosi`);
    showToast('Banner promosi berhasil diperbarui!');
  };

  const deletePromoBanner = (id: string) => {
    const target = promoBanners.find((b) => b.id === id);
    setPromoBanners((prev) => prev.filter((b) => b.id !== id));
    addAuditLog('DELETE', 'PromoBanner', id, `Menghapus banner promosi: ${target?.title || id}`);
    showToast('Banner promosi telah dihapus');
  };

  const togglePromoBannerStatus = (id: string) => {
    setPromoBanners((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const next = !b.is_active;
          showToast(`Banner ${b.title} kini ${next ? 'Aktif' : 'Nonaktif'}`);
          return { ...b, is_active: next };
        }
        return b;
      })
    );
  };

  // Cart States (Kosong secara default saat pelanggan pertama kali masuk web)
  const [customerCart, setCustomerCart] = useState<CartItem[]>([]);
  const [posCart, setPosCart] = useState<CartItem[]>([]);

  // Financial Gate
  const [isFinancialUnlocked, setIsFinancialUnlocked] = useState<boolean>(false);
  const [financialLockRemainingSeconds, setFinancialLockRemainingSeconds] = useState<number>(300);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto countdown for financial lock
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isFinancialUnlocked && financialLockRemainingSeconds > 0) {
      timer = setInterval(() => {
        setFinancialLockRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsFinancialUnlocked(false);
            showToast('Sesi finansial telah terkunci kembali demi keamanan.');
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isFinancialUnlocked, financialLockRemainingSeconds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  const addAuditLog = (action: string, entity: string, entity_id: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      actor: activeView === 'owner-financial' ? 'Owner Khalid' : activeView === 'pos' ? 'Kasir Siska' : 'Admin Khalid',
      role: activeView === 'owner-financial' ? 'OWNER' : activeView === 'pos' ? 'CASHIER' : 'ADMIN',
      action,
      entity,
      entity_id,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Cart Calculations
  const calcCart = (items: CartItem[]) => {
    let subtotal = 0;
    let cupFee = 0;
    let itemCount = 0;
    items.forEach((item) => {
      subtotal += item.product.price * item.quantity;
      if (item.useCup && storeSettings.cupEnabled !== false) {
        cupFee += (storeSettings.cupFee ?? CUP_FEE) * item.quantity;
      }
      itemCount += item.quantity;
    });
    return { subtotal, cupFee, total: subtotal + cupFee, itemCount };
  };

  const customerCartTotal = calcCart(customerCart);
  const posCartTotal = calcCart(posCart);

  // Customer Cart Operations
  const addToCustomerCart = (product: Product, quantity = 1, useCup = customerServiceType === 'TAKEAWAY', notes = '') => {
    setCustomerCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity, useCup, notes }];
    });
    showToast(`Ditambahkan ke keranjang: ${product.name}`);
  };

  const updateCustomerCartQty = (productId: string, delta: number) => {
    setCustomerCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id === productId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const toggleCustomerCartCup = (productId: string) => {
    setCustomerCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, useCup: !i.useCup } : i))
    );
  };

  const clearCustomerCart = () => setCustomerCart([]);

  // POS Cart Operations
  const addToPosCart = (product: Product) => {
    setPosCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1, useCup: false, notes: '' }];
    });
  };

  const updatePosCartQty = (productId: string, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id === productId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const togglePosCartCup = (productId: string) => {
    setPosCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, useCup: !i.useCup } : i))
    );
  };

  const clearPosCart = () => setPosCart([]);

  // Create Customer Order
  const createCustomerOrder = (
    customerName: string,
    customerPhone: string,
    paymentMethod: PaymentMethod,
    transferProof?: string
  ): Order => {
    const onlineSeq = orders.filter((o) => o.queue_channel === 'ONLINE').length + 28;
    const globalSeq = orders.length + 51;
    const queueNum = `ON-${String(onlineSeq).padStart(3, '0')}`;
    const isPaid = paymentMethod === 'QRIS';

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      queue_number: queueNum,
      queue_channel: 'ONLINE',
      service_type: customerServiceType,
      global_queue_sequence: globalSeq,
      table_id: customerServiceType === 'DINE_IN' ? 'tbl-4' : null,
      table_number: customerServiceType === 'DINE_IN' ? selectedTable : null,
      customer_name: customerName || 'Pelanggan Web',
      customer_phone: customerPhone || '08123456789',
      order_status: 'NEW',
      payment_status: isPaid ? 'PAID' : 'PENDING',
      payment_method: paymentMethod,
      subtotal: customerCartTotal.subtotal,
      cup_fee: customerCartTotal.cupFee,
      cup_count: customerCart.filter((i) => i.useCup).length,
      discount: 0,
      total_amount: customerCartTotal.total,
      notes: 'Pesanan mandiri dari Web Customer',
      transfer_proof_image: transferProof,
      items: customerCart.map((i, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        product_id: i.product.id,
        product_name_snapshot: i.product.name,
        unit_price_snapshot: i.product.price,
        quantity: i.quantity,
        item_notes: i.notes,
        use_cup: i.useCup,
        cup_fee_snapshot: i.useCup ? CUP_FEE : 0,
        line_total: i.product.price * i.quantity + (i.useCup ? CUP_FEE * i.quantity : 0),
      })),
      created_at: new Date().toISOString(),
      paid_at: isPaid ? new Date().toISOString() : null,
      status_history: [
        {
          status: isPaid ? 'PAID' : 'PENDING',
          label: isPaid
            ? 'Pembayaran QRIS Berhasil'
            : paymentMethod === 'TRANSFER'
            ? 'Menunggu Verifikasi Transfer'
            : 'Menunggu Pembayaran di Kasir',
          timestamp: 'Baru Saja',
          note: paymentMethod === 'TRANSFER' ? 'Bukti bayar dikirim via WhatsApp' : undefined,
        },
        { status: 'NEW', label: 'Pesanan Diterima Toko', timestamp: 'Baru Saja' },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCustomerCart();

    // Sync order to Supabase Cloud
    supabase
      .from('orders')
      .upsert([newOrder])
      .then(({ error }) => {
        if (error) console.warn('Supabase online order sync error:', error.message);
      });

    addAuditLog('CREATE_ONLINE_ORDER', 'Order', newOrder.id, `Pesanan Online ${queueNum} dibuat oleh ${newOrder.customer_name}`);
    showToast(`Pesanan berhasil! Nomor Antrean Anda: ${queueNum}`);
    return newOrder;
  };

  const attachTransferProof = (orderId: string, proofUrl: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          addAuditLog('UPLOAD_TRANSFER_PROOF', 'Order', orderId, 'Bukti transfer diunggah pelanggan');
          return { ...o, transfer_proof_image: proofUrl };
        }
        return o;
      })
    );
    showToast('Bukti transfer berhasil disimpan!');
  };

  // Create POS Order
  const createPosOrder = (
    customerName: string,
    paymentMethod: 'CASH' | 'QRIS',
    cashReceived?: number,
    qrisRef?: string,
    qrisProvider?: string
  ) => {
    const otSeq = orders.filter((o) => o.queue_channel === 'IN_STORE').length + 14;
    const globalSeq = orders.length + 51;
    const queueNum = `OT-${String(otSeq).padStart(3, '0')}`;
    const total = posCartTotal.total;
    const change = cashReceived && cashReceived > total ? cashReceived - total : 0;

    const paymentNote =
      paymentMethod === 'CASH'
        ? `Tunai diterima Rp${cashReceived?.toLocaleString('id-ID')}`
        : qrisRef
        ? `QRIS ${qrisProvider || 'Digital'} (Ref: ${qrisRef})`
        : `QRIS ${qrisProvider || 'Digital'}`;

    const newOrder: Order = {
      id: `ord-pos-${Date.now()}`,
      queue_number: queueNum,
      queue_channel: 'IN_STORE',
      service_type: 'DINE_IN',
      global_queue_sequence: globalSeq,
      customer_name: customerName || 'Pelanggan Kasir',
      order_status: 'CONFIRMED',
      payment_status: 'PAID',
      payment_method: paymentMethod,
      subtotal: posCartTotal.subtotal,
      cup_fee: posCartTotal.cupFee,
      cup_count: posCart.filter((i) => i.useCup).length,
      discount: 0,
      total_amount: total,
      qris_reference: qrisRef,
      qris_provider: qrisProvider,
      items: posCart.map((i, idx) => ({
        id: `pos-item-${Date.now()}-${idx}`,
        product_id: i.product.id,
        product_name_snapshot: i.product.name,
        unit_price_snapshot: i.product.price,
        quantity: i.quantity,
        item_notes: i.notes,
        use_cup: i.useCup,
        cup_fee_snapshot: i.useCup ? CUP_FEE : 0,
        line_total: i.product.price * i.quantity + (i.useCup ? CUP_FEE * i.quantity : 0),
      })),
      created_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
      status_history: [
        {
          status: 'PAID',
          label: 'Pembayaran Dikonfirmasi Kasir',
          timestamp: 'Baru Saja',
          note: paymentNote,
        },
        { status: 'CONFIRMED', label: 'Diteruskan ke Dapur', timestamp: 'Baru Saja' },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearPosCart();

    // Sync POS order to Supabase Cloud
    supabase
      .from('orders')
      .upsert([newOrder])
      .then(({ error }) => {
        if (error) console.warn('Supabase POS order sync error:', error.message);
      });

    addAuditLog(
      'CREATE_POS_ORDER',
      'Order',
      newOrder.id,
      `Pesanan Kasir ${queueNum} lunas via ${paymentMethod} (${paymentNote})`
    );
    showToast(`Transaksi POS berhasil! Nomor Antrean: ${queueNum}`);
    return { order: newOrder, change };
  };

  // Update Order Status
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, actor = 'Staf Operasional') => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const statusLabels: Record<OrderStatus, string> = {
            NEW: 'Pesanan Diterima',
            CONFIRMED: 'Pesanan Dikonfirmasi',
            PREPARING: 'Sedang Disiapkan',
            READY: 'Siap Disajikan / Diambil',
            COMPLETED: 'Pesanan Selesai',
            REJECTED: 'Pesanan Ditolak',
            CANCELLED: 'Pesanan Dibatalkan',
          };
          return {
            ...ord,
            order_status: newStatus,
            status_history: [
              ...ord.status_history,
              {
                status: newStatus,
                label: statusLabels[newStatus],
                timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
                actor,
              },
            ],
          };
        }
        return ord;
      })
    );

    // Sync status change to Supabase Cloud
    supabase
      .from('orders')
      .update({ order_status: newStatus })
      .eq('id', orderId)
      .then(({ error }) => {
        if (error) console.warn('Supabase status update error:', error.message);
      });

    addAuditLog('UPDATE_ORDER_STATUS', 'Order', orderId, `Status diperbarui menjadi ${newStatus} oleh ${actor}`);
    showToast(`Status pesanan diperbarui: ${newStatus}`);
  };

  // Master Product Operations (with Soft Delete & Price Snapshot protection)
  const toggleProductAvailability = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextState = !p.is_available;
          addAuditLog(
            'TOGGLE_AVAILABILITY',
            'Product',
            id,
            `Status ketersediaan diubah: ${nextState ? 'TERSEDIA' : 'HABIS'}`
          );
          showToast(
            `Menu "${p.name}" sekarang ${nextState ? 'TERSEDIA' : 'HABIS'}`
          );
          return { ...p, is_available: nextState };
        }
        return p;
      })
    );
  };

  const updateProductPrice = (id: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          addAuditLog('UPDATE_PRICE', 'Product', id, `Harga diubah dari Rp${p.price.toLocaleString('id-ID')} ke Rp${newPrice.toLocaleString('id-ID')}`);
          return { ...p, price: newPrice };
        }
        return p;
      })
    );
    showToast('Harga produk berhasil diperbarui. Transaksi lama tidak terpengaruh.');
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const priceChanged = updated.price !== undefined && updated.price !== p.price;
          const nameChanged = updated.name !== undefined && updated.name !== p.name;
          const imgChanged = updated.image !== undefined && updated.image !== p.image;
          
          let logDetails = `Menu "${p.name}" diperbarui:`;
          if (nameChanged) logDetails += ` Nama -> "${updated.name}";`;
          if (priceChanged) logDetails += ` Harga -> Rp${p.price.toLocaleString('id-ID')} ke Rp${updated.price?.toLocaleString('id-ID')};`;
          if (imgChanged) logDetails += ` Foto produk diperbarui;`;

          addAuditLog('UPDATE_PRODUCT', 'Product', id, logDetails);
          return { ...p, ...updated };
        }
        return p;
      })
    );
    showToast('Data menu berhasil diperbarui. Transaksi lama tetap mengunci snapshot awal.');
  };

  const addProduct = (newProdData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [...prev, newProduct]);
    addAuditLog('ADD_PRODUCT', 'Product', newProduct.id, `Menu baru "${newProduct.name}" ditambahkan dengan harga Rp${newProduct.price.toLocaleString('id-ID')}`);
    showToast(`Menu baru "${newProduct.name}" berhasil ditambahkan.`);
  };

  const softDeleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setTrashProducts((prev) => [...prev, { ...target, deleted_at: new Date().toISOString() }]);
    addAuditLog('SOFT_DELETE', 'Product', id, `Produk ${target.name} dipindahkan ke Tong Sampah`);
    showToast(`Produk "${target.name}" dipindahkan ke Tong Sampah.`);
  };

  const restoreProduct = (id: string) => {
    const target = trashProducts.find((p) => p.id === id);
    if (!target) return;
    setTrashProducts((prev) => prev.filter((p) => p.id !== id));
    setProducts((prev) => [...prev, { ...target, deleted_at: null }]);
    addAuditLog('RESTORE_PRODUCT', 'Product', id, `Produk ${target.name} dipulihkan dari Tong Sampah`);
    showToast(`Produk "${target.name}" berhasil dipulihkan.`);
  };

  // Financial Gate Operations
  const unlockFinancialGate = (passcode: string): boolean => {
    if (passcode === '123456' || passcode === '888888') {
      setIsFinancialUnlocked(true);
      setFinancialLockRemainingSeconds(300);
      addAuditLog('FINANCIAL_UNLOCK_SUCCESS', 'SecurityGate', 'owner-auth', 'Owner berhasil membuka laporan keuangan');
      showToast('Verifikasi Owner berhasil. Sesi aktif selama 5 menit.');
      return true;
    } else {
      addAuditLog('FINANCIAL_UNLOCK_FAILED', 'SecurityGate', 'owner-auth', 'Percobaan verifikasi passcode gagal');
      showToast('Passcode salah. Akses finansial ditolak.');
      return false;
    }
  };

  const lockFinancialGate = () => {
    setIsFinancialUnlocked(false);
    setFinancialLockRemainingSeconds(300);
    showToast('Laporan keuangan dikunci kembali.');
  };

  const updateStoreSettings = (newSettings: Partial<StoreSettings>) => {
    setStoreSettings((prev) => {
      const updated: StoreSettings = {
        ...prev,
        ...newSettings,
        paymentMethods: {
          ...prev.paymentMethods,
          ...(newSettings.paymentMethods || {}),
        },
      };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('bubur_khalid_settings', JSON.stringify(updated));
        } catch (e) {}
      }

      // Sync store settings to Supabase Cloud
      supabase
        .from('store_settings')
        .upsert([
          {
            id: 'store-config',
            store_name: updated.storeName,
            store_tagline: updated.storeTagline,
            store_address: updated.storeAddress,
            store_logo: updated.storeLogo,
            banner_title: updated.bannerTitle,
            banner_subtitle: updated.bannerSubtitle,
            banner_image: updated.bannerImage,
            operating_hours: updated.operatingHours,
            admin_whatsapp: updated.adminWhatsapp,
            is_store_open: updated.isStoreOpen,
            cup_fee: updated.cupFee,
            cup_name: updated.cupName,
            cup_description: updated.cupDescription,
            cup_enabled: updated.cupEnabled,
            payment_methods: updated.paymentMethods,
          },
        ])
        .then(({ error }) => {
          if (error) console.warn('Supabase store settings sync error:', error.message);
        });

      addAuditLog('UPDATE_STORE_SETTINGS', 'Settings', 'store-config', 'Pengaturan banner dan metode pembayaran diperbarui oleh Admin');
      return updated;
    });
    showToast('Pengaturan banner & toko berhasil disimpan!');
  };

  // User & Security Management (Admin, Kasir, Owner, Dapur)
  const addUser = (userData: Omit<SystemUser, 'id' | 'created_at'>) => {
    const newUser: SystemUser = {
      ...userData,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0],
      is_active: true,
    };
    setUsers((prev) => [newUser, ...prev]);
    supabase
      .from('users')
      .upsert([newUser])
      .then(({ error }) => {
        if (error) console.warn('Supabase user upsert error:', error.message);
      });
    addAuditLog('ADD_USER', 'User', newUser.id, `User baru ditambahkan: ${newUser.name} (${newUser.role})`);
    showToast(`Pengguna "${newUser.name}" (${newUser.role}) berhasil ditambahkan!`);
  };

  const updateUser = (id: string, updated: Partial<SystemUser>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updatedUser = { ...u, ...updated };
          supabase
            .from('users')
            .upsert([updatedUser])
            .then(({ error }) => {
              if (error) console.warn('Supabase user update error:', error.message);
            });
          addAuditLog('UPDATE_USER', 'User', id, `Data pengguna "${u.name}" diperbarui`);

          // Jika role Owner dan ada nomor telepon/WA, sinkronkan juga ke adminWhatsapp toko
          if (updatedUser.role === 'OWNER' && updatedUser.phone) {
            setTimeout(() => {
              updateStoreSettings({ adminWhatsapp: updatedUser.phone });
            }, 100);
          }

          return updatedUser;
        }
        return u;
      })
    );
    showToast('Data pengguna berhasil diperbarui!');
  };

  const deleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    if (target.role === 'OWNER') {
      showToast('Akun Owner utama tidak dapat dihapus demi keamanan!');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    supabase
      .from('users')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase user delete error:', error.message);
      });
    addAuditLog('DELETE_USER', 'User', id, `Pengguna "${target.name}" (${target.role}) dihapus`);
    showToast(`Pengguna "${target.name}" telah dihapus.`);
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = !u.is_active;
          const updatedUser = { ...u, is_active: nextStatus };
          supabase
            .from('users')
            .upsert([updatedUser])
            .then(({ error }) => {
              if (error) console.warn('Supabase user status update error:', error.message);
            });
          addAuditLog('TOGGLE_USER_STATUS', 'User', id, `Status "${u.name}" diubah ke ${nextStatus ? 'AKTIF' : 'NON-AKTIF'}`);
          showToast(`Akun "${u.name}" sekarang ${nextStatus ? 'Aktif' : 'Dinonaktifkan'}.`);
          return updatedUser;
        }
        return u;
      })
    );
  };

  // User Authentication & Session Management
  const login = async (
    identifier: string,
    passOrPin: string,
    rememberMe: boolean = false
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = passOrPin.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'Harap masukkan ID/Email dan kata sandi' };
    }

    let target = users.find((u) => {
      const uName = u.username.toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      return uName === cleanId || uEmail === cleanId;
    });

    // If not found in local memory (e.g. newly registered from another device/browser), check Supabase directly
    if (!target) {
      try {
        const { data: cloudUsers, error: fetchErr } = await supabase
          .from('users')
          .select('*');
        if (!fetchErr && cloudUsers && cloudUsers.length > 0) {
          const freshUsers = cloudUsers.filter(
            (u: SystemUser) =>
              !['usr-1', 'usr-2', 'usr-3', 'usr-4'].includes(u.id) &&
              !['khalid_owner', 'ahmad_admin', 'siska_kasir', 'budi_kitchen'].includes(u.username)
          );
          setUsers(freshUsers);
          try {
            localStorage.setItem('bubur_khalid_users', JSON.stringify(freshUsers));
          } catch (e) {}

          target = freshUsers.find((u) => {
            const uName = u.username.toLowerCase();
            const uEmail = (u.email || '').toLowerCase();
            return uName === cleanId || uEmail === cleanId;
          });
        }
      } catch (err) {
        console.warn('Direct cloud login check error:', err);
      }
    }

    if (!target) {
      return { success: false, message: 'ID Pengguna atau Email tidak ditemukan' };
    }

    if (!target.is_active) {
      return { success: false, message: 'Akun Anda sedang dinonaktifkan oleh Owner' };
    }

    const isValidPassword =
      (target.pin && cleanPass === target.pin) ||
      (target.password && cleanPass === target.password);

    if (!isValidPassword) {
      return { success: false, message: 'Kata sandi atau PIN salah' };
    }

    const updatedUser: SystemUser = {
      ...target,
      last_login: 'Baru saja',
    };

    setCurrentUser(updatedUser);
    if (rememberMe) {
      try {
        localStorage.setItem('bubur_khalid_admin_session', JSON.stringify(updatedUser));
      } catch (e) {}
    } else {
      try {
        sessionStorage.setItem('bubur_khalid_admin_session', JSON.stringify(updatedUser));
        localStorage.removeItem('bubur_khalid_admin_session');
      } catch (e) {}
    }

    // Update last_login to Supabase
    supabase
      .from('users')
      .update({ last_login: 'Baru saja' })
      .eq('id', updatedUser.id)
      .then(() => {});

    addAuditLog('LOGIN', 'Auth', updatedUser.id, `Pengguna ${updatedUser.name} (${updatedUser.role}) berhasil masuk ke portal`);
    showToast(`Selamat datang, ${updatedUser.name}!`);
    return { success: true };
  };

  const signup = async (userData: {
    name: string;
    email: string;
    username: string;
    password: string;
    role: UserRole;
    phone?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanName = userData.name.trim();
    const cleanPassword = userData.password.trim();

    if (!cleanEmail || !cleanUsername || !cleanName || !cleanPassword) {
      return { success: false, message: 'Harap lengkapi semua data pendaftaran (Nama, Email, Username, Password)' };
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, message: 'Format email pribadi tidak valid' };
    }

    if (cleanPassword.length < 4) {
      return { success: false, message: 'Kata sandi minimal 4 karakter' };
    }

    // Check if email or username already taken
    const existing = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanEmail) ||
        u.username.toLowerCase() === cleanUsername
    );

    if (existing) {
      return { success: false, message: 'Email atau Username ini sudah terdaftar. Silakan masuk.' };
    }

    const newUser: SystemUser = {
      id: `usr-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      username: cleanUsername,
      role: userData.role || 'OWNER',
      pin: cleanPassword.length === 6 && /^\d+$/.test(cleanPassword) ? cleanPassword : '123456',
      password: cleanPassword,
      phone: userData.phone || '',
      created_at: new Date().toISOString().split('T')[0],
      is_active: true,
      last_login: 'Baru saja',
    };

    const nextUsers = [newUser, ...users];
    setUsers(nextUsers);
    try {
      localStorage.setItem('bubur_khalid_users', JSON.stringify(nextUsers));
    } catch (e) {}

    // Sync to Supabase Cloud
    try {
      const { error: upsertErr } = await supabase.from('users').upsert([newUser]);
      if (upsertErr) {
        console.warn('Supabase user upsert error:', upsertErr.message);
      }
    } catch (e) {}

    // Auto login after signup
    setCurrentUser(newUser);
    try {
      localStorage.setItem('bubur_khalid_admin_session', JSON.stringify(newUser));
    } catch (e) {}

    addAuditLog('SIGNUP', 'Auth', newUser.id, `Akun baru terdaftar: ${newUser.name} (${newUser.email}) sebagai ${newUser.role}`);
    showToast(`Pendaftaran berhasil! Selamat datang, ${newUser.name}!`);
    return { success: true };
  };

  const resetPassword = (
    emailOrUsername: string,
    newPass: string
  ): { success: boolean; message?: string } => {
    const cleanIdentifier = emailOrUsername.trim().toLowerCase();
    const cleanPassword = newPass.trim();

    if (!cleanIdentifier || !cleanPassword) {
      return { success: false, message: 'Harap masukkan email/username dan kata sandi baru' };
    }

    if (cleanPassword.length < 4) {
      return { success: false, message: 'Kata sandi baru minimal 4 karakter' };
    }

    const targetIndex = users.findIndex(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanIdentifier) ||
        u.username.toLowerCase() === cleanIdentifier
    );

    if (targetIndex === -1) {
      return { success: false, message: 'Akun dengan Email atau Username tersebut tidak ditemukan di perangkat ini' };
    }

    const updatedUser: SystemUser = {
      ...users[targetIndex],
      password: cleanPassword,
      pin: cleanPassword.length === 6 && /^\d+$/.test(cleanPassword) ? cleanPassword : '123456',
    };

    const nextUsers = [...users];
    nextUsers[targetIndex] = updatedUser;
    setUsers(nextUsers);
    try {
      localStorage.setItem('bubur_khalid_users', JSON.stringify(nextUsers));
    } catch (e) {}

    // Sync to Supabase Cloud
    supabase
      .from('users')
      .update({ password: cleanPassword, pin: updatedUser.pin })
      .eq('id', updatedUser.id)
      .then(({ error }) => {
        if (error) console.warn('Supabase update password error:', error.message);
      });

    addAuditLog('RESET_PASSWORD', 'Auth', updatedUser.id, `Kata sandi direset untuk ${updatedUser.name}`);
    showToast('Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru.');
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('LOGOUT', 'Auth', currentUser.id, `Pengguna ${currentUser.name} keluar sesi`);
    }
    setCurrentUser(null);
    setIsFinancialUnlocked(false);
    try {
      localStorage.removeItem('bubur_khalid_admin_session');
      sessionStorage.removeItem('bubur_khalid_admin_session');
    } catch (e) {}
    showToast('Anda telah keluar dari sesi admin');
  };

  // Table Management Handlers
  const addTable = (tableData: Omit<TableInfo, 'id'>) => {
    const newId = `tbl-${Date.now()}`;
    const newTable: TableInfo = {
      ...tableData,
      id: newId,
    };
    setTables((prev) => [...prev, newTable]);
    addAuditLog('ADD_TABLE', 'Table', newId, `Meja baru ditambahkan: ${newTable.table_number} (${newTable.qr_token})`);
    showToast(`Meja "${newTable.table_number}" berhasil ditambahkan!`);
  };

  const updateTable = (id: string, updated: Partial<TableInfo>) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          addAuditLog('UPDATE_TABLE', 'Table', id, `Data meja "${t.table_number}" diperbarui`);
          return { ...t, ...updated };
        }
        return t;
      })
    );
    showToast('Data meja berhasil diperbarui!');
  };

  const deleteTable = (id: string) => {
    const target = tables.find((t) => t.id === id);
    if (!target) return;
    setTables((prev) => prev.filter((t) => t.id !== id));
    addAuditLog('DELETE_TABLE', 'Table', id, `Meja "${target.table_number}" dihapus`);
    showToast(`Meja "${target.table_number}" telah dihapus.`);
  };

  const toggleTableStatus = (id: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const next = !t.is_active;
          addAuditLog('TOGGLE_TABLE', 'Table', id, `Status meja "${t.table_number}" diubah menjadi ${next ? 'Aktif' : 'Non-Aktif'}`);
          showToast(`Status ${t.table_number} kini ${next ? 'Aktif' : 'Non-Aktif'}`);
          return { ...t, is_active: next };
        }
        return t;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        customerServiceType,
        setCustomerServiceType,
        selectedTable,
        setSelectedTable,
        products,
        trashProducts,
        toggleProductAvailability,
        updateProductPrice,
        updateProduct,
        addProduct,
        softDeleteProduct,
        restoreProduct,
        tables,
        addTable,
        updateTable,
        deleteTable,
        toggleTableStatus,
        orders,
        createCustomerOrder,
        attachTransferProof,
        createPosOrder,
        updateOrderStatus,
        customerCart,
        addToCustomerCart,
        updateCustomerCartQty,
        toggleCustomerCartCup,
        clearCustomerCart,
        customerCartTotal,
        posCart,
        addToPosCart,
        updatePosCartQty,
        togglePosCartCup,
        clearPosCart,
        posCartTotal,
        storeSettings,
        updateStoreSettings,
        promoBanners,
        addPromoBanner,
        updatePromoBanner,
        deletePromoBanner,
        togglePromoBannerStatus,
        users,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        currentUser,
        isAuthenticated: Boolean(currentUser),
        login,
        signup,
        resetPassword,
        logout,
        financialSummary: MOCK_FINANCIAL_SUMMARY,
        isFinancialUnlocked,
        unlockFinancialGate,
        lockFinancialGate,
        financialLockRemainingSeconds,
        auditLogs,
        addAuditLog,
        toastMessage,
        showToast,
      }}
    >
      {children}
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-matcha-leaf text-tofu-silkblaze px-5 py-3 rounded-xl shadow-floating border border-matcha-surface flex items-center space-x-3 transition-all transform animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-yolk-blaze animate-ping" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
