'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Product, Order, OrderStatus, PaymentMethod, TableInfo, AuditLog, FinancialSummary, StoreSettings, SystemUser, PromoBanner, UserRole, StaffSalary, OperationalExpense } from '../types';
import { INITIAL_PRODUCTS, INITIAL_TABLES, CUP_FEE, INITIAL_STORE_SETTINGS, INITIAL_USERS, INITIAL_PROMO_BANNERS, INITIAL_STAFF_SALARIES, INITIAL_OPERATIONAL_EXPENSES } from '../constants';
import { MOCK_ORDERS, MOCK_FINANCIAL_SUMMARY, MOCK_AUDIT_LOGS } from '../mock-data';
import { supabase } from '../supabase/client';
import { getJakartaDateStr, getJakartaMonthStr } from '../date-utils';
import { formatIndonesianWhatsappNumber, DEFAULT_ADMIN_WHATSAPP, DEFAULT_OWNER_WHATSAPP } from '../utils/phone';

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
  hardDeleteProduct: (id: string) => void;
  emptyProductTrash: () => void;

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
  unlockFinancialGate: (passcode: string, dynamicOtp?: string) => boolean;
  lockFinancialGate: () => void;
  financialLockRemainingSeconds: number;

  // Staff Salary Management (Payroll & Kalkulasi Pengeluaran)
  staffSalaries: StaffSalary[];
  addStaffSalary: (salary: Omit<StaffSalary, 'id' | 'created_at'>) => void;
  updateStaffSalary: (id: string, updated: Partial<StaffSalary>) => void;
  deleteStaffSalary: (id: string) => void;
  toggleStaffSalaryStatus: (id: string) => void;
  clearStaffSalaries: () => void;
  resetDefaultStaffSalaries: () => void;

  // Operational Expenses & Belanja Keluar (Bahan Pokok, Gas, Minyak, dll)
  operationalExpenses: OperationalExpense[];
  addOperationalExpense: (expense: Omit<OperationalExpense, 'id' | 'created_at'>) => void;
  updateOperationalExpense: (id: string, updated: Partial<OperationalExpense>) => void;
  deleteOperationalExpense: (id: string) => void;
  clearOperationalExpenses: () => void;

  // Financial Reset
  resetAllFinancialData: () => Promise<void>;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: string, entity: string, entityId: string, details: string) => void;

  // Cloud Sync & Clear
  syncFromCloud: () => Promise<void>;
  clearAllOrders: () => Promise<void>;

  // Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

export const formatOrderForDb = (order: Order) => {
  return {
    id: order.id,
    queue_number: order.queue_number,
    queue_channel: order.queue_channel,
    service_type: order.service_type,
    global_queue_sequence: order.global_queue_sequence,
    customer_name: order.customer_name || 'Pelanggan',
    customer_phone: order.customer_phone || null,
    table_id: order.table_id || null,
    table_number: order.table_number || null,
    order_status: order.order_status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    subtotal: Number(order.subtotal || 0),
    cup_fee: Number(order.cup_fee || 0),
    cup_count: Number(order.cup_count || 0),
    discount: Number(order.discount || 0),
    total_amount: Number(order.total_amount || 0),
    qris_reference: order.qris_reference || null,
    qris_provider: order.qris_provider || null,
    transfer_proof_image: order.transfer_proof_image || null,
    items: Array.isArray(order.items) ? order.items : [],
    status_history: Array.isArray(order.status_history) ? order.status_history : [],
    created_at: order.created_at || new Date().toISOString(),
    paid_at: order.paid_at || null,
  };
};

