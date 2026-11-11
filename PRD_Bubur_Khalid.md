# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# BUBUR KHALID

## Customer Ordering Web App, POS, Admin Dashboard & Order Tracking

**Versi:** 1.1\
**Tanggal:** 8 November 2026\
**Status:** Baseline kebutuhan produk untuk prototype dan implementasi\
**Platform:** Customer Web App (mobile-first), Admin Web Dashboard
(mobile dan desktop)

------------------------------------------------------------------------

## 1. Ringkasan Produk

Bubur Khalid adalah sistem pemesanan dan kasir berbasis web untuk
operasional toko Bubur Khalid. Sistem menggabungkan pemesanan pelanggan
melalui website/QR Code, transaksi kasir untuk pelanggan yang datang
langsung, pembayaran, pengelolaan antrean, pemrosesan pesanan, live
order tracking, serta laporan penjualan dan pendapatan.

Sistem terdiri dari dua antarmuka utama:

1.  **Customer Web App** --- pelanggan membuka website melalui browser
    HP, memilih jenis pesanan, memilih menu, membayar, dan memantau
    status makanan.
2.  **Admin Dashboard / POS** --- pemilik dan staf mengelola pesanan
    online dan pesanan langsung di toko, menu, meja, pembayaran,
    operasional, serta laporan pendapatan harian dan bulanan.

Aplikasi pelanggan diprioritaskan untuk pengalaman mobile-first.
Dashboard admin harus responsif dan nyaman digunakan dari HP maupun
desktop.

## 2. Tujuan Produk

-   Memudahkan pelanggan memesan tanpa harus mengantre di kasir.
-   Mendukung pemesanan makan di tempat melalui QR Code meja dan
    takeaway melalui website.
-   Memisahkan antrean pesanan online dengan pesanan yang dimasukkan
    langsung oleh kasir.
-   Memastikan pesanan baru diproses setelah pembayaran terverifikasi.
-   Memungkinkan pelanggan melihat perkembangan pesanan secara
    real-time.
-   Memudahkan pemilik memantau operasional dan pendapatan hari ini
    maupun bulan berjalan.
-   Menyediakan laporan transaksi yang dapat difilter berdasarkan
    tanggal dan sumber pesanan.

## 3. Ruang Lingkup

### 3.1 Termasuk dalam MVP

-   Customer Web App responsif, mobile-first.
-   Pemilihan jenis pesanan: Makan di Tempat atau Takeaway.
-   QR Code unik untuk setiap meja.
-   Katalog menu, kategori, detail produk, keranjang, catatan pesanan.
-   Checkout dan pembayaran sebelum pesanan diproses.
-   Integrasi payment gateway untuk QRIS atau metode digital yang
    dipilih saat implementasi.
-   Pencatatan pembayaran tunai di kasir untuk transaksi langsung.
-   Admin Dashboard responsif untuk mobile dan desktop.
-   POS untuk pesanan langsung di toko.
-   Antrean Online dan antrean Di Tempat yang terpisah.
-   Pengelolaan status pesanan.
-   Live Order Tracking pelanggan.
-   Manajemen menu, kategori, harga, ketersediaan, meja dan QR Code.
-   Dashboard pendapatan hari ini dan bulan berjalan.
-   Laporan penjualan dan pendapatan dengan filter tanggal.
-   Riwayat transaksi dan detail pembayaran.
-   Role dan hak akses dasar.
-   Notifikasi pesanan baru dan perubahan status.

### 3.2 Tidak termasuk MVP kecuali diputuskan kemudian

-   Aplikasi native Android/iOS.
-   Program loyalitas dan poin.
-   Multi-cabang atau multi-outlet.
-   Akuntansi lengkap, pajak otomatis, dan pembukuan biaya operasional.
-   Integrasi layanan kurir pihak ketiga.
-   Pengelolaan inventaris bahan baku secara mendalam.
-   Prediksi penjualan berbasis AI.

## 4. Pengguna dan Hak Akses

### 4.1 Pelanggan

-   Melihat menu dan harga.
-   Memilih Makan di Tempat atau Takeaway.
-   Memilih meja melalui QR Code untuk dine-in.
-   Menambahkan produk ke keranjang.
-   Menambahkan catatan item.
-   Membuat pesanan dan membayar.
-   Melihat nomor antrean dan tracking pesanan.
-   Melihat riwayat pesanan jika identitas/kontak pelanggan dikumpulkan.

### 4.2 Owner

-   Memiliki akses penuh ke seluruh dashboard, pengaturan, dan laporan keuangan.
-   Mengelola antrean, menu, kategori, harga, ketersediaan, meja, QR Code, staf, dan hak akses.
-   Melihat transaksi, pendapatan, refund, dan riwayat keuangan setelah verifikasi tambahan.
-   Mengubah pengaturan toko, jam operasional, metode pembayaran, dan informasi toko.

### 4.3 Admin

-   Mengelola operasional sesuai izin yang diberikan Owner.
-   Mengelola pesanan, antrean, menu, kategori, harga, meja, QR Code, dan staf sesuai permission.
-   Tidak boleh melihat laporan keuangan, nominal pemasukan, keuntungan, atau data finansial sensitif.

### 4.4 Kasir

-   Membuat pesanan langsung melalui POS tablet.
-   Melihat dan memperbarui antrean sesuai izin.
-   Mencatat pembayaran dan melihat detail transaksi yang diperlukan untuk melayani pelanggan.
-   Tidak boleh mengakses ringkasan pemasukan, laporan keuangan, keuntungan, atau ekspor laporan.

### 4.5 Staf Dapur

-   Melihat pesanan yang sudah memenuhi syarat untuk diproses.
-   Mengubah status produksi menjadi sedang diproses, siap, dan selesai sesuai izin.
-   Tidak dapat melihat laporan keuangan atau mengubah harga.

### 4.3 Kasir

-   Membuat pesanan langsung dari POS.
-   Melihat antrean pesanan.
-   Mengonfirmasi dan memperbarui status sesuai izin.
-   Mencatat pembayaran tunai dan memeriksa status pembayaran.
-   Melihat transaksi yang diperlukan untuk operasional.

### 4.4 Staf Dapur (opsional pada MVP)

-   Melihat pesanan yang sudah dikonfirmasi.
-   Mengubah status menjadi sedang diproses dan siap.
-   Tidak dapat mengubah harga atau melihat laporan keuangan kecuali
    diberi izin.

## 5. Jenis Pesanan dan Sumber Pesanan

Pelanggan web hanya memiliki dua pilihan jenis pesanan:

### 5.1 Makan di Tempat (Dine-in)

-   Pelanggan memindai QR Code yang ditempel di meja.
-   Website membuka halaman toko dan mengenali `table_id` dari QR Code.
-   Nomor meja ditampilkan dan terikat pada pesanan.
-   Pelanggan memilih menu, checkout, dan membayar.
-   Pesanan dicatat sebagai **Online Order**, dengan jenis layanan
    `DINE_IN`.

