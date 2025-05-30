import React from 'react';
import { Header } from './Header';
import Footer from './Footer';
import { AnnouncementBanner } from '@/components/ui/AnnouncementBanner';

interface RootLayoutProps {
  children: React.ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBanner />
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
} 