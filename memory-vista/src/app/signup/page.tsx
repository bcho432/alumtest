'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { handleFirebaseError } from '@/lib/errors';
import { createOrganization } from '@/lib/services/organization';
import type { SignUpFormData } from '@/types/forms';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SignUpFormData>({
    organization: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { user } = await signUp(formData.email, formData.password);
      if (!user) throw new Error('User creation failed');

      // Create organization
      const org = await createOrganization(user.uid, {
        name: formData.organization,
      });

      router.push(`/${org.id}/dashboard`);
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
          Create your organization account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
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
            href="/login"
            className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
} 