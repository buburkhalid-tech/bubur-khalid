-- =========================================================================
-- BUBUR KHALID - SKEMA DATABASE CLOUD TERPADU (SUPABASE)
-- Multi-Device Sync: POS Kasir, Kitchen Display, Web Pelanggan, & Finansial
-- =========================================================================

-- 1. TABEL PENGGUNA & STAF (Owner, Admin, Kasir, Dapur)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  password TEXT NOT NULL,
  pin TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TEXT
);

-- 2. TABEL MENU & HARGA PRODUK
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_available BOOLEAN DEFAULT true,
  image TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ
);

-- 3. TABEL TRANSAKSI & ANTREAN PESANAN (KASIR & WEB)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  queue_number TEXT NOT NULL,
  queue_channel TEXT NOT NULL,
  service_type TEXT NOT NULL,
  global_queue_sequence INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  table_id TEXT,
  table_number TEXT,
  order_status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  subtotal NUMERIC NOT NULL,
  cup_fee NUMERIC DEFAULT 0,
  cup_count INTEGER DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  qris_reference TEXT,
  qris_provider TEXT,
  transfer_proof_image TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- 4. TABEL PENGATURAN TOKO & BANNER
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'store-config',
  store_name TEXT NOT NULL DEFAULT 'Bubur Khalid',
  store_tagline TEXT DEFAULT 'Asli Khas Minang • Hangat & Gurih',
  store_address TEXT DEFAULT 'Jl. Zaini No. 1c',
  store_logo TEXT DEFAULT '/images/logo/bubur-khalid-logo.png',
  banner_title TEXT DEFAULT 'Selamat Datang',
  banner_subtitle TEXT DEFAULT 'Nikmati bubur tradisional khas kami, hangat, lezat, dan selalu segar setiap hari.',
  banner_image TEXT DEFAULT '/images/hero-banner-wide.jpg',
  operating_hours TEXT DEFAULT 'Buka: Senin–Sabtu 16.00–22.00 WIB',
  admin_whatsapp TEXT DEFAULT '6285274281819',
  is_store_open BOOLEAN DEFAULT true,
  cup_fee NUMERIC DEFAULT 1000,
  cup_name TEXT DEFAULT 'Kemasan Cup Bawa Pulang',
  cup_description TEXT DEFAULT 'higienis & anti tumpah',
  cup_enabled BOOLEAN DEFAULT true,
  payment_methods JSONB DEFAULT '{}'::jsonb
);

-- 5. TABEL KEUANGAN & FINANSIAL OWNER
CREATE TABLE IF NOT EXISTS public.financial_records (
  id TEXT PRIMARY KEY,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gross_sales NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  cash_total NUMERIC DEFAULT 0,
  qris_total NUMERIC DEFAULT 0,
  transfer_total NUMERIC DEFAULT 0,
  operational_expense NUMERIC DEFAULT 0,
  raw_material_expense NUMERIC DEFAULT 0,
  net_profit NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL MEJA & QR TOKEN
CREATE TABLE IF NOT EXISTS public.tables (
  id TEXT PRIMARY KEY,
  table_number TEXT NOT NULL,
  capacity INTEGER DEFAULT 4,
  is_occupied BOOLEAN DEFAULT false,
  qr_token TEXT
);

-- 7. TABEL PROMO BANNERS
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  discount_text TEXT,
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- 8. TABEL AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- AKTIFKAN ROW LEVEL SECURITY (RLS) DENGAN AKSES PUBLIC READ & WRITE
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- BUAT POLISI AKSES (PERMIT ALL AGAR DAPAT DIAKSES VIA PUBLISHABLE KEY)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public users access" ON public.users;
  CREATE POLICY "Public users access" ON public.users FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public products access" ON public.products;
  CREATE POLICY "Public products access" ON public.products FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public orders access" ON public.orders;
  CREATE POLICY "Public orders access" ON public.orders FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public store_settings access" ON public.store_settings;
  CREATE POLICY "Public store_settings access" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public financial access" ON public.financial_records;
  CREATE POLICY "Public financial access" ON public.financial_records FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public tables access" ON public.tables;
  CREATE POLICY "Public tables access" ON public.tables FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public promo_banners access" ON public.promo_banners;
  CREATE POLICY "Public promo_banners access" ON public.promo_banners FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public audit_logs access" ON public.audit_logs;
  CREATE POLICY "Public audit_logs access" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
END $$;
