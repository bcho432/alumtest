'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { handleFirebaseError } from '@/lib/errors';
import { validateEmail } from '@/lib/validation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);

    try {
      const auth = await getAuth();
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      setError(handleFirebaseError(err).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {success ? (
            <div className="rounded-md bg-green-50 p-4 mb-6">
              <div className="text-sm text-green-700">
                Password reset email sent! Please check your inbox and follow the instructions to reset your password.
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/auth/login')}
                >
                  Return to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Send Reset Link
                </Button>
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => router.push('/auth/login')}
                >
                  Back to Sign In
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 