### 5.2 Takeaway (Bungkus)

-   Pelanggan membuka website melalui link atau QR/link promosi.
-   Pelanggan memilih menu dan checkout.
-   Setelah pembayaran berhasil, sistem menerbitkan nomor antrean
    online.
-   Pesanan dicatat sebagai **Online Order**, dengan jenis layanan
    `TAKEAWAY`.

### 5.3 Pesanan Langsung di Toko

-   Kasir memasukkan pesanan pelanggan melalui POS.
-   Pesanan dicatat sebagai **Order di Tempat**.
-   Pembayaran dicatat oleh kasir sebelum pesanan diteruskan untuk
    diproses.

**Penting:** "Makan di Tempat" dan "Takeaway" adalah jenis layanan
pelanggan. "Online Order" dan "Order di Tempat" adalah sumber/channel
pesanan. Keduanya tidak boleh dicampur.

## 6. Aturan Nomor Antrean

Gunakan dua rangkaian nomor yang terpisah:

-   **Online Order:** `ON-001`, `ON-002`, dan seterusnya.
-   **Order di Tempat:** `OT-001`, `OT-002`, dan seterusnya.

Ketentuan: - Nomor antrean dibuat otomatis setelah pembayaran
terverifikasi atau transaksi kasir dinyatakan lunas. - Nomor online
mencakup dine-in QR dan takeaway web. - Nomor OT hanya untuk pesanan
yang dimasukkan langsung oleh kasir. - Nomor antrean dapat di-reset
sesuai hari operasional, dengan tetap menyimpan ID pesanan unik
permanen. - ID pesanan internal tidak boleh menggunakan nomor antrean
sebagai satu-satunya primary key. - Tampilkan channel, jenis layanan,
dan nomor meja secara terpisah.

## 7. Customer Web App --- Spesifikasi Halaman

### 7.1 Beranda

-   Branding Bubur Khalid.
-   Banner promosi atau informasi toko.
-   Search bar untuk mencari menu.
-   Dua pilihan utama: **Makan di Tempat** dan **Takeaway**.
-   Kategori dan menu pilihan.
-   Keranjang yang mudah diakses.
-   Informasi jam operasional dan pengumuman toko.
-   Desain mengikuti pola UX aplikasi pesan makanan modern, tanpa
    menyalin merek atau aset kompetitor.

### 7.2 Katalog Menu

-   Menampilkan foto, nama, deskripsi singkat, dan harga.
-   Kategori produk.
-   Pencarian dan filter kategori.
-   Tombol tambah (+).
-   Indikator produk habis/tidak tersedia.
-   Harga dan ketersediaan bersumber dari database, bukan hard-coded di
    UI.

### 7.3 Detail Produk

-   Foto produk besar.
-   Nama, deskripsi, dan harga.
-   Kontrol jumlah.
-   Catatan opsional pelanggan.
-   Tombol Tambah ke Keranjang.

### 7.4 Keranjang

-   Daftar item, jumlah, harga satuan, subtotal.
-   Ubah jumlah atau hapus item.
-   Catatan pesanan.
-   Ringkasan biaya.
-   Tombol lanjut checkout.

### 7.5 Checkout

-   Jenis layanan: Makan di Tempat atau Takeaway.
-   Untuk dine-in, tampilkan nomor meja dari QR Code dan sediakan
    validasi.
-   Untuk takeaway, tampilkan ringkasan pengambilan/antrean.
-   Data kontak pelanggan seperlunya untuk notifikasi atau pencarian
    pesanan.
-   Ringkasan item dan total.
-   Pilihan metode pembayaran yang aktif.
-   Persetujuan total pembayaran.
-   Tombol Bayar / Konfirmasi Pembayaran.

### 7.6 Hasil Pembayaran

-   Tampilkan status menunggu pembayaran, berhasil, gagal, atau
    kedaluwarsa.
-   Jangan membuat pesanan berstatus lunas hanya berdasarkan redirect
    browser.
-   Verifikasi pembayaran harus berasal dari callback/webhook payment
    gateway atau konfirmasi kasir yang sah.
-   Setelah lunas, tampilkan nomor antrean dan tombol Lacak Pesanan.

### 7.7 Tracking Pesanan

Pelanggan dapat membuka halaman tracking dari halaman sukses, menu
Pesanan, atau tautan aman.

Informasi yang ditampilkan: - Nomor antrean (ON-xxx). - Jenis layanan:
Makan di Tempat / Takeaway. - Nomor meja jika dine-in. - Daftar menu dan
jumlah. - Status pembayaran. - Status proses makanan. - Waktu pembaruan
terakhir. - Estimasi waktu hanya jika disediakan/dikonfigurasi; jangan
menampilkan estimasi palsu.

Tahapan tracking yang ditampilkan: 1. **Pembayaran Berhasil** ---
transaksi telah terverifikasi. 2. **Pesanan Diterima** --- pesanan masuk
ke sistem toko. 3. **Pesanan Dikonfirmasi** --- toko menyetujui pesanan.
4. **Sedang Disiapkan** --- dapur sedang menyiapkan makanan. 5. **Siap**
--- makanan siap disajikan untuk dine-in atau diambil untuk takeaway. 6.
**Selesai** --- pesanan telah diserahkan/diterima pelanggan.

Catatan: tahapan "Pembayaran Berhasil" adalah status pembayaran,
sedangkan status pesanan adalah workflow operasional. UI boleh
menyajikannya sebagai timeline terpadu, tetapi data backend harus
memisahkan `payment_status` dan `order_status`.

### 7.8 Notifikasi Pelanggan

-   Pembayaran berhasil.
-   Pesanan diterima/dikonfirmasi.
-   Pesanan mulai disiapkan.
-   Pesanan siap.
-   Pesanan selesai atau dibatalkan/refund.
-   MVP dapat menggunakan notifikasi dalam aplikasi dan pembaruan
    real-time; push notification browser dapat menjadi peningkatan jika
    dukungan teknis tersedia.

## 8. Admin Dashboard / POS

Dashboard admin harus responsif dan dapat digunakan pada HP serta
desktop.

### 8.1 Navigasi

-   Beranda.
-   Pesanan.
-   Antrean.
-   Menu.
-   Meja & QR Code.
-   Laporan.
-   Pelanggan (opsional).
-   Pengguna/Staf.
-   Pengaturan.

Di mobile, gunakan bottom navigation untuk menu inti dan menu tambahan
melalui drawer atau halaman navigasi. Di desktop, gunakan sidebar.

### 8.2 Dashboard Ringkasan

