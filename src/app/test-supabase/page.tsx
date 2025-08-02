import { SupabaseTest } from '@/components/test/SupabaseTest';

export default function TestSupabasePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Supabase Integration Test</h1>
        <p className="text-gray-600">
          This page tests the Supabase connection, authentication, and database queries.
          Use this to verify everything is working correctly before proceeding with development.
        </p>
      </div>
      
      <SupabaseTest />
    </div>
  );
} 