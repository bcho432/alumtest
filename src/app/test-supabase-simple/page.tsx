'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabaseSimple() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const testBasicQuery = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('Testing basic Supabase query...');
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .limit(1);
      
      console.log('Query result:', { data, error });
      
      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(`Success! Found ${data?.length || 0} universities`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('Testing auth...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      console.log('Auth result:', { user, error });
      
      if (error) {
        setMessage(`Auth Error: ${error.message}`);
      } else {
        setMessage(`Auth Success! User: ${user?.email || 'None'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Simple Supabase Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testBasicQuery}
          disabled={loading}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Basic Query'}
        </button>

        <button
          onClick={testAuth}
          disabled={loading}
          className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Auth'}
        </button>

        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
} 