export const syncOrderToCloud = async (order: Order) => {
  try {
    const dbPayload = formatOrderForDb(order);
    const { error } = await supabase.from('orders').upsert([dbPayload]);
    if (error) {
      console.warn('Supabase order sync error:', error.message);
    }
  } catch (err) {
    console.warn('Failed to sync order to cloud:', err);
  }
};

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
  const [staffSalaries, setStaffSalaries] = useState<StaffSalary[]>(INITIAL_STAFF_SALARIES);
  const [operationalExpenses, setOperationalExpenses] = useState<OperationalExpense[]>(INITIAL_OPERATIONAL_EXPENSES);

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
                : DEFAULT_ADMIN_WHATSAPP;
            const cleanOwnerWhatsapp =
              parsed.ownerWhatsapp && parsed.ownerWhatsapp !== '6281234567890'
                ? parsed.ownerWhatsapp
                : DEFAULT_OWNER_WHATSAPP;
            setStoreSettings((prev) => ({
              ...prev,
              ...parsed,
              adminWhatsapp: cleanWhatsapp,
              ownerWhatsapp: cleanOwnerWhatsapp,
              paymentMethods: {
                qris: {
                  ...prev.paymentMethods.qris,
                  ...(parsed.paymentMethods?.qris || {}),
                },
                cash: {
                  ...prev.paymentMethods.cash,
                  ...(parsed.paymentMethods?.cash || {}),
                },
                transfer: {
                  ...prev.paymentMethods.transfer,
                  ...(parsed.paymentMethods?.transfer || {}),
                },
              },
            }));
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

        // Orders: Bersihkan data dummy test spesifik lama jika ada
        const savedOrders = localStorage.getItem('bubur_khalid_orders');
        if (savedOrders) {
          const parsed = JSON.parse(savedOrders);
          if (Array.isArray(parsed)) {
            const cleanOrders = parsed.filter(
              (o: Order) =>
                !['ord-on-025', 'ord-on-026', 'ord-on-027', 'ord-ot-012', 'ord-ot-013', 'ord-pos-1794416905553', 'ord-pos-1794440967709', 'ord-pos-1794416022064', 'ord-pos-1794416925451'].includes(o.id)
            );
            setOrders(cleanOrders);
            localStorage.setItem('bubur_khalid_orders', JSON.stringify(cleanOrders));
          }
        } else {
          setOrders([]);
        }

        // Audit Logs: Bersihkan log dummy lama
        const savedLogs = localStorage.getItem('bubur_khalid_audit_logs');
        if (savedLogs) {
          const parsed = JSON.parse(savedLogs);
          if (Array.isArray(parsed)) {
            const cleanLogs = parsed.filter(
              (l: AuditLog) => !['log-1', 'log-2', 'log-3'].includes(l.id)
            );
            setAuditLogs(cleanLogs);
            localStorage.setItem('bubur_khalid_audit_logs', JSON.stringify(cleanLogs));
          }
        } else {
          setAuditLogs([]);
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

        // Staff Salaries
        const savedSalaries = localStorage.getItem('bubur_khalid_staff_salaries');
        if (savedSalaries) {
          const parsed = JSON.parse(savedSalaries);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStaffSalaries(parsed);
          }
        }

        // Operational Expenses (Belanja Bahan Pokok, Gas, Minyak, dll)
        const savedExpenses = localStorage.getItem('bubur_khalid_operational_expenses');
        if (savedExpenses) {
          const parsed = JSON.parse(savedExpenses);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOperationalExpenses(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to load local storage:', err);
      } finally {
        setIsHydrated(true);
      }
    }
  }, []);

  // Sync Master Data from Supabase Cloud with Realtime Subscriptions & Auto-polling
  useEffect(() => {
    let isMounted = true;
    let isFetchingCloudData = false;

    async function fetchCloudData() {
      if (isFetchingCloudData || !isMounted) return;
      isFetchingCloudData = true;

      try {
        // 1. Users
        const { data: cloudUsers, error: uErr } = await supabase.from('users').select('*');
        if (!uErr && cloudUsers && cloudUsers.length > 0 && isMounted) {
          const cleanUsers = cloudUsers.filter(
            (u: SystemUser) =>
              !['usr-1', 'usr-2', 'usr-3', 'usr-4'].includes(u.id) &&
              !['khalid_owner', 'ahmad_admin', 'siska_kasir', 'budi_kitchen'].includes(u.username)
          );
          setUsers(cleanUsers);
          localStorage.setItem('bubur_khalid_users', JSON.stringify(cleanUsers));
        }

        // 2. Products
        const { data: cloudProds, error: pErr } = await supabase.from('products').select('*').order('sort_order', { ascending: true });
        if (!pErr && cloudProds && cloudProds.length > 0 && isMounted) {
          const active = cloudProds
            .filter((p: any) => !p.deleted_at)
            .map((p: any) => ({
              ...p,
              price: Number(p.price),
              is_available: Boolean(p.is_available),
            }));
          const trashed = cloudProds
            .filter((p: any) => p.deleted_at)
            .map((p: any) => ({
              ...p,
              price: Number(p.price),
              is_available: Boolean(p.is_available),
            }));
          setProducts(active);
          setTrashProducts(trashed);
          localStorage.setItem('bubur_khalid_products', JSON.stringify(active));
          localStorage.setItem('bubur_khalid_trash_products', JSON.stringify(trashed));
        }

        // 3. Orders: Smart Bidirectional Offline-First Sync
        const { data: cloudOrders, error: oErr } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!oErr && cloudOrders && isMounted) {
          const cleanCloudOrders: Order[] = cloudOrders
            .filter(
              (o: any) =>
                !['ord-on-025', 'ord-on-026', 'ord-on-027', 'ord-ot-012', 'ord-ot-013', 'ord-pos-1794416905553', 'ord-pos-1794440967709', 'ord-pos-1794416022064', 'ord-pos-1794416925451'].includes(o.id)
            )
            .map((o: any) => ({
              ...o,
              subtotal: Number(o.subtotal || 0),
              total_amount: Number(o.total_amount || 0),
              cup_fee: Number(o.cup_fee || 0),
              discount: Number(o.discount || 0),
              items: Array.isArray(o.items) ? o.items : [],
              status_history: Array.isArray(o.status_history) ? o.status_history : [],
            }));

          setOrders((currentOrders) => {
            const localMap = new Map<string, Order>();
            currentOrders.forEach((o) => localMap.set(o.id, o));

            const statusWeight: Record<OrderStatus, number> = {
              NEW: 0,
              CONFIRMED: 1,
              PREPARING: 2,
              READY: 3,
              COMPLETED: 4,
              REJECTED: 5,
              CANCELLED: 5,
            };

            const mergedList: Order[] = [];
            const processedIds = new Set<string>();

            // Merge cloud orders with local state
            for (const cloudOrd of cleanCloudOrders) {
              processedIds.add(cloudOrd.id);
              const localOrd = localMap.get(cloudOrd.id);

              if (!localOrd) {
                // Cloud order not present locally yet
                mergedList.push(cloudOrd);
              } else {
                const localW = statusWeight[localOrd.order_status] ?? 0;
                const cloudW = statusWeight[cloudOrd.order_status] ?? 0;
                const localHistLen = localOrd.status_history?.length || 0;
                const cloudHistLen = cloudOrd.status_history?.length || 0;

                // If local order has more advanced status or newer history, retain local & re-sync to cloud
                if (localW > cloudW || (localW === cloudW && localHistLen > cloudHistLen)) {
                  mergedList.push(localOrd);
                  syncOrderToCloud(localOrd);
                } else {
                  // Cloud is equal or ahead -> accept cloud
                  mergedList.push(cloudOrd);
                }
              }
            }

            // Keep any local orders not yet in cloud (e.g. freshly created POS or online order)
            for (const localOrd of currentOrders) {
              if (!processedIds.has(localOrd.id)) {
                mergedList.push(localOrd);
                syncOrderToCloud(localOrd);
              }
            }

            // Sort by created_at descending
            mergedList.sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            try {
              localStorage.setItem('bubur_khalid_orders', JSON.stringify(mergedList));
            } catch (e) {}

            return mergedList;
          });
        }

        // 4. Store Settings
        const { data: cloudSettings, error: sErr } = await supabase
          .from('store_settings')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (!sErr && cloudSettings && isMounted) {
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
                : prev.adminWhatsapp || DEFAULT_ADMIN_WHATSAPP,
            ownerWhatsapp:
              cloudSettings.payment_methods?._ownerWhatsapp ||
              cloudSettings.owner_whatsapp ||
              prev.ownerWhatsapp ||
              DEFAULT_OWNER_WHATSAPP,
            isStoreOpen: cloudSettings.is_store_open ?? prev.isStoreOpen,
            isStoreHoliday: cloudSettings.payment_methods?._holiday?.isHoliday ?? prev.isStoreHoliday ?? false,
            holidayReason: cloudSettings.payment_methods?._holiday?.reason ?? prev.holidayReason ?? 'Toko sedang libur hari ini. Buka kembali besok.',
            cupFee: Number(cloudSettings.cup_fee ?? prev.cupFee),
            cupName: cloudSettings.cup_name || prev.cupName,
            cupDescription: cloudSettings.cup_description || prev.cupDescription,
            cupEnabled: cloudSettings.cup_enabled ?? prev.cupEnabled,
            paymentMethods: {
              qris: {
                ...prev.paymentMethods.qris,
                ...(cloudSettings.payment_methods?.qris || {}),
              },
              cash: {
                ...prev.paymentMethods.cash,
                ...(cloudSettings.payment_methods?.cash || {}),
              },
              transfer: {
                ...prev.paymentMethods.transfer,
                ...(cloudSettings.payment_methods?.transfer || {}),
              },
            },
          }));

          if (cloudSettings.payment_methods?._salaries && Array.isArray(cloudSettings.payment_methods._salaries)) {
            setStaffSalaries(cloudSettings.payment_methods._salaries);
            localStorage.setItem('bubur_khalid_staff_salaries', JSON.stringify(cloudSettings.payment_methods._salaries));
          }

          if (cloudSettings.payment_methods?._expenses && Array.isArray(cloudSettings.payment_methods._expenses)) {
            setOperationalExpenses(cloudSettings.payment_methods._expenses);
            localStorage.setItem('bubur_khalid_operational_expenses', JSON.stringify(cloudSettings.payment_methods._expenses));
          }

          if (cloudSettings.payment_methods?._promoBanners && Array.isArray(cloudSettings.payment_methods._promoBanners)) {
            setPromoBanners(cloudSettings.payment_methods._promoBanners);
            localStorage.setItem('bubur_khalid_promo_banners', JSON.stringify(cloudSettings.payment_methods._promoBanners));
          }
        }

        // 5. Tables
        const { data: cloudTables, error: tErr } = await supabase.from('tables').select('*').order('table_number');
        if (!tErr && cloudTables && cloudTables.length > 0 && isMounted) {
          setTables(cloudTables);
          localStorage.setItem('bubur_khalid_tables', JSON.stringify(cloudTables));
        }

        // 6. Promo Banners (fallback table if not stored inside store_settings._promoBanners)
        if (!cloudSettings?.payment_methods?._promoBanners) {
          const { data: cloudBanners, error: bErr } = await supabase.from('promo_banners').select('*').order('sort_order');
          if (!bErr && cloudBanners && cloudBanners.length > 0 && isMounted) {
            setPromoBanners(cloudBanners);
            localStorage.setItem('bubur_khalid_promo_banners', JSON.stringify(cloudBanners));
          }
        }
      } catch (e) {
        console.warn('Supabase sync error:', e);
      } finally {
        isFetchingCloudData = false;
      }
    }

    if (isHydrated) {
      fetchCloudData();

      // Realtime subscription via Supabase Channel
      const realtimeChannel = supabase
        .channel('bubur-khalid-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          fetchCloudData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => {
          fetchCloudData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchCloudData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
          fetchCloudData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'promo_banners' }, () => {
          fetchCloudData();
        })
        .subscribe();

      // High-reliability polling fallback (every 7 seconds)
      const pollTimer = setInterval(() => {
        fetchCloudData();
      }, 7000);

      // Instant refresh on window focus / tab activation
      const handleFocus = () => fetchCloudData();
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchCloudData();
        }
      };

      // Instant cross-tab sync when localStorage updates
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'bubur_khalid_products' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) {
              setProducts(parsed);
            }
          } catch {}
        }
      };

      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('storage', handleStorageChange);

      return () => {
        isMounted = false;
        clearInterval(pollTimer);
        supabase.removeChannel(realtimeChannel);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('storage', handleStorageChange);
      };
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

  // Auto-sync Staff Salaries ke LocalStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem('bubur_khalid_staff_salaries', JSON.stringify(staffSalaries));
      } catch (e) {}
    }
  }, [staffSalaries, isHydrated]);

  // Auto-sync Operational Expenses (Belanja Bahan Pokok, Gas, Minyak) ke LocalStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem('bubur_khalid_operational_expenses', JSON.stringify(operationalExpenses));
      } catch (e) {}
    }
  }, [operationalExpenses, isHydrated]);

  const syncPromoBannersToCloud = (nextBanners: PromoBanner[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bubur_khalid_promo_banners', JSON.stringify(nextBanners));
      } catch (e) {}
    }
    supabase
      .from('store_settings')
      .select('payment_methods')
      .eq('id', 'store-config')
      .maybeSingle()
      .then(({ data }) => {
        const existing = data?.payment_methods || {};
        supabase
          .from('store_settings')
          .update({
            payment_methods: {
              ...existing,
              _promoBanners: nextBanners,
            },
          })
          .eq('id', 'store-config')
          .then(({ error }) => {
            if (error) console.warn('Supabase promo banners sync error:', error.message);
          });
      });
  };

  const addPromoBanner = (newBanner: Omit<PromoBanner, 'id'>) => {
    const banner: PromoBanner = {
      ...newBanner,
      id: `promo-${Date.now()}`,
    };
    setPromoBanners((prev) => {
      const next = [...prev, banner];
      syncPromoBannersToCloud(next);
      return next;
    });
    addAuditLog('CREATE', 'PromoBanner', banner.id, `Menambahkan banner promosi: ${banner.title}`);
    showToast('Banner promosi berhasil ditambahkan!');
  };

  const updatePromoBanner = (id: string, updates: Partial<PromoBanner>) => {
    setPromoBanners((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
      syncPromoBannersToCloud(next);
      return next;
    });
    addAuditLog('UPDATE', 'PromoBanner', id, `Memperbarui banner promosi`);
    showToast('Banner promosi berhasil diperbarui!');
  };

  const deletePromoBanner = (id: string) => {
    const target = promoBanners.find((b) => b.id === id);
    setPromoBanners((prev) => {
      const next = prev.filter((b) => b.id !== id);
      syncPromoBannersToCloud(next);
      return next;
    });
    addAuditLog('DELETE', 'PromoBanner', id, `Menghapus banner promosi: ${target?.title || id}`);
    showToast('Banner promosi telah dihapus');
  };

  const togglePromoBannerStatus = (id: string) => {
    setPromoBanners((prev) => {
      const next = prev.map((b) => {
        if (b.id === id) {
          const nextActive = !b.is_active;
          showToast(`Banner ${b.title} kini ${nextActive ? 'Aktif' : 'Nonaktif'}`);
          return { ...b, is_active: nextActive };
        }
        return b;
      });
      syncPromoBannersToCloud(next);
      return next;
    });
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
    if (storeSettings.isStoreHoliday || !storeSettings.isStoreOpen) {
      showToast(
        storeSettings.isStoreHoliday
          ? '🏖️ Toko sedang libur. Belum menerima pesanan saat ini.'
          : '🔒 Toko sedang tutup. Belum menerima pesanan saat ini.'
      );
      return;
    }
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
    // Security check: block order creation if store is closed or holiday
    if (storeSettings.isStoreHoliday || !storeSettings.isStoreOpen) {
      const msg = storeSettings.isStoreHoliday
        ? 'Toko sedang libur hari ini. Tidak dapat melakukan checkout atau pembayaran pesanan.'
        : 'Toko sedang tutup sementara. Tidak dapat melakukan checkout atau pembayaran pesanan.';
      showToast(`❌ ${msg}`);
      throw new Error(msg);
    }
    const onlineSeq = orders.filter((o) => o.queue_channel === 'ONLINE').length + 1;
    const globalSeq = orders.length + 1;
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

    setOrders((prev) => {
      const next = [newOrder, ...prev.filter((o) => o.id !== newOrder.id)];
      try {
        localStorage.setItem('bubur_khalid_orders', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    clearCustomerCart();

    // Sync order to Supabase Cloud with sanitized schema validation
    syncOrderToCloud(newOrder);

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
    supabase
      .from('orders')
      .update({ transfer_proof_image: proofUrl })
      .eq('id', orderId)
      .then(({ error }) => {
        if (error) console.warn('Supabase proof sync error:', error.message);
      });
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
    const otSeq = orders.filter((o) => o.queue_channel === 'IN_STORE').length + 1;
    const globalSeq = orders.length + 1;
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

    setOrders((prev) => {
      const next = [newOrder, ...prev.filter((o) => o.id !== newOrder.id)];
      try {
        localStorage.setItem('bubur_khalid_orders', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    clearPosCart();

    // Sync POS order to Supabase Cloud
    syncOrderToCloud(newOrder);

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
    const statusLabels: Record<OrderStatus, string> = {
      NEW: 'Pesanan Diterima',
      CONFIRMED: 'Pesanan Dikonfirmasi',
      PREPARING: 'Sedang Disiapkan',
      READY: 'Siap Disajikan / Diambil',
      COMPLETED: 'Pesanan Selesai',
      REJECTED: 'Pesanan Ditolak',
      CANCELLED: 'Pesanan Dibatalkan',
    };
    const timestampStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const currentOrder = orders.find((o) => o.id === orderId);
    const nextHistory = [
      ...(currentOrder?.status_history || []),
      {
        status: newStatus,
        label: statusLabels[newStatus],
        timestamp: timestampStr,
        actor,
      },
    ];
    const shouldMarkPaid =
      ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'].includes(newStatus) &&
      currentOrder?.payment_status === 'PENDING';
    const nextPaymentStatus = shouldMarkPaid ? 'PAID' : currentOrder?.payment_status;
    const nextPaidAt = shouldMarkPaid ? new Date().toISOString() : currentOrder?.paid_at;

    let updatedOrderObj: Order | null = null;

    setOrders((prev) => {
      const next = prev.map((ord) => {
        if (ord.id === orderId) {
          const updated: Order = {
            ...ord,
            order_status: newStatus,
            payment_status: nextPaymentStatus || ord.payment_status,
            paid_at: nextPaidAt ?? ord.paid_at,
            status_history: nextHistory,
          };
          updatedOrderObj = updated;
          return updated;
        }
        return ord;
      });
      try {
        localStorage.setItem('bubur_khalid_orders', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Sync status change & fresh status_history to Supabase Cloud
    if (updatedOrderObj) {
      syncOrderToCloud(updatedOrderObj);
    }

    addAuditLog('UPDATE_ORDER_STATUS', 'Order', orderId, `Status diperbarui menjadi ${newStatus} oleh ${actor}`);
    showToast(`Status pesanan diperbarui: ${newStatus}`);
  };

  // Master Product Operations (with Real-time Supabase Cloud Synchronization)
  const toggleProductAvailability = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;

    // Synchronous calculation: guaranteed correct boolean state
    const nextState = !Boolean(target.is_available);
    const targetName = target.name;

    // 1. Optimistic Local State Update
    const updatedProducts = products.map((p) =>
      p.id === id ? { ...p, is_available: nextState } : p
    );
    setProducts(updatedProducts);

    // 2. Immediate LocalStorage Update for Instant Sync across Customer/POS Views
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bubur_khalid_products', JSON.stringify(updatedProducts));
      } catch (e) {}
    }

    addAuditLog('TOGGLE_AVAILABILITY', 'Product', id, `Status ketersediaan diubah: ${nextState ? 'TERSEDIA' : 'HABIS'}`);
    showToast(`Menu "${targetName}" sekarang ${nextState ? 'TERSEDIA' : 'HABIS'}`);

    // 3. Guaranteed Boolean update to Supabase Cloud
    supabase
      .from('products')
      .update({ is_available: Boolean(nextState) })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase toggle product error:', error.message);
      });
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
    supabase
      .from('products')
      .update({ price: newPrice })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase price update error:', error.message);
      });
    showToast('Harga produk berhasil diperbarui.');
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          addAuditLog('UPDATE_PRODUCT', 'Product', id, `Menu "${p.name}" diperbarui`);
          return { ...p, ...updated };
        }
        return p;
      })
    );
    supabase
      .from('products')
      .update(updated)
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase product update error:', error.message);
      });
    showToast('Data menu berhasil diperbarui.');
  };

  const addProduct = (newProdData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [...prev, newProduct]);
    supabase
      .from('products')
      .upsert([newProduct])
      .then(({ error }) => {
        if (error) console.warn('Supabase add product error:', error.message);
      });
    addAuditLog('ADD_PRODUCT', 'Product', newProduct.id, `Menu baru "${newProduct.name}" ditambahkan`);
    showToast(`Menu baru "${newProduct.name}" berhasil ditambahkan.`);
  };

  const softDeleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const nowIso = new Date().toISOString();
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setTrashProducts((prev) => [...prev, { ...target, deleted_at: nowIso }]);
    supabase
      .from('products')
      .update({ deleted_at: nowIso })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase delete product error:', error.message);
      });
    addAuditLog('SOFT_DELETE', 'Product', id, `Produk ${target.name} dipindahkan ke Tong Sampah`);
    showToast(`Produk "${target.name}" dipindahkan ke Tong Sampah.`);
  };

  const restoreProduct = (id: string) => {
    const target = trashProducts.find((p) => p.id === id);
    if (!target) return;
    setTrashProducts((prev) => prev.filter((p) => p.id !== id));
    setProducts((prev) => [...prev, { ...target, deleted_at: null }]);
    supabase
      .from('products')
      .update({ deleted_at: null })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase restore product error:', error.message);
      });
    addAuditLog('RESTORE_PRODUCT', 'Product', id, `Produk ${target.name} dipulihkan dari Tong Sampah`);
    showToast(`Produk "${target.name}" berhasil dipulihkan.`);
  };

  const hardDeleteProduct = (id: string) => {
    const target = trashProducts.find((p) => p.id === id);
    setTrashProducts((prev) => prev.filter((p) => p.id !== id));
    supabase
      .from('products')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase hard delete product error:', error.message);
      });
    addAuditLog('HARD_DELETE', 'Product', id, `Produk ${target?.name || id} dihapus permanen`);
    showToast(`Produk "${target?.name || id}" telah dihapus permanen.`);
  };

  const emptyProductTrash = () => {
    if (trashProducts.length === 0) return;
    const ids = trashProducts.map((p) => p.id);
    const count = trashProducts.length;
    setTrashProducts([]);
    supabase
      .from('products')
      .delete()
      .in('id', ids)
      .then(({ error }) => {
        if (error) console.warn('Supabase empty trash error:', error.message);
      });
    addAuditLog('EMPTY_TRASH', 'Product', 'all', `Seluruh tong sampah (${count} menu) dikosongkan permanen`);
    showToast(`Seluruh item (${count} menu) di Tong Sampah telah dihapus permanen.`);
  };

  // Financial Gate Operations
  const unlockFinancialGate = (passcode: string, dynamicOtp?: string): boolean => {
    const trimmedInput = passcode.trim();
    const isOtpValid = Boolean(dynamicOtp && trimmedInput === dynamicOtp.trim());

    // Validasi keamanan: hanya cocokkan dengan dynamic OTP atau Kredensial Asli Owner (Password / PIN Pribadi)
    const ownerUser = users.find((u) => u.role === 'OWNER') || currentUser;
    const ownerPass = (ownerUser?.password || '').trim();
    const ownerPin = (ownerUser?.pin || '').trim();

    const isPasswordMatch = Boolean(
      ownerPass &&
      (trimmedInput === ownerPass ||
       (ownerPass.endsWith('.') && trimmedInput === ownerPass.slice(0, -1)) ||
       (!ownerPass.endsWith('.') && trimmedInput + '.' === ownerPass))
    );

    const isPinMatch = Boolean(ownerPin && trimmedInput === ownerPin);

    if (isOtpValid || isPasswordMatch || isPinMatch) {
      setIsFinancialUnlocked(true);
      setFinancialLockRemainingSeconds(300);
      addAuditLog(
        'FINANCIAL_UNLOCK_SUCCESS',
        'SecurityGate',
        'owner-auth',
        isOtpValid
          ? 'Owner berhasil verifikasi OTP Keamanan'
          : 'Owner berhasil membuka laporan keuangan via Kredensial Akun Resmi'
      );
      showToast('Verifikasi Owner berhasil! Sesi aktif selama 5 menit.');
      return true;
    } else {
      addAuditLog('FINANCIAL_UNLOCK_FAILED', 'SecurityGate', 'owner-auth', 'Percobaan verifikasi passcode/OTP gagal');
      showToast('Kode OTP, PIN, atau Kata Sandi salah. Akses finansial ditolak.');
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

      // Sync store settings to Supabase Cloud (preserve _salaries, _expenses, and _promoBanners)
      const holidayPayload = {
        isHoliday: Boolean(updated.isStoreHoliday),
        reason: updated.holidayReason || '',
      };

      supabase
        .from('store_settings')
        .select('payment_methods')
        .eq('id', 'store-config')
        .maybeSingle()
        .then(({ data }) => {
          const existingPm = data?.payment_methods || {};
          const paymentMethodsPayload = {
            ...existingPm,
            ...updated.paymentMethods,
            _ownerWhatsapp: updated.ownerWhatsapp || existingPm._ownerWhatsapp || DEFAULT_OWNER_WHATSAPP,
            _holiday: holidayPayload,
            _salaries: existingPm._salaries ?? staffSalaries,
            _expenses: existingPm._expenses ?? operationalExpenses,
            _promoBanners: existingPm._promoBanners ?? promoBanners,
          };

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
                is_store_open: updated.isStoreHoliday ? false : updated.isStoreOpen,
                cup_fee: updated.cupFee,
                cup_name: updated.cupName,
                cup_description: updated.cupDescription,
                cup_enabled: updated.cupEnabled,
                payment_methods: paymentMethodsPayload,
              },
            ])
            .then(({ error }) => {
              if (error) console.warn('Supabase store settings sync error:', error.message);
            });
        });

      addAuditLog('UPDATE_STORE_SETTINGS', 'Settings', 'store-config', 'Pengaturan banner dan metode pembayaran diperbarui oleh Admin');
      return updated;
    });
    showToast('Pengaturan banner & toko berhasil disimpan!');
  };

  // User & Security Management (Admin, Kasir, Owner, Dapur)
  const addUser = (userData: Omit<SystemUser, 'id' | 'created_at'>) => {
    if (currentUser && currentUser.role !== 'OWNER') {
      showToast('❌ Akses ditolak: Hanya Owner yang berhak mendaftarkan akun baru.');
      return;
    }
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
    if (currentUser && currentUser.role !== 'OWNER' && currentUser.id !== id) {
      showToast('❌ Akses ditolak: Anda hanya diizinkan mengganti sandi akun Anda sendiri.');
      return;
    }
    // Cegah eskalasi hak akses oleh non-owner
    if (currentUser && currentUser.role !== 'OWNER') {
      delete updated.role;
      delete updated.is_active;
    }

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
          addAuditLog('UPDATE_USER', 'User', id, `Data kredensial pengguna "${u.name}" diperbarui`);

          // Sinkronkan nomor WA ke StoreSettings secara terpisah sesuai perannya (Admin vs Owner terpisah dan tidak saling menimpa)
          if (updatedUser.role === 'OWNER' && updatedUser.phone) {
            setTimeout(() => {
              updateStoreSettings({ ownerWhatsapp: updatedUser.phone });
            }, 100);
          } else if (updatedUser.role === 'ADMIN' && updatedUser.phone) {
            setTimeout(() => {
              updateStoreSettings({ adminWhatsapp: updatedUser.phone });
            }, 100);
          }

          // Sinkronkan ke currentUser jika user yang sedang login mengedit akunnya sendiri
          if (currentUser && currentUser.id === id) {
            setCurrentUser(updatedUser);
            try {
              localStorage.setItem('bubur_khalid_logged_user', JSON.stringify(updatedUser));
            } catch (e) {}
          }

          return updatedUser;
        }
        return u;
      })
    );
    showToast('Kata sandi / profil pengguna berhasil diperbarui!');
  };

  const deleteUser = (id: string) => {
    if (currentUser && currentUser.role !== 'OWNER') {
      showToast('❌ Akses ditolak: Hanya Owner yang berhak menghapus akun karyawan.');
      return;
    }
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
    if (currentUser && currentUser.role !== 'OWNER') {
      showToast('❌ Akses ditolak: Hanya Owner yang dapat mengubah status aktifasi akun.');
      return;
    }
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

  // Staff Salary Management & Payroll (Owner Financial)
  const syncSalariesToCloud = (nextSalaries: StaffSalary[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bubur_khalid_staff_salaries', JSON.stringify(nextSalaries));
      } catch (e) {}
    }
    supabase
      .from('store_settings')
      .select('payment_methods')
      .eq('id', 'store-config')
      .maybeSingle()
      .then(({ data }) => {
        const existing = data?.payment_methods || {};
        supabase
          .from('store_settings')
          .update({
            payment_methods: {
              ...existing,
              _salaries: nextSalaries,
            },
          })
          .eq('id', 'store-config')
          .then(({ error }) => {
            if (error) console.warn('Supabase salaries sync error:', error.message);
          });
      });
  };

  const addStaffSalary = (salaryData: Omit<StaffSalary, 'id' | 'created_at'>) => {
    const newSalary: StaffSalary = {
      ...salaryData,
      id: `sal-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setStaffSalaries((prev) => {
      const next = [newSalary, ...prev];
      syncSalariesToCloud(next);
      return next;
    });
    addAuditLog('ADD_STAFF_SALARY', 'Payroll', newSalary.id, `Input gaji ${newSalary.name} (${newSalary.role}): Rp ${newSalary.salary_amount.toLocaleString('id-ID')}`);
    showToast(`Data gaji ${newSalary.name} berhasil disimpan!`);
  };

  const updateStaffSalary = (id: string, updated: Partial<StaffSalary>) => {
    setStaffSalaries((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updated } : s));
      syncSalariesToCloud(next);
      return next;
    });
    addAuditLog('UPDATE_STAFF_SALARY', 'Payroll', id, `Pembaruan data gaji karyawan`);
    showToast('Data gaji karyawan berhasil diperbarui!');
  };

  const deleteStaffSalary = (id: string) => {
    const target = staffSalaries.find((s) => s.id === id);
    setStaffSalaries((prev) => {
      const next = prev.filter((s) => s.id !== id);
      syncSalariesToCloud(next);
      return next;
    });
    if (target) {
      addAuditLog('DELETE_STAFF_SALARY', 'Payroll', id, `Hapus data gaji ${target.name}`);
      showToast(`Data gaji ${target.name} telah dihapus.`);
    }
  };

  const toggleStaffSalaryStatus = (id: string) => {
    setStaffSalaries((prev) => {
      const next = prev.map((s) => {
        if (s.id === id) {
          const nextStatus: 'PAID' | 'PENDING' = s.payment_status === 'PAID' ? 'PENDING' : 'PAID';
          addAuditLog('TOGGLE_SALARY_STATUS', 'Payroll', id, `Status gaji ${s.name} diubah menjadi ${nextStatus}`);
          showToast(`Status gaji ${s.name}: ${nextStatus === 'PAID' ? 'LUNAS (Terbayar)' : 'PENDING (Belum Bayar)'}`);
          return { ...s, payment_status: nextStatus };
        }
        return s;
      });
      syncSalariesToCloud(next);
      return next;
    });
  };

  const clearStaffSalaries = () => {
    setStaffSalaries([]);
    syncSalariesToCloud([]);
    addAuditLog('CLEAR_SALARIES', 'Payroll', 'all', 'Daftar gaji karyawan dikosongkan (reset ke 0)');
    showToast('Daftar gaji karyawan telah dikosongkan.');
  };

  const resetDefaultStaffSalaries = () => {
    setStaffSalaries([]);
    syncSalariesToCloud([]);
    addAuditLog('RESET_SALARIES', 'Payroll', 'all', 'Gaji karyawan di-reset ke 0');
    showToast('Gaji karyawan di-reset ke 0.');
  };

  // Operational Expenses & Belanja Keluar (Bahan Pokok, Gas, Minyak, dll)
  const syncExpensesToCloud = (nextExpenses: OperationalExpense[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bubur_khalid_operational_expenses', JSON.stringify(nextExpenses));
      } catch (e) {}
    }
    supabase
      .from('store_settings')
      .select('payment_methods')
      .eq('id', 'store-config')
      .maybeSingle()
      .then(({ data }) => {
        const existing = data?.payment_methods || {};
        supabase
          .from('store_settings')
          .update({
            payment_methods: {
              ...existing,
              _expenses: nextExpenses,
            },
          })
          .eq('id', 'store-config')
          .then(({ error }) => {
            if (error) console.warn('Supabase expenses sync error:', error.message);
          });
      });
  };

  const addOperationalExpense = (expenseData: Omit<OperationalExpense, 'id' | 'created_at'>) => {
    const newExpense: OperationalExpense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setOperationalExpenses((prev) => {
      const next = [newExpense, ...prev];
      syncExpensesToCloud(next);
      return next;
    });
    addAuditLog('ADD_EXPENSE', 'Financial', newExpense.id, `Input belanja keluar: ${newExpense.item_name} (Rp ${newExpense.amount.toLocaleString('id-ID')})`);
    showToast(`Belanja keluar "${newExpense.item_name}" berhasil dicatat!`);
  };

  const updateOperationalExpense = (id: string, updated: Partial<OperationalExpense>) => {
    setOperationalExpenses((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...updated } : e));
      syncExpensesToCloud(next);
      return next;
    });
    addAuditLog('UPDATE_EXPENSE', 'Financial', id, `Pembaruan data belanja operasional`);
    showToast('Catatan belanja keluar berhasil diperbarui!');
  };

  const deleteOperationalExpense = (id: string) => {
    const target = operationalExpenses.find((e) => e.id === id);
    setOperationalExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      syncExpensesToCloud(next);
      return next;
    });
    if (target) {
      addAuditLog('DELETE_EXPENSE', 'Financial', id, `Hapus catatan belanja ${target.item_name}`);
      showToast(`Catatan belanja "${target.item_name}" telah dihapus.`);
    }
  };

  const clearOperationalExpenses = () => {
    setOperationalExpenses([]);
    syncExpensesToCloud([]);
    addAuditLog('CLEAR_EXPENSES', 'Financial', 'all', 'Daftar belanja bahan pokok & modal keluar dikosongkan (reset ke Rp 0)');
    showToast('Seluruh catatan belanja keluar telah di-reset ke Rp 0.');
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

    const matchesUser = (u: SystemUser) => {
      const uUsername = (u.username || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      const uName = (u.name || '').trim().toLowerCase();
      const uPhone = (u.phone || '').trim().replace(/[^0-9]/g, '');
      const idPhone = cleanId.replace(/[^0-9]/g, '');
      const uPhoneNormalized = u.phone ? formatIndonesianWhatsappNumber(u.phone, '') : '';
      const idPhoneNormalized = formatIndonesianWhatsappNumber(cleanId, '');
      const isPhoneMatch =
        (Boolean(uPhone) && Boolean(idPhone) && uPhone === idPhone) ||
        (Boolean(uPhoneNormalized) && Boolean(idPhoneNormalized) && uPhoneNormalized === idPhoneNormalized);

      return (
        uUsername === cleanId ||
        uEmail === cleanId ||
        uName === cleanId ||
        isPhoneMatch
      );
    };

    // 1. Try local memory match
    let target = users.find(matchesUser);

    // 2. Always query Supabase directly to guarantee latest database state
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

        const cloudMatch = freshUsers.find(matchesUser);
        if (cloudMatch) {
          target = cloudMatch;
        }
      }
    } catch (err) {
      console.warn('Direct cloud login check error:', err);
    }

    if (!target) {
      return { success: false, message: 'ID Pengguna atau Email tidak ditemukan' };
    }

    if (!target.is_active) {
      return { success: false, message: 'Akun Anda sedang dinonaktifkan oleh Owner' };
    }

    const userPass = (target.password || '').trim();
    const userPin = (target.pin || '').trim();

    const isValidPassword =
      (userPass && cleanPass === userPass) ||
      (userPin && cleanPass === userPin) ||
      (userPass && cleanPass.endsWith('.') && cleanPass.slice(0, -1) === userPass) ||
      (userPass && !cleanPass.endsWith('.') && cleanPass + '.' === userPass);

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

    // Jika role Owner dan mengisi nomor HP, simpan ke ownerWhatsapp (tanpa menimpa adminWhatsapp)
    if (newUser.role === 'OWNER' && newUser.phone) {
      setTimeout(() => {
        updateStoreSettings({ ownerWhatsapp: newUser.phone });
      }, 100);
    }

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
        (u.username && u.username.toLowerCase() === cleanIdentifier) ||
        (u.name && u.name.toLowerCase() === cleanIdentifier)
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
    supabase
      .from('tables')
      .upsert([
        {
          id: newTable.id,
          table_number: newTable.table_number,
          qr_token: newTable.qr_token,
          is_active: newTable.is_active,
        },
      ])
      .then(({ error }) => {
        if (error) console.warn('Supabase add table error:', error.message);
      });
    addAuditLog('ADD_TABLE', 'Table', newId, `Meja baru ditambahkan: ${newTable.table_number} (${newTable.qr_token})`);
    showToast(`Meja "${newTable.table_number}" berhasil ditambahkan!`);
  };

  const updateTable = (id: string, updated: Partial<TableInfo>) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextTable = { ...t, ...updated };
          addAuditLog('UPDATE_TABLE', 'Table', id, `Data meja "${t.table_number}" diperbarui`);
          supabase
            .from('tables')
            .upsert([
              {
                id: nextTable.id,
                table_number: nextTable.table_number,
                qr_token: nextTable.qr_token,
                is_active: nextTable.is_active,
              },
            ])
            .then(({ error }) => {
              if (error) console.warn('Supabase update table error:', error.message);
            });
          return nextTable;
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
    supabase.from('tables').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Supabase delete table error:', error.message);
    });
    addAuditLog('DELETE_TABLE', 'Table', id, `Meja "${target.table_number}" dihapus`);
    showToast(`Meja "${target.table_number}" telah dihapus.`);
  };

  const toggleTableStatus = (id: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const next = !t.is_active;
          supabase
            .from('tables')
            .upsert([
              {
                id: t.id,
                table_number: t.table_number,
                qr_token: t.qr_token,
                is_active: next,
              },
            ])
            .then(({ error }) => {
              if (error) console.warn('Supabase toggle table error:', error.message);
            });
          addAuditLog('TOGGLE_TABLE', 'Table', id, `Status meja "${t.table_number}" diubah menjadi ${next ? 'Aktif' : 'Non-Aktif'}`);
          showToast(`Status ${t.table_number} kini ${next ? 'Aktif' : 'Non-Aktif'}`);
          return { ...t, is_active: next };
        }
        return t;
      })
    );
  };

  // Dynamic Financial Summary derived from real orders in Asia/Jakarta timezone
  const financialSummary = useMemo<FinancialSummary>(() => {
    const today = getJakartaDateStr(new Date());
    const currentMonth = getJakartaMonthStr(new Date());

    let today_revenue = 0;
    let today_transactions = 0;
    let today_online_revenue = 0;
    let today_instore_revenue = 0;

    let month_revenue = 0;
    let month_transactions = 0;
    let month_online_revenue = 0;
    let month_instore_revenue = 0;

    orders.forEach((o) => {
      if (o.order_status === 'CANCELLED') return;
      const dateStr = getJakartaDateStr(o.created_at);
      const isToday = dateStr === today;
      const isMonth = dateStr.startsWith(currentMonth);

      if (isToday) {
        today_revenue += o.total_amount || 0;
        today_transactions += 1;
        if (o.queue_channel === 'ONLINE') {
          today_online_revenue += o.total_amount || 0;
        } else {
          today_instore_revenue += o.total_amount || 0;
        }
      }

      if (isMonth) {
        month_revenue += o.total_amount || 0;
        month_transactions += 1;
        if (o.queue_channel === 'ONLINE') {
          month_online_revenue += o.total_amount || 0;
        } else {
          month_instore_revenue += o.total_amount || 0;
        }
      }
    });

    const today_aov = today_transactions > 0 ? Math.round(today_revenue / today_transactions) : 0;

    return {
      today_revenue,
      today_transactions,
      today_online_revenue,
      today_instore_revenue,
      today_aov,
      month_revenue,
      month_transactions,
      month_online_revenue,
      month_instore_revenue,
      refunds_total: 0,
      net_revenue: month_revenue,
    };
  }, [orders]);

  // Force re-sync data directly from Supabase Cloud (wipes local cache discrepancies)
  const syncFromCloud = async () => {
    try {
      showToast('Menghubungkan & sinkronisasi data cloud Supabase...');
      // 1. Fetch products
      const { data: pData } = await supabase.from('products').select('*').order('sort_order', { ascending: true });
      if (pData && pData.length > 0) {
        const active = pData
          .filter((p: any) => !p.deleted_at)
          .map((p: any) => ({
            ...p,
            price: Number(p.price),
            is_available: Boolean(p.is_available),
          }));
        const trashed = pData
          .filter((p: any) => p.deleted_at)
          .map((p: any) => ({
            ...p,
            price: Number(p.price),
            is_available: Boolean(p.is_available),
          }));
        setProducts(active);
        setTrashProducts(trashed);
        localStorage.setItem('bubur_khalid_products', JSON.stringify(active));
        localStorage.setItem('bubur_khalid_trash_products', JSON.stringify(trashed));
      }

      // 2. Fetch orders
      const { data: cloudOrders, error: oErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!oErr && cloudOrders) {
        const cleanCloudOrders = cloudOrders
          .filter(
            (o: any) =>
              !['ord-on-025', 'ord-on-026', 'ord-on-027', 'ord-ot-012', 'ord-ot-013', 'ord-pos-1794416905553', 'ord-pos-1794440967709', 'ord-pos-1794416022064', 'ord-pos-1794416925451'].includes(o.id) &&
              !['ON-025', 'ON-026', 'ON-027', 'OT-012', 'OT-013', 'OT-015', 'OT-016', 'OT-017'].includes(o.queue_number)
          )
          .map((o: any) => ({
            ...o,
            subtotal: Number(o.subtotal || 0),
            total_amount: Number(o.total_amount || 0),
            cup_fee: Number(o.cup_fee || 0),
            discount: Number(o.discount || 0),
          }));
        setOrders(cleanCloudOrders);
        localStorage.setItem('bubur_khalid_orders', JSON.stringify(cleanCloudOrders));
      }

      // 3. Fetch store settings
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
              : prev.adminWhatsapp || DEFAULT_ADMIN_WHATSAPP,
          ownerWhatsapp:
            cloudSettings.payment_methods?._ownerWhatsapp ||
            cloudSettings.owner_whatsapp ||
            prev.ownerWhatsapp ||
            DEFAULT_OWNER_WHATSAPP,
          isStoreOpen: cloudSettings.is_store_open ?? prev.isStoreOpen,
          isStoreHoliday: cloudSettings.payment_methods?._holiday?.isHoliday ?? prev.isStoreHoliday ?? false,
          holidayReason: cloudSettings.payment_methods?._holiday?.reason ?? prev.holidayReason ?? 'Toko sedang libur hari ini. Buka kembali besok.',
          cupFee: Number(cloudSettings.cup_fee ?? prev.cupFee),
          cupName: cloudSettings.cup_name || prev.cupName,
          cupDescription: cloudSettings.cup_description || prev.cupDescription,
          cupEnabled: cloudSettings.cup_enabled ?? prev.cupEnabled,
          paymentMethods: {
            qris: {
              ...prev.paymentMethods.qris,
              ...(cloudSettings.payment_methods?.qris || {}),
            },
            cash: {
              ...prev.paymentMethods.cash,
              ...(cloudSettings.payment_methods?.cash || {}),
            },
            transfer: {
              ...prev.paymentMethods.transfer,
              ...(cloudSettings.payment_methods?.transfer || {}),
            },
          },
        }));

        if (cloudSettings.payment_methods?._salaries && Array.isArray(cloudSettings.payment_methods._salaries)) {
          setStaffSalaries(cloudSettings.payment_methods._salaries);
          localStorage.setItem('bubur_khalid_staff_salaries', JSON.stringify(cloudSettings.payment_methods._salaries));
        }

        if (cloudSettings.payment_methods?._expenses && Array.isArray(cloudSettings.payment_methods._expenses)) {
          setOperationalExpenses(cloudSettings.payment_methods._expenses);
          localStorage.setItem('bubur_khalid_operational_expenses', JSON.stringify(cloudSettings.payment_methods._expenses));
        }

        if (cloudSettings.payment_methods?._promoBanners && Array.isArray(cloudSettings.payment_methods._promoBanners)) {
          setPromoBanners(cloudSettings.payment_methods._promoBanners);
          localStorage.setItem('bubur_khalid_promo_banners', JSON.stringify(cloudSettings.payment_methods._promoBanners));
        }
      }

      // 4. Fetch tables
      const { data: cloudTables, error: tErr } = await supabase.from('tables').select('*').order('table_number');
      if (!tErr && cloudTables && cloudTables.length > 0) {
        setTables(cloudTables);
        localStorage.setItem('bubur_khalid_tables', JSON.stringify(cloudTables));
      }

      showToast('✅ Data berhasil disinkronkan langsung dari Cloud!');
    } catch (err: any) {
      showToast('Gagal sinkronisasi data: ' + err.message);
    }
  };

  // Clear all orders (Hard Reset to start fresh with real operational transactions)
  const clearAllOrders = async () => {
    try {
      showToast('Membersihkan data transaksi...');
      await supabase.from('orders').delete().neq('id', 'keep-none');
      setOrders([]);
      try {
        localStorage.setItem('bubur_khalid_orders', JSON.stringify([]));
      } catch (e) {}
      showToast('✅ Seluruh data transaksi berhasil di-reset.');
    } catch (err: any) {
      showToast('Gagal membersihkan transaksi: ' + err.message);
    }
  };

  // Reset Seluruh Keuangan & Gaji ke Rp 0 (Khusus Akses Owner Khalid)
  const resetAllFinancialData = async () => {
    try {
      showToast('Mereset seluruh data omzet & gaji ke Rp 0...');
      // 1. Reset orders di Supabase & local state
      await supabase.from('orders').delete().neq('id', 'keep-none');
      setOrders([]);
      try {
        localStorage.setItem('bubur_khalid_orders', JSON.stringify([]));
      } catch (e) {}

      // 2. Reset staff salaries & operational expenses secara atomik agar tidak race condition di Supabase
      setStaffSalaries([]);
      setOperationalExpenses([]);
      try {
        localStorage.setItem('bubur_khalid_staff_salaries', JSON.stringify([]));
        localStorage.setItem('bubur_khalid_operational_expenses', JSON.stringify([]));
      } catch (e) {}

      const { data: cfg } = await supabase
        .from('store_settings')
        .select('payment_methods')
        .eq('id', 'store-config')
        .maybeSingle();
      const existingPm = cfg?.payment_methods || {};
      await supabase
        .from('store_settings')
        .update({
          payment_methods: {
            ...existingPm,
            _salaries: [],
            _expenses: [],
          },
        })
        .eq('id', 'store-config');

      addAuditLog('RESET_FINANCIAL_ALL', 'Financial', 'all', 'Owner mereset seluruh omzet penjualan, daftar gaji, dan belanja keluar ke Rp 0');
      showToast('✅ Seluruh transaksi, gaji, & belanja bahan berhasil di-reset ke Rp 0.');
    } catch (err: any) {
      showToast('Gagal mereset data keuangan: ' + err.message);
    }
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
        hardDeleteProduct,
        emptyProductTrash,
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
        financialSummary,
        isFinancialUnlocked,
        unlockFinancialGate,
        lockFinancialGate,
        financialLockRemainingSeconds,
        staffSalaries,
        addStaffSalary,
        updateStaffSalary,
        deleteStaffSalary,
        toggleStaffSalaryStatus,
        clearStaffSalaries,
        resetDefaultStaffSalaries,
        operationalExpenses,
        addOperationalExpense,
        updateOperationalExpense,
        deleteOperationalExpense,
        clearOperationalExpenses,
        resetAllFinancialData,
        auditLogs,
        addAuditLog,
        syncFromCloud,
        clearAllOrders,
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
