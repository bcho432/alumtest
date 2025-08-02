'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import { profileService, universityService } from '@/lib/supabase-services';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function SupabaseTest() {
  const { user, loading, signIn, signUp, signOut } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    try {
      // Test 1: Supabase connection
      addResult('Testing Supabase connection...');
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        addResult(`❌ Connection failed: ${error.message}`);
      } else {
        addResult('✅ Supabase connection successful');
      }

      // Test 2: Get universities
      addResult('Testing universities query...');
      try {
        const universities = await universityService.getUniversities();
        addResult(`✅ Found ${universities.length} universities`);
      } catch (error) {
        addResult(`❌ Universities query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test 3: Get profiles
      addResult('Testing profiles query...');
      try {
        const profiles = await profileService.searchProfiles('test');
        addResult(`✅ Found ${profiles.length} profiles`);
      } catch (error) {
        addResult(`❌ Profiles query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test 4: Authentication
      addResult('Testing authentication...');
      if (user) {
        addResult(`✅ User authenticated: ${user.email}`);
      } else {
        addResult('ℹ️ No user authenticated (this is normal)');
      }

    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const testSignUp = async () => {
    try {
      addResult('Testing sign up...');
      const result = await signUp({
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        confirmPassword: 'password123'
      });
      
      if (result.success) {
        addResult('✅ Sign up successful');
      } else {
        addResult(`❌ Sign up failed: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Sign up error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testSignIn = async () => {
    try {
      addResult('Testing sign in...');
      const result = await signIn({
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (result.success) {
        addResult('✅ Sign in successful');
      } else {
        addResult(`❌ Sign in failed: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Sign in error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
          <Button onClick={runTests} disabled={testing}>
            {testing ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          <Button onClick={testSignUp} variant="outline">
            Test Sign Up
          </Button>
          <Button onClick={testSignIn} variant="outline">
            Test Sign In
          </Button>
          {user && (
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Auth Status:</strong> {loading ? 'Loading...' : user ? 'Authenticated' : 'Not authenticated'}</p>
          {user && (
            <p><strong>User:</strong> {user.email}</p>
          )}
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No tests run yet. Click "Run All Tests" to start.</p>
        ) : (
          <div className="space-y-1 text-sm">
            {testResults.map((result, index) => (
              <div key={index} className="font-mono">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
} 