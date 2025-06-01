'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { handleFirebaseError } from '@/lib/errors';
import type { SignUpFormData } from '@/types/auth';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function UniversitySignUpPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!form.email || !form.password || !form.confirmPassword) {
      setError('All fields are required');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    // If there are no required fields for step 2, just return true
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (step === 1) {
        if (validateStep1()) {
          setStep(2);
        }
      } else {
        if (validateStep2()) {
          const userCredential = await createUserWithEmailAndPassword(getAuth(), form.email, form.password);
          const user = userCredential.user;

          // Create university document
          const universityData = {
            name: '',
            type: 'university',
            description: '',
            location: '',
            website: '',
            adminIds: [user.uid],
            memberIds: [],
            communityPageUrl: `/university/${user.uid}`,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          if (!db) throw new Error('Firestore db is not initialized');

          await setDoc(doc(db, 'universities', user.uid), universityData);

          // Redirect to university page
          router.push(`/university/${user.uid}`);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          {step === 1 ? 'Create your account' : 'Complete your profile'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 
            ? 'Sign up for your university account'
            : 'Set up your university profile'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email address"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                />

                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  helperText="Must be at least 8 characters long"
                />

                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </>
            ) : (
              <>
                {/* Removed University Name and Organization Type fields */}
              </>
            )}

            <div className="flex items-center justify-between">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                isLoading={loading}
                className={step === 1 ? 'w-full' : ''}
              >
                {step === 1 ? 'Continue' : 'Create Account'}
              </Button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <a
              href="/auth/login"
              className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 