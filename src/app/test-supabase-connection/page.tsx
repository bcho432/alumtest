'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabaseConnection() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const testClientInit = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('Testing Supabase client initialization...');
      console.log('Supabase client:', supabase);
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Supabase Anon Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
      
      setMessage('Supabase client initialized. Check console for details.');
    } catch (error) {
      console.error('Error:', error);
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testBasicHTTP = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('Testing basic HTTP request...');
      const response = await fetch('https://httpbin.org/get');
      const data = await response.json();
      
      console.log('HTTP test result:', data);
      setMessage('Basic HTTP request successful');
    } catch (error) {
      console.error('Error:', error);
      setMessage(`HTTP Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseURL = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('Testing Supabase URL...');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });
      
      console.log('Supabase URL test response:', response.status, response.statusText);
      setMessage(`Supabase URL test: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error('Error:', error);
      setMessage(`Supabase URL Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSimpleQuery = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('Testing simple query with timeout...');
      
      // Create a promise that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000);
      });
      
      // Create the actual query
      const queryPromise = supabase
        .from('universities')
        .select('count')
        .limit(1);
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]);
      
      console.log('Query result:', result);
      setMessage('Simple query completed successfully');
    } catch (error) {
      console.error('Error:', error);
      setMessage(`Query Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testTableExists = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('Testing if tables exist...');
      
      // Test different table names to see which ones exist
      const tables = ['universities', 'users', 'profiles', 'test'];
      
      for (const table of tables) {
        try {
          console.log(`Testing table: ${table}`);
          const { data, error } = await supabase
            .from(table)
            .select('count')
            .limit(1);
          
          if (error) {
            console.log(`Table ${table} error:`, error.message);
          } else {
            console.log(`Table ${table} exists!`);
            setMessage(`Table ${table} exists and is accessible`);
            return;
          }
        } catch (err) {
          console.log(`Table ${table} failed:`, err);
        }
      }
      
      setMessage('No accessible tables found. Database may not be set up.');
    } catch (error) {
      console.error('Error:', error);
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testClientInit}
          disabled={loading}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Client Init'}
        </button>

        <button
          onClick={testBasicHTTP}
          disabled={loading}
          className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Basic HTTP'}
        </button>

        <button
          onClick={testSupabaseURL}
          disabled={loading}
          className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Supabase URL'}
        </button>

        <button
          onClick={testSimpleQuery}
          disabled={loading}
          className="w-full p-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Simple Query (10s timeout)'}
        </button>

        <button
          onClick={testTableExists}
          disabled={loading}
          className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Table Existence'}
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