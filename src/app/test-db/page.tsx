'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { userService } from '@/lib/supabase-services';

export default function TestDBPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Test basic connection
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        setMessage(`Database Error: ${error.message}`);
      } else {
        setMessage('Database connection successful!');
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testUserService = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Test userService.getUserProfile
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        try {
          const profile = await userService.getUserProfile(user.id);
          setMessage(`User profile found: ${JSON.stringify(profile, null, 2)}`);
        } catch (error) {
          setMessage(`UserService Error: ${error}`);
        }
      } else {
        setMessage('No user signed in');
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        try {
          const profile = await userService.updateUserProfile(user.id, {
            email: user.email,
            displayName: user.email?.split('@')[0] || 'Test User',
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          setMessage(`User profile created: ${JSON.stringify(profile, null, 2)}`);
        } catch (error) {
          setMessage(`Create User Error: ${error}`);
        }
      } else {
        setMessage('No user signed in');
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Database Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Database Connection'}
        </button>

        <button
          onClick={testUserService}
          disabled={loading}
          className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test User Service'}
        </button>

        <button
          onClick={createTestUser}
          disabled={loading}
          className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Test User Profile'}
        </button>

        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="text-sm whitespace-pre-wrap">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
} 