Tampilkan kartu metrik: - Total pesanan hari ini. - Total Online Order
hari ini. - Total Order di Tempat hari ini. - Total pendapatan hari
ini. - Jumlah pesanan belum diproses. - Jumlah pesanan sedang
diproses. - Jumlah pesanan siap. - Jumlah pesanan selesai.

Sediakan filter tanggal/periode dan indikator perbandingan dengan
periode sebelumnya jika data pembanding tersedia.

### 8.3 Monitoring Antrean Terpisah

Dashboard wajib memiliki dua tab/area berbeda:

**A. Antrean Online Order** - Pesanan dari QR meja (Dine-in). - Pesanan
dari website (Takeaway). - Nomor ON. - Filter status: Semua, Belum,
Diproses, Siap, Selesai. - Filter jenis layanan: Makan di Tempat /
Takeaway.

**B. Antrean Order di Tempat** - Pesanan yang dimasukkan langsung oleh
kasir. - Nomor OT. - Filter status: Semua, Belum, Diproses, Siap,
Selesai.

Setiap kartu antrean menampilkan: - Nomor antrean. - Waktu pesanan. -
Jenis layanan. - Nomor meja jika ada. - Ringkasan item. - Total
pembayaran. - Status pembayaran. - Status pesanan.

### 8.4 Detail Pesanan Admin

Saat kartu dibuka, tampilkan: - ID pesanan dan nomor antrean. - Channel
dan jenis layanan. - Nomor meja atau informasi takeaway. - Waktu
dibuat. - Item, kuantitas, harga, subtotal. - Catatan item dan catatan
pesanan. - Rincian pembayaran dan metode. - Riwayat perubahan status.

Aksi status: - Konfirmasi pesanan. - Tolak pesanan (wajib alasan dan
proses pengembalian dana jika sudah dibayar). - Mulai proses. - Tandai
siap. - Tandai selesai/diambil/disajikan.

Status "Siap" harus tetap terlihat sebagai tahap tersendiri. Pesanan
yang sudah siap tetapi belum diserahkan tidak boleh dianggap selesai.

### 8.5 POS Pesanan Langsung

-   Kasir memilih menu dari katalog.
-   Mengatur jumlah dan catatan.
-   Melihat total.
-   Memilih metode pembayaran.
-   Mencatat pembayaran.
-   Setelah lunas, sistem menerbitkan nomor OT.
-   Pesanan muncul pada antrean Order di Tempat.
-   Semua perubahan dicatat dalam riwayat transaksi.

## 9. Laporan dan Pendapatan

**Fitur ini wajib tersedia pada Admin Dashboard, baik mobile maupun
desktop.** Pemilik harus dapat meninjau pendapatan hari ini dan
pendapatan bulan berjalan seperti laporan penjualan.

### 9.1 Ringkasan Pendapatan Hari Ini

Tampilkan: - Total pendapatan hari ini. - Jumlah transaksi hari ini. -
Rata-rata nilai transaksi (average order value). - Pendapatan dari
Online Order. - Pendapatan dari Order di Tempat. - Rincian metode
pembayaran. - Grafik penjualan per jam jika data tersedia.

### 9.2 Ringkasan Pendapatan Bulan Ini

Tampilkan: - Total pendapatan bulan berjalan. - Jumlah transaksi bulan
berjalan. - Rata-rata nilai transaksi. - Pendapatan Online Order. -
Pendapatan Order di Tempat. - Grafik pendapatan per hari. - Perbandingan
dengan bulan sebelumnya jika tersedia.

### 9.3 Filter Laporan

-   Hari ini.
-   Kemarin.
-   7 hari terakhir.
-   Bulan ini.
-   Bulan sebelumnya.
-   Rentang tanggal khusus.
-   Filter channel: Semua, Online Order, Order di Tempat.
-   Filter metode pembayaran.
-   Filter status transaksi.

### 9.4 Rincian Laporan

Tabel/list transaksi: - Tanggal dan waktu. - Nomor pesanan/antrean. -
Channel. - Jenis layanan. - Metode pembayaran. - Total transaksi. -
Status pembayaran. - Status pesanan.

Sediakan ringkasan berdasarkan produk/menu terlaris dan jumlah terjual.

### 9.5 Definisi Pendapatan

-   Bedakan **nilai pesanan**, **pembayaran berhasil**, **refund**, dan
    **pendapatan bersih setelah refund**.
-   Pendapatan pada laporan dihitung dari transaksi yang berhasil
    dibayar, dikurangi refund yang telah diproses.
-   Pesanan belum dibayar, gagal, atau kedaluwarsa tidak dihitung
    sebagai pendapatan.
-   Hindari menghitung callback pembayaran berulang sebagai transaksi
    baru.
-   Zona waktu laporan mengikuti zona waktu toko, default
    `Asia/Jakarta`, dan dapat dikonfigurasi.
-   Jika biaya layanan/biaya lain belum digunakan, jangan membuat nilai
    fiktif.

### 9.6 Ekspor Laporan

MVP: tampilan laporan dan filter. Ekspor CSV/PDF dapat masuk MVP jika
mudah diimplementasikan, atau menjadi prioritas tahap berikutnya. Data
ekspor harus mengikuti filter yang dipilih.

## 10. Manajemen Menu dan Harga

Berdasarkan daftar harga awal yang diberikan, data awal menu:

    No. Nama Menu                     Harga
  ----- ------------------------ ----------
      1 Bubur Kampiun (Campur)     Rp10.000
      2 Kolak Katan                 Rp8.000
      3 Kacang Padi Katan           Rp8.000
      4 Kolak                       Rp6.000
      5 Kacang Padi                 Rp6.000
      6 Bubur Pulut Hitam           Rp6.000
      7 Bubur Putih (Sumsum)        Rp6.000
      8 L पोpis                     Rp6.000
      9 Cendil                      Rp6.000
     10 Kerupuk Besar               Rp3.000
     11 Kerupuk Kecil               Rp2.000
     12 Campur 3 Macam (paket)      Rp8.000

**Catatan data:** Nama menu pada tabel harus disimpan sebagai "Lopis"
(bukan teks salah ketik). "Campur 3 Macam" dicatat sebagai paket/varian
sesuai aturan toko dan perlu dikonfirmasi komposisinya sebelum produksi.

Informasi tambahan: - Bungkus memakai cup: tambahan Rp1.000/cup. -
Sebaiknya tanyakan terlebih dahulu sebelum memesan. - Toko buka
Senin--Sabtu mulai pukul 16.30 (setengah 5 sore). - Minggu tutup. -
Selama bulan Ramadan, toko buka setiap hari.

Semua harga, jam operasional, biaya cup, dan ketersediaan harus dapat
diedit admin. Aturan Ramadan harus berupa pengaturan jadwal, bukan
hard-coded permanen.

