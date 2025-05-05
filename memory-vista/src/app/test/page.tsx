'use client';

import { useEffect, useState } from 'react';
import { getAuth, getDb } from '@/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function TestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function testFirebase() {
      try {
        const auth = getAuth();
        const db = getDb();
        
        // Test Firestore
        const testCollection = collection(db, 'test');
        await addDoc(testCollection, { timestamp: new Date() });
        const docs = await getDocs(testCollection);
        
        // Test Auth
        const currentUser = auth.currentUser;
        
        setStatus('success');
        setMessage(`Firebase is working! Found ${docs.size} test documents. Auth state: ${currentUser ? 'Logged in' : 'Not logged in'}`);
      } catch (error) {
        setStatus('error');
        setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    testFirebase();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Firebase Test
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <div className={`p-4 rounded-md ${
            status === 'loading' ? 'bg-yellow-50 text-yellow-700' :
            status === 'success' ? 'bg-green-50 text-green-700' :
            'bg-red-50 text-red-700'
          }`}>
            {status === 'loading' ? 'Testing Firebase connection...' : message}
          </div>
        </div>
      </div>
    </div>
  );
} 