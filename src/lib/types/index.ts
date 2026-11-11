export type ServiceType = 'DINE_IN' | 'TAKEAWAY';
export type QueueChannel = 'ONLINE' | 'IN_STORE';

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

export type PaymentMethod = 'QRIS' | 'CASH' | 'TRANSFER';

export type UserRole = 'OWNER' | 'ADMIN' | 'CASHIER' | 'KITCHEN_STAFF';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'Bubur' | 'Kolak' | 'Lopis' | 'Kerupuk' | 'Paket';
  description: string;
  image: string;
  is_available: boolean;
  sort_order: number;
  deleted_at?: string | null;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  image: string;
  discount_label?: string;
  link_url?: string;
  is_active: boolean;
  sort_order: number;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  item_notes?: string;
  use_cup?: boolean;
  cup_fee_snapshot?: number;
  line_total: number;
}

export interface Order {
  id: string;
  queue_number: string; // e.g. "ON-025", "OT-012"
  queue_channel: QueueChannel; // ONLINE or IN_STORE
  service_type: ServiceType; // DINE_IN or TAKEAWAY
  global_queue_sequence: number; // Global FIFO order sequence
  table_id?: string | null;
  table_number?: string | null;
  customer_name?: string;
  customer_phone?: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  cup_fee: number;
  cup_count: number;
  discount: number;
  total_amount: number;
  notes?: string;
  qris_reference?: string;
  qris_provider?: string;
  transfer_proof_image?: string;
  items: OrderItem[];
  created_at: string;
  paid_at?: string | null;
  status_history: {
    status: OrderStatus | PaymentStatus;
    label: string;
    timestamp: string;
    note?: string;
    actor?: string;
  }[];
}

export interface SystemUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  role: UserRole;
  pin?: string;
  password?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface TableInfo {
  id: string;
  table_number: string;
  qr_token: string;
  is_active: boolean;
  deleted_at?: string | null;
}

export interface AuditLog {
  id: string;
  actor: string;
  role: UserRole;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  timestamp: string;
}

export interface FinancialSummary {
  today_revenue: number;
  today_transactions: number;
  today_online_revenue: number;
  today_instore_revenue: number;
  today_aov: number; // Average Order Value
  month_revenue: number;
  month_transactions: number;
  month_online_revenue: number;
  month_instore_revenue: number;
  refunds_total: number;
  net_revenue: number;
}

export interface PaymentMethodConfig {
  enabled: boolean;
  name: string;
  description: string;
  icon?: string;
  details?: string;
  nmid?: string;
  qrisImageUrl?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  storeAddress?: string;
  storeLogo?: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerImage: string;
  operatingHours: string;
  adminWhatsapp: string;
  isStoreOpen: boolean;
  isStoreHoliday?: boolean;
  holidayReason?: string;
  cupFee: number;
  cupName?: string;
  cupDescription?: string;
  cupEnabled?: boolean;
  paymentMethods: {
    qris: PaymentMethodConfig;
    cash: PaymentMethodConfig;
    transfer: PaymentMethodConfig;
  };
}
