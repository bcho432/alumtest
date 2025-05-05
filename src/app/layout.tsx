import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Memory Vista - Digital Memorial Platform',
  description: 'Create and share beautiful digital memorials for your loved ones.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-grow min-h-[calc(100vh-64px)] bg-gray-50 pt-4 pb-8">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
} 