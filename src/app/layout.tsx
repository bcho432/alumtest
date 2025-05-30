import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/providers/ClientProviders';
import { RootLayout } from '@/components/layout/RootLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Memorial App',
  description: 'Honor and remember loved ones',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const themeColor = '#ffffff';

export default function RootLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClientProviders>
          <RootLayout>{children}</RootLayout>
        </ClientProviders>
      </body>
    </html>
  );
} 