Admin dapat: - Menambah, mengubah, mengarsipkan menu. - Mengatur
harga. - Mengunggah foto. - Mengelola kategori. - Mengatur
ketersediaan/habis. - Mengatur biaya tambahan cup dan aturan
penerapannya.

## 11. Meja dan QR Code

-   Admin dapat membuat, mengubah, menonaktifkan meja.
-   Setiap meja memiliki QR Code unik.
-   QR Code mengarah ke URL pemesanan dengan token meja yang tidak mudah
    ditebak.
-   Sistem memvalidasi meja aktif.
-   Pelanggan tidak perlu mengetik nomor meja jika masuk dari QR meja.
-   Admin dapat mengunduh atau mencetak QR Code untuk ditempel di meja.
-   Jika QR tidak valid atau meja nonaktif, tampilkan pesan yang jelas.

## 12. Pembayaran

Keputusan produk: **pembayaran harus dilakukan sebelum pesanan
diproses.**

Metode pembayaran dapat diaktifkan admin sesuai dukungan provider: -
QRIS/payment gateway. - Transfer atau metode digital lain melalui
provider. - Tunai di kasir untuk pesanan yang dibayar langsung di toko.

Aturan: - Pesanan online tidak masuk antrean produksi sebelum status
pembayaran terverifikasi. - Untuk pesanan langsung di toko, kasir
mencatat pembayaran lunas sebelum pesanan diproses. - Status pembayaran:
`PENDING`, `PAID`, `FAILED`, `EXPIRED`, `REFUNDED`, `PARTIALLY_REFUNDED`
jika didukung. - Status pembayaran terpisah dari status pesanan. -
Webhook payment gateway diverifikasi signature-nya. - Proses pembayaran
harus idempotent. - Simpan referensi transaksi provider dan jejak
audit. - Jika pesanan ditolak setelah dibayar, tandai untuk refund dan
simpan status refund; jangan menganggap uang otomatis kembali tanpa
konfirmasi provider.

## 13. Workflow Status Pesanan

Pisahkan `payment_status` dari `order_status`.

### Payment status

-   Menunggu pembayaran.
-   Berhasil.
-   Gagal.
-   Kedaluwarsa.
-   Refund diproses/berhasil.

### Order status

-   `NEW` --- pembayaran terverifikasi dan pesanan masuk.
-   `CONFIRMED` --- toko menerima pesanan.
-   `PREPARING` --- makanan sedang disiapkan.
-   `READY` --- makanan siap.
-   `COMPLETED` --- pesanan telah diserahkan/diambil.
-   `REJECTED` --- pesanan ditolak.
-   `CANCELLED` --- pesanan dibatalkan sesuai aturan.

Label UI untuk antrean admin dapat disederhanakan menjadi: - **Belum:**
status NEW, menunggu konfirmasi. - **Diproses:** CONFIRMED atau
PREPARING. - **Siap:** READY. - **Selesai:** COMPLETED.

Simpan timestamp untuk setiap perubahan status dan identitas staf yang
melakukan perubahan.

## 14. Notifikasi dan Realtime

-   Pesanan online baru memunculkan notifikasi di admin.
-   Perubahan status admin diperbarui ke tracking pelanggan.
-   Gunakan mekanisme realtime (misalnya WebSocket atau layanan realtime
    backend).
-   Sediakan fallback polling jika koneksi realtime terputus.
-   Tampilkan indikator koneksi/sinkronisasi pada dashboard.
-   Notifikasi tidak boleh menjadi satu-satunya sumber kebenaran; status
    selalu dibaca dari backend.

## 15. UI/UX dan Design System

### 15.1 Customer Web App

-   Mobile-first.
-   Optimalkan untuk layar HP Android dan iPhone.
-   Tampilan beranda terinspirasi pola UX aplikasi pesan makanan modern.
-   Gunakan palet resmi Bubur Khalid: Spicy Ember #EE3F24, Noodle Cream #FFEFCB, Matcha Leaf #023820, Yolk Blaze #F9A11B, dan Tofu Silkblaze #FFF4E6. Jangan gunakan biru sebagai identitas utama.
-   Kartu produk dengan foto, nama, harga, tombol tambah.
-   Bottom navigation dan sticky cart bila sesuai.
-   Checkout ringkas, jelas, dan mudah digunakan satu tangan.
-   Jangan menyalin logo, ilustrasi, atau aset merek kompetitor.

### 15.2 Admin Dashboard

-   Responsif mobile dan desktop.
-   Identitas visual menggunakan Matcha Leaf #023820, Tofu Silkblaze #FFF4E6, Noodle Cream #FFEFCB, Spicy Ember #EE3F24, dan Yolk Blaze #F9A11B.
-   Desktop: sidebar dan area kerja multi-panel.
-   Mobile: bottom navigation atau drawer.
-   Status antrean memakai warna dan label yang konsisten.
-   Tombol aksi cukup besar untuk sentuhan.
-   Laporan pendapatan harus mudah ditemukan dari navigasi utama.

### 15.3 Visual Reference

Gunakan gambar desain yang disediakan dalam percakapan sebagai inspirasi
layout: - Customer home/menu mobile. - Detail produk dan checkout. -
Tracking pesanan. - Admin dashboard desktop. - Admin dashboard mobile.

Gambar referensi adalah acuan visual, bukan sumber data transaksi atau
aset yang harus disalin persis. Implementasikan UI asli yang responsif
dan konsisten.

## 16. Rekomendasi Arsitektur Teknis

Antigravity harus terlebih dahulu memeriksa lingkungan/repository yang
tersedia dan memilih stack sederhana, terawat, serta hemat biaya. Jangan
mengasumsikan layanan berbayar sebelum kebutuhan dikonfirmasi.

Arsitektur logis: - Frontend Customer Web App. - Frontend Admin
Dashboard (dapat berbagi komponen dan codebase). - Backend API. -
Database relasional. - Penyimpanan gambar produk. - Payment gateway
adapter. - Realtime event channel. - Authentication dan authorization.

Rekomendasi implementasi: - Gunakan TypeScript untuk frontend/backend
bila sesuai stack. - Gunakan database relasional seperti PostgreSQL. -
Gunakan ORM dan migration yang konsisten. - Validasi input di server. -
Simpan harga transaksi sebagai snapshot agar perubahan harga menu tidak
mengubah riwayat. - Simpan uang sebagai integer Rupiah, bukan floating
point. - Terapkan role-based access control. - Simpan semua waktu
sebagai timestamp yang konsisten dan tampilkan sesuai zona waktu toko. -
Pisahkan konfigurasi development, staging, production. - Sediakan
`.env.example`; jangan commit secret. - Buat seed data menu awal.

Jika payment gateway belum memiliki kredensial, implementasikan payment
adapter dan mode simulasi khusus development. Jangan mengklaim
pembayaran nyata telah terintegrasi.

## 17. Data Model Minimum

