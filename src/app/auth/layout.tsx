import { RootLayout } from '@/components/layout/RootLayout';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootLayout>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        {children}
      </div>
    </RootLayout>
  );
} 