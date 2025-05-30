'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RootLayout } from '@/components/layout/RootLayout';

export default function TestPage() {
  const { signIn, signOut, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await signIn(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <RootLayout>
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Test Authentication
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {user ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  Signed in as: {user.email}
                </p>
                <Button
                  onClick={() => signOut()}
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSignIn}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email address"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />

                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                />

                {error && (
                  <p className="text-sm text-red-600">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                >
                  Sign In
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </RootLayout>
  );
} 