### `users`

-   id
-   name
-   email/phone
-   password_hash atau auth_provider_id
-   role
-   is_active
-   created_at

### `products`

-   id
-   name
-   slug
-   description
-   category_id
-   price (integer Rupiah)
-   image_url
-   is_available
-   sort_order
-   created_at
-   updated_at

### `categories`

-   id
-   name
-   sort_order
-   is_active

### `tables`

-   id
-   table_number
-   qr_token
-   is_active

### `orders`

-   id (UUID)
-   queue_number
-   queue_channel (`ONLINE` / `IN_STORE`)
-   service_type (`DINE_IN` / `TAKEAWAY`)
-   table_id nullable
-   customer_id/contact nullable
-   order_status
-   payment_status
-   subtotal
-   additional_fee
-   discount
-   total_amount
-   notes
-   created_at
-   updated_at
-   completed_at

### `order_items`

-   id
-   order_id
-   product_id
-   product_name_snapshot
-   unit_price_snapshot
-   quantity
-   item_notes
-   line_total

### `payments`

-   id
-   order_id
-   method
-   provider
-   provider_reference
-   amount
-   status
-   paid_at
-   refunded_at
-   created_at

### `order_status_history`

-   id
-   order_id
-   old_status
-   new_status
-   changed_by
-   note
-   created_at

### `store_settings`

-   store_name
-   timezone
-   opening_hours
-   ramadan_schedule
-   cup_fee
-   payment_methods
-   ordering_enabled

### `audit_logs`

-   id
-   actor_user_id
-   action
-   entity_type
-   entity_id
-   metadata
-   created_at

## 18. Business Rules Penting

1.  Sumber pesanan hanya `ONLINE` atau `IN_STORE`.
2.  Jenis layanan pelanggan web hanya `DINE_IN` atau `TAKEAWAY`.
3.  DINE_IN dari QR dan TAKEAWAY website sama-sama masuk antrean ON.
4.  Pesanan POS langsung dari kasir masuk antrean OT.
5.  Pesanan tidak boleh diproses sebelum pembayaran lunas/terverifikasi.
6.  Nomor ON dan OT berjalan terpisah.
7.  Status pembayaran tidak boleh disamakan dengan status makanan.
8.  Pesanan READY belum boleh dihitung COMPLETED sebelum diserahkan.
9.  Laporan pendapatan hanya menghitung pembayaran berhasil dikurangi
    refund yang berhasil.
10. Perubahan harga produk tidak mengubah snapshot harga pesanan lama.
11. Callback pembayaran duplikat tidak boleh membuat transaksi atau
    antrean ganda.
12. Semua tindakan admin penting tercatat di audit log.

## 19. Keamanan dan Privasi

-   Password disimpan dengan hashing aman jika autentikasi dikelola
    aplikasi.
-   Gunakan HTTPS pada deployment.
-   Terapkan role-based access control di backend, bukan hanya
    menyembunyikan tombol UI.
-   QR token tidak boleh mengekspos data internal.
-   Endpoint tracking publik hanya boleh membuka detail pesanan yang
    terkait dengan token tracking aman atau autentikasi pelanggan.
-   Jangan menampilkan data pribadi pelanggan secara terbuka.
-   Verifikasi webhook pembayaran.
-   Rate-limit endpoint sensitif.
-   Validasi harga dan total di server; jangan percaya total dari
    browser.
-   Catat perubahan status, pembayaran, refund, dan perubahan harga.
-   Sediakan backup database dan prosedur pemulihan.

## 20. Non-Functional Requirements

-   UI responsif untuk layar mobile dan desktop.
-   Halaman menu dan checkout harus ringan dan mudah digunakan pada
    koneksi seluler.
-   Status pesanan diperbarui secara realtime atau melalui fallback
    polling.
-   Operasi pembayaran dan pembuatan antrean harus konsisten dan
    idempotent.
-   Data transaksi tidak hilang ketika halaman direfresh.
-   Kesalahan jaringan menampilkan pesan dan opsi mencoba kembali.
-   Akses admin memerlukan autentikasi.
-   Sistem menggunakan bahasa Indonesia dan format mata uang `Rp`.
-   Zona waktu toko dapat diatur, default `Asia/Jakarta`.

## 21. Acceptance Criteria MVP

### Customer

-   [ ] Pelanggan dapat membuka web app dari HP tanpa instalasi.
-   [ ] Pelanggan dapat memilih Makan di Tempat atau Takeaway.
-   [ ] QR meja mengisi nomor meja secara otomatis.
-   [ ] Pelanggan dapat mencari dan memilih menu.
-   [ ] Pelanggan dapat mengubah jumlah dan catatan item.
-   [ ] Total dihitung ulang dan divalidasi server.
-   [ ] Pelanggan dapat menyelesaikan pembayaran.
-   [ ] Setelah pembayaran terverifikasi, pelanggan menerima nomor ON.
-   [ ] Pelanggan dapat melihat tracking status pesanan.
-   [ ] Perubahan status admin tampil di halaman tracking.

### Admin / POS

-   [ ] Admin dapat login melalui HP dan desktop.
-   [ ] Admin dapat melihat Online Order dan Order di Tempat secara
    terpisah.
-   [ ] Admin dapat memfilter antrean berdasarkan status.
-   [ ] Admin dapat melihat detail pesanan.
-   [ ] Admin dapat mengubah status sesuai hak akses.
-   [ ] Kasir dapat membuat pesanan POS dan menerbitkan nomor OT setelah
    pembayaran.
-   [ ] Admin dapat mengelola menu, harga, ketersediaan, meja, dan QR
    Code.
-   [ ] Pesanan baru memunculkan notifikasi.

### Laporan

-   [ ] Admin dapat melihat pendapatan hari ini.
-   [ ] Admin dapat melihat pendapatan bulan berjalan.
-   [ ] Admin dapat melihat jumlah transaksi dan rata-rata transaksi.
-   [ ] Admin dapat membandingkan Online Order dengan Order di Tempat.
-   [ ] Admin dapat memfilter laporan berdasarkan rentang tanggal.
-   [ ] Admin dapat melihat metode pembayaran dan rincian transaksi.
-   [ ] Refund mengurangi pendapatan bersih setelah refund berhasil.
-   [ ] Pesanan belum dibayar tidak dihitung sebagai pendapatan.

## 22. Tahapan Implementasi untuk Google Antigravity

Antigravity harus bekerja bertahap. Jangan membangun seluruh sistem
sekaligus tanpa validasi.

### Tahap 0 --- Repository & Project Setup

-   Periksa repository dan instruksi project.
-   Tentukan stack sesuai lingkungan yang tersedia.
-   Buat struktur folder, konfigurasi, design tokens, dan
    `.env.example`.
-   Dokumentasikan keputusan teknis.

