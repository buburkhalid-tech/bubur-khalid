import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bubur Khalid — Asli Minang',
  description: 'Pesan Bubur Kampiun, Kolak, Pulut Hitam, dan Menu Tradisional Minang Khas Bubur Khalid.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bubur Khalid',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#023820',
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
