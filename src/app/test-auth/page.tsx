'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

export default function TestAuthPage() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const createTestUser = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(`Success! User created. Check your email to confirm: ${email}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const signInTestUser = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(`Success! Signed in as: ${data.user?.email}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentUser = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else if (user) {
        setMessage(`Current user: ${user.email}`);
      } else {
        setMessage('No user signed in');
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Signed out successfully');
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Supabase Auth Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="space-y-2">
          <Button
            onClick={createTestUser}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Test User'}
          </Button>

          <Button
            onClick={signInTestUser}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <Button
            onClick={checkCurrentUser}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Checking...' : 'Check Current User'}
          </Button>

          <Button
            onClick={signOut}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>

        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
} 