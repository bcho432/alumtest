'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { handleFirebaseError } from '@/lib/errors';
import { createOrganization } from '@/lib/services/organization';
import type { SignUpFormData } from '@/types/forms';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SignUpFormData>({
    organization: '',
    email: '',
    password: '',
  });
  const [isPersonalAccount, setIsPersonalAccount] = useState(false);

  // Get redirect URL from query parameters
  const redirectUrl = searchParams.get('redirectUrl');
  
  // Check if we're continuing from an invitation link
  const isFromInvitation = !!redirectUrl && redirectUrl.includes('/invitation/accept');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isPersonalAccount) {
        // For personal accounts (likely invited users)
        const orgName = "Personal Account"; // Default org name for personal accounts
        await signUp(formData.email, formData.password, orgName, true);
        
        // Redirect to the invitation page or dashboard
        if (redirectUrl) {
          console.log('Redirecting to invitation page:', redirectUrl);
          router.push(redirectUrl);
        } else {
          router.push('/dashboard');
        }
      } else {
        // For university/organization accounts
        await signUp(formData.email, formData.password, formData.organization, false);
        router.push('/university/dashboard');
      }
    } catch (err) {
      setError(handleFirebaseError(err).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {isFromInvitation 
            ? "Create your account to continue" 
            : "Create your organization account"}
        </h2>
        {isFromInvitation && (
          <p className="mt-2 text-center text-sm text-gray-600">
            You've been invited to create a memorial
          </p>
        )}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* For invitations, show account type selector */}
          {isFromInvitation && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setIsPersonalAccount(true)}
                  className={`flex-1 py-2 px-4 rounded-md border ${
                    isPersonalAccount 
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  Personal Account
                </button>
                <button
                  type="button"
                  onClick={() => setIsPersonalAccount(false)}
                  className={`flex-1 py-2 px-4 rounded-md border ${
                    !isPersonalAccount 
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  University Account
                </button>
              </div>
            </div>
          )}

          {/* Only show organization name input for university accounts */}
          {(!isPersonalAccount || !isFromInvitation) && (
            <Input
              id="organization"
              name="organization"
              type="text"
              label="Organization Name"
              required
              value={formData.organization}
              onChange={handleChange}
              error={error}
            />
          )}

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
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            helperText="Must be at least 8 characters long"
          />

          <div>
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Sign up
            </Button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            href={`/login${redirectUrl ? `?redirectUrl=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
} 