### Tahap 1 --- UI Prototype

-   Bangun Customer mobile home, katalog, detail produk, cart, checkout,
    dan tracking menggunakan data mock.
-   Bangun Admin mobile dashboard dan desktop dashboard.
-   Buat tampilan antrean Online/Di Tempat.
-   Buat laporan pendapatan harian dan bulanan.
-   Pastikan seluruh halaman responsif.

### Tahap 2 --- Database & Authentication

-   Buat schema dan migration.
-   Seed 12 produk awal.
-   Implementasikan login admin dan role.
-   Implementasikan menu, meja, dan QR token.

### Tahap 3 --- Order & POS

-   Implementasikan cart dan pembuatan pesanan.
-   Implementasikan ON/OT sequence terpisah.
-   Implementasikan POS kasir.
-   Implementasikan order status history.

### Tahap 4 --- Payment

-   Buat payment adapter.
-   Integrasikan provider setelah kredensial tersedia.
-   Implementasikan webhook verification dan idempotency.
-   Buat mode simulasi hanya untuk development.

### Tahap 5 --- Realtime Tracking & Notifications

-   Implementasikan pembaruan status real-time.
-   Implementasikan customer tracking.
-   Implementasikan notifikasi admin.

### Tahap 6 --- Reports

-   Implementasikan agregasi pendapatan harian dan bulanan.
-   Implementasikan filter tanggal, channel, metode pembayaran.
-   Pastikan refund dan pembayaran duplikat dihitung dengan benar.

### Tahap 7 --- Testing & Deployment

-   Uji seluruh alur dine-in QR.
-   Uji takeaway.
-   Uji POS langsung.
-   Uji payment success/failure/expired/refund.
-   Uji antrean ON/OT.
-   Uji tracking.
-   Uji laporan harian/bulanan.
-   Uji mobile dan desktop.
-   Siapkan deployment dan backup.

## 23. Instruksi Utama untuk Google Antigravity

Baca PRD ini secara menyeluruh sebelum menulis kode.

1.  Jadikan PRD ini sumber kebutuhan produk utama.
2.  Jangan menghilangkan keputusan bisnis yang sudah ditetapkan.
3.  Mulai dengan memeriksa repository dan membuat rencana implementasi.
4.  Prioritaskan prototype UI yang konsisten dengan visual reference
    sebelum integrasi backend.
5.  Gunakan data menu awal dan harga dari PRD sebagai seed data.
6.  Jangan membuat tombol yang tidak berfungsi atau mengklaim integrasi
    eksternal yang belum dikonfigurasi.
7.  Pisahkan channel pesanan (`ONLINE`/`IN_STORE`) dari jenis layanan
    (`DINE_IN`/`TAKEAWAY`).
8.  Pisahkan payment status dari order status.
9.  Pastikan laporan harian dan bulanan memakai data transaksi
    terverifikasi.
10. Setelah setiap tahap, jalankan test, perbaiki error, dan laporkan
    file/fitur yang selesai serta yang masih membutuhkan konfigurasi.
11. Jangan melanjutkan ke integrasi payment gateway produksi tanpa
    kredensial dan persetujuan pemilik.
12. Jika ada detail yang belum diputuskan, gunakan implementasi paling
    sederhana dan aman, dokumentasikan asumsi, dan jangan mengubah
    keputusan yang sudah eksplisit.

**Prioritas utama:** hasilkan aplikasi Bubur Khalid yang mudah
digunakan, ringan, mobile-first untuk pelanggan, responsif untuk admin,
memisahkan antrean dengan benar, menyediakan tracking pesanan, dan
memberikan laporan pendapatan yang dapat dipercaya.


------------------------------------------------------------------------

## 24. POS Kasir Khusus Tablet

Sediakan mode POS (Point of Sale) khusus untuk kasir yang dioptimalkan untuk tablet touchscreen, tanpa menghilangkan dukungan desktop dan mobile.

### 24.1 Layout POS

-   Area katalog produk dan kategori berada di sisi utama.
-   Keranjang pesanan selalu terlihat pada layar tablet.
-   Kartu produk menampilkan foto, nama, harga, dan status tersedia/habis.
-   Tombol cukup besar untuk interaksi touchscreen.
-   Gunakan palet resmi Bubur Khalid.
-   Sediakan pencarian produk dan filter kategori.

### 24.2 Operasi Keranjang

Kasir dapat:
-   Menambahkan produk dengan satu sentuhan.
-   Menambah atau mengurangi kuantitas.
-   Menghapus item dari keranjang sebelum transaksi disimpan.
-   Menambahkan catatan untuk item atau seluruh pesanan.
-   Memilih kemasan cup dengan biaya tambahan Rp1.000 per cup sesuai aturan toko.
-   Melihat subtotal, biaya tambahan, diskon jika diaktifkan, dan total akhir.

### 24.3 Checkout POS

-   Pilih metode pembayaran yang diaktifkan Owner, seperti tunai atau QRIS jika integrasi tersedia.
-   Untuk tunai, kasir memasukkan nominal uang diterima dan sistem menghitung kembalian.
-   Validasi nominal pembayaran agar tidak kurang dari total.
-   Setelah pembayaran dinyatakan lunas, backend membuat pesanan dan nomor antrean OT.
-   Sediakan tampilan struk digital dan opsi cetak jika perangkat printer didukung.
-   Simpan identitas kasir, waktu transaksi, metode pembayaran, dan snapshot harga.
-   Transaksi tidak boleh hilang ketika halaman ditutup atau perangkat refresh.

### 24.4 Pembatalan POS

-   Keranjang yang belum disimpan dapat dibatalkan langsung.
-   Pesanan yang belum dibayar dapat dibatalkan sesuai izin.
-   Pesanan yang sudah dibayar harus melalui prosedur void/refund yang sah.
-   Pembatalan transaksi wajib menyertakan alasan dan dicatat di audit log.
-   Jangan menghapus transaksi yang sudah tercatat dari histori.

## 25. Centralized Queue & Kitchen Display

Seluruh pesanan Customer Web App dan POS harus terhubung ke satu sistem antrean terpusat dengan backend dan database sebagai single source of truth.

### 25.1 Nomor Antrean

Tetap gunakan dua format nomor:
- Online Order: ON-001, ON-002, dan seterusnya. Mencakup QR dine-in dan website takeaway.
- Order di Tempat: OT-001, OT-002, dan seterusnya. Khusus pesanan yang dimasukkan kasir.

Nomor ON dan OT boleh memiliki urutan masing-masing, tetapi setiap pesanan juga wajib memiliki `global_queue_sequence` atau mekanisme urutan global yang setara untuk dapur.

Nomor antrean:
- Dibuat di backend secara atomik untuk mencegah duplikasi ketika pesanan masuk bersamaan.
- Dapat di-reset berdasarkan hari operasional, tanpa mengubah internal order ID yang unik.
- Tidak boleh menjadi primary key transaksi.
- Menampilkan channel, service type, dan nomor meja secara terpisah.

