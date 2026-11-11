import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bubur Khalid — Web Kasir & Ordering System',
  description: 'Sistem Terintegrasi Pemesanan Makanan, POS Kasir Tablet, Kitchen Display System & Laporan Owner',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-tofu-silkblaze text-matcha-leaf min-h-screen selection:bg-spicy-light selection:text-spicy-ember">
        {children}
      </body>
    </html>
  );
}
