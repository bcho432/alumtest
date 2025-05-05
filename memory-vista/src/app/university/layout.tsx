'use client';

import { AuthProvider } from "@/contexts/AuthContext";

export default function UniversityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 