### 25.2 Urutan Dapur

- Pesanan ON dan OT yang sudah memenuhi syarat produksi masuk ke satu Kitchen Queue.
- Urutan default adalah FIFO berdasarkan waktu pesanan diterima/terkonfirmasi dan memenuhi syarat produksi.
- Pesanan online yang belum dibayar tidak boleh masuk antrean produksi.
- Pesanan kasir masuk antrean setelah pembayaran dinyatakan lunas.
- Pesanan yang ditolak atau dibatalkan dikeluarkan dari antrean aktif, tetapi histori tetap disimpan.
- Jika Owner mengizinkan prioritas manual, perubahan prioritas harus memiliki alasan, permission khusus, dan audit log.
- Jangan mengurutkan pekerjaan dapur hanya berdasarkan nomor ON atau OT karena keduanya merupakan sequence terpisah.

### 25.3 Kitchen Display System (KDS)

Buat tampilan dapur yang responsif untuk tablet/monitor. Setiap kartu pesanan menampilkan:
- Nomor antrean ON/OT dengan jelas.
- Channel sumber pesanan.
- Waktu masuk dan lama menunggu.
- Daftar makanan, kuantitas, dan catatan khusus.
- Nomor meja jika dine-in.
- Status pembayaran yang relevan.
- Status produksi.

Aksi sesuai hak akses:
- Mulai Diproses.
- Tandai Siap.
- Tandai Selesai/Diserahkan.

Status `READY` harus tetap berbeda dari `COMPLETED`. Dapur tidak boleh menandai pesanan selesai diserahkan jika proses tersebut menjadi tanggung jawab kasir/pelayan.

### 25.4 Sinkronisasi Real-time

Perubahan pesanan/status dari satu perangkat harus diperbarui ke:
- Admin Dashboard.
- POS Kasir.
- Kitchen Display.
- Customer Live Order Tracking.

Gunakan WebSocket atau layanan realtime yang sesuai dan polling sebagai fallback. Tampilkan indikator koneksi. Setelah koneksi pulih, aplikasi harus mengambil ulang status dari backend. Notifikasi bukan sumber kebenaran; database adalah sumber kebenaran.

Gunakan validasi transisi status di backend, optimistic concurrency/versioning bila diperlukan, dan idempotency untuk mencegah aksi ganda.

## 26. Manajemen CRUD dan Tong Sampah

Semua modul data operasional yang relevan harus mendukung Create, Read, Update, dan Delete sesuai role/permission.

### 26.1 Modul yang Dikelola

- Produk/menu.
- Kategori.
- Harga.
- Meja dan QR Code.
- Pengguna/staf.
- Promo.
- Pengaturan operasional yang dapat dikelola.

### 26.2 Aksi Antarmuka

Sediakan aksi yang jelas:
- Add: menambah data.
- Edit: mengubah data.
- Delete: memindahkan data ke Tong Sampah, bukan langsung menghapus permanen.
- Cancel: membatalkan form/proses.
- Close: menutup modal/panel.
- Restore: memulihkan data.
- Permanent Delete: menghapus permanen setelah konfirmasi kuat.

Form Add/Edit harus menyediakan Save, Cancel, dan Close, validasi input, serta peringatan jika ada perubahan yang belum disimpan.

Untuk perubahan harga, tampilkan harga lama dan harga baru sebelum disimpan. Harga baru hanya berlaku untuk pesanan baru. Pesanan lama mempertahankan snapshot nama produk, harga, dan detail item saat transaksi dibuat.

### 26.3 Tong Sampah

Buat halaman khusus "Tong Sampah" dengan pencarian dan filter jenis data. Tampilkan nama data, tipe, waktu penghapusan, dan pengguna yang menghapus.

Ketentuan:
- Gunakan soft delete (`deleted_at`, `deleted_by`, atau mekanisme setara).
- Data dapat dipulihkan oleh role yang berwenang.
- Permanent Delete memerlukan konfirmasi tambahan dan permission khusus.
- Catat penghapusan, pemulihan, dan penghapusan permanen di audit log.
- Jangan menghapus transaksi, pembayaran, atau histori pesanan akibat penghapusan produk/menu.
- Data produk yang digunakan dalam transaksi historis harus tetap dapat ditampilkan melalui snapshot transaksi.
- Relasi foreign key harus dirancang agar penghapusan data master tidak merusak histori.
- Untuk data yang tidak aman dipulihkan karena konflik/ketergantungan, tampilkan alasan dan instruksi yang jelas.

## 27. Owner-Only Financial Access & Additional Verification

Seluruh laporan keuangan adalah data rahasia dan hanya boleh diakses oleh role `OWNER`.

### 27.1 Pembatasan Data

Hanya OWNER yang boleh melihat:
- Pemasukan hari ini dan bulan berjalan.
- Total pembayaran berhasil.
- Pendapatan bersih setelah refund.
- Rata-rata nilai transaksi.
- Pendapatan berdasarkan channel dan metode pembayaran.
- Grafik penjualan dan rincian transaksi keuangan.
- Data refund dan pembatalan keuangan.
- Laporan laba/keuntungan jika modul biaya dan perhitungan laba kelak diaktifkan.
- Ekspor CSV/PDF laporan keuangan.

ADMIN, CASHIER, dan KITCHEN_STAFF tidak boleh melihat nominal pemasukan, total omzet, keuntungan, grafik pendapatan, rincian finansial sensitif, atau ekspor laporan. Mereka tetap dapat melihat informasi operasional yang diperlukan, seperti jumlah pesanan aktif, item pesanan, dan status antrean. Kasir hanya dapat melihat nominal transaksi yang sedang dilayani dan diperlukan untuk menerima pembayaran/kembalian.

### 27.2 Verifikasi Tambahan Owner

Ketika OWNER membuka area laporan keuangan, minta verifikasi tambahan dengan salah satu metode:
1. Password akun Owner.
2. OTP ke email Owner yang telah diverifikasi.
3. OTP ke nomor HP Owner yang telah diverifikasi.

Kontak tujuan harus dipilih dari data kontak terverifikasi yang tersimpan. Jangan meminta atau menampilkan OTP melalui URL, log, atau frontend selain input verifikasi.

Aturan OTP:
- Masa berlaku default maksimal 5 menit dan dapat dikonfigurasi secara aman.
- Batasi percobaan verifikasi dan frekuensi pengiriman.
- Gunakan rate limiting dan mekanisme pencegahan brute force.
- OTP sekali pakai dan tidak disimpan sebagai plaintext.
- Jangan menganggap OTP terkirim jika provider email/SMS belum terkonfigurasi.
- Sediakan pesan error yang tidak membocorkan apakah akun/kontak tertentu terdaftar.

### 27.3 Sesi Keuangan

- Setelah verifikasi sukses, berikan sesi akses keuangan terbatas.
- Kunci ulang setelah 5 menit tidak aktif sebagai nilai default.
- Minta verifikasi ulang setelah sesi kedaluwarsa.
- Logout, perubahan password, pencabutan sesi, atau perubahan hak akses harus membatalkan sesi keuangan terkait.
- Jangan menyimpan password atau OTP di browser sebagai plaintext.

### 27.4 Otorisasi Backend

- Proteksi setiap halaman, API, query, dan endpoint ekspor laporan dengan pemeriksaan role `OWNER` di server.
- Pemeriksaan verifikasi tambahan harus dilakukan di backend.
- Menyembunyikan menu laporan di frontend saja tidak cukup.
- Tolak akses langsung oleh non-owner meskipun endpoint dipanggil manual.
- Jangan mengirim data keuangan lengkap ke client non-owner.
- Catat pembukaan laporan, kegagalan verifikasi, ekspor, dan perubahan data keuangan dalam audit log.
- Jangan mencatat password, OTP, token autentikasi, atau secret ke audit log.

## 28. Brand Identity dan Design System Resmi

Palet warna pada referensi visual yang disetujui menjadi identitas resmi seluruh produk Bubur Khalid, menggantikan arahan warna biru sebelumnya.

| Nama Warna | HEX | Penggunaan |
|---|---|---|
| Spicy Ember | `#EE3F24` | Primary action, tombol pesan, aksi penting |
| Noodle Cream | `#FFEFCB` | Card dan permukaan sekunder |
| Matcha Leaf | `#023820` | Navigasi, header, teks utama, elemen brand |
| Yolk Blaze | `#F9A11B` | Promo, highlight harga, badge |
| Tofu Silkblaze | `#FFF4E6` | Background utama |

Aturan:
- Gunakan warna sebagai design tokens/CSS variables terpusat.
- Pastikan kontras teks dan latar memenuhi aksesibilitas.
- Gunakan warna secara konsisten pada Customer Web App, Admin Dashboard, POS tablet, Kitchen Display, checkout, tracking, dan laporan.
- Jangan gunakan biru sebagai identitas utama.
- Gaya visual: modern, hangat, menggugah selera, clean, minimalis, dan profesional.
- Hindari gradient berlebihan, dekorasi yang tidak memiliki fungsi, serta tampilan generik.

## 29. Pembaruan Data Model

Tambahkan atau sesuaikan field berikut pada model data:

### `orders`
- `id` UUID internal unik.
- `queue_number`.
- `queue_channel` (`ONLINE` / `IN_STORE`).
- `service_type` (`DINE_IN` / `TAKEAWAY`).
- `global_queue_sequence` atau field urutan dapur global.
- `accepted_at` / `production_eligible_at`.
- `created_by_user_id` untuk pesanan POS.
- `order_version` atau mekanisme concurrency control.
- Snapshot nama produk, harga, kuantitas, dan catatan pada item transaksi.

### `order_items`
- `product_id` nullable untuk menjaga histori jika produk master diarsipkan/dihapus.
- `product_name_snapshot`.
- `unit_price_snapshot`.
- `quantity`.
- `subtotal`.
- `notes`.
- Snapshot biaya tambahan cup bila berlaku.

### `products`, `categories`, `tables`, `users`
- `deleted_at` nullable.
- `deleted_by` nullable.
- `updated_at`.
- Field status aktif/nonaktif sesuai kebutuhan.

### `queue_counters`
- Tanggal/periode operasional.
- Channel (`ONLINE` / `IN_STORE`).
- Nilai counter.
- Unique constraint sesuai periode dan channel.
- Update counter harus atomik/transaksional.

### `audit_logs`
- Actor/user ID.
- Action.
- Entity type dan entity ID.
- Timestamp.
- Reason bila diwajibkan.
- Metadata aman tanpa password, OTP, atau secret.

### `financial_access_logs`
- Owner user ID.
- Jenis aksi (akses laporan, verifikasi gagal, ekspor).
- Timestamp.
- Hasil aksi.
- Metadata perangkat/sesi yang aman dan proporsional.

### `store_settings`
- Timezone default `Asia/Jakarta`.
- Jam buka Senin--Sabtu 16.00--22.00 WIB.
- Minggu tutup.
- Jadwal khusus/pengecualian yang dapat diatur Owner.
- Biaya cup dan aturan penerapannya.

## 30. Acceptance Criteria Tambahan

Fitur tambahan dinyatakan selesai jika:

1. Kasir dapat membuat pesanan melalui POS tablet dan transaksi tersimpan secara permanen.
2. Pesanan POS mendapatkan nomor OT, sedangkan pesanan website/QR mendapatkan nomor ON.
3. Semua pesanan yang memenuhi syarat produksi tampil pada satu Kitchen Queue dengan urutan global FIFO.
4. Perubahan status tersinkron ke Admin, POS, KDS, dan tracking pelanggan.
5. Perangkat yang refresh atau sempat offline dapat memuat ulang status terbaru dari backend.
6. Admin dapat Add/Edit/Delete data master dengan soft delete dan dapat memulihkan data dari Tong Sampah sesuai izin.
7. Pengubahan harga tidak mengubah snapshot harga transaksi lama.
8. Non-owner tidak dapat membaca laporan keuangan melalui UI maupun API.
9. Owner harus berhasil melewati verifikasi password atau OTP sebelum membuka laporan.
10. Sesi laporan terkunci kembali setelah batas tidak aktif.
11. Semua aksi sensitif tercatat di audit log tanpa menyimpan secret.
12. Seluruh antarmuka mengikuti palet warna resmi Bubur Khalid.
13. Jam operasional default adalah Senin--Sabtu 16.00--22.00 WIB dan Minggu tutup.

## 31. Instruksi Implementasi untuk Google Antigravity

Perlakukan seluruh pembaruan pada PRD versi 1.1 ini sebagai bagian dari spesifikasi produk. Sebelum implementasi:
- Periksa kode dan struktur proyek yang sudah ada.
- Jangan menimpa atau menghapus fitur yang telah disetujui.
- Perbarui implementation plan dan data model.
- Bangun UI prototype POS tablet, Kitchen Display, Tong Sampah, serta Owner Financial Verification.
- Minta persetujuan desain sebelum mengubah alur yang sudah berjalan.
- Implementasikan backend authorization dan database constraints sebelum menyatakan fitur keamanan selesai.
- Buat automated tests untuk role access, queue concurrency, payment idempotency, soft delete/restore, dan realtime synchronization.
- Tandai integrasi yang membutuhkan kredensial provider sebagai belum aktif sampai benar-benar dikonfigurasi dan diuji.
