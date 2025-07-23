'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestAuth() {
  const [results, setResults] = useState<any[]>([]);

  const addResult = (test: string, result: any, error?: any) => {
    setResults(prev => [...prev, { test, result, error, timestamp: new Date().toISOString() }]);
  };

  useEffect(() => {
    const runTests = async () => {
      console.log('🧪 Starting Supabase connection tests...');
      addResult('Starting tests', 'Beginning diagnostic tests...');

      // Test 1: Basic Supabase client initialization
      try {
        addResult('Supabase Client', 'Initialized successfully', null);
        console.log('✅ Supabase client initialized');
      } catch (error) {
        addResult('Supabase Client', null, error);
        console.error('❌ Supabase client error:', error);
        return;
      }

      // Test 2: Test basic connection with a simple query
      try {
        console.log('🔌 Testing basic connection...');
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        addResult('Basic Connection', data, error);
        console.log('✅ Basic connection test:', { data, error });
      } catch (error) {
        addResult('Basic Connection', null, error);
        console.error('❌ Basic connection failed:', error);
      }

      // Test 3: Test bulletin_posts table access
      try {
        console.log('📋 Testing bulletin_posts table...');
        const { data, error } = await supabase
          .from('bulletin_posts')
          .select('count')
          .limit(1);
        addResult('Bulletin Posts Table', data, error);
        console.log('✅ Bulletin posts table test:', { data, error });
      } catch (error) {
        addResult('Bulletin Posts Table', null, error);
        console.error('❌ Bulletin posts table failed:', error);
      }

      // Test 4: Test action_items table access  
      try {
        console.log('📝 Testing action_items table...');
        const { data, error } = await supabase
          .from('action_items')
          .select('count')
          .limit(1);
        addResult('Action Items Table', data, error);
        console.log('✅ Action items table test:', { data, error });
      } catch (error) {
        addResult('Action Items Table', null, error);
        console.error('❌ Action items table failed:', error);
      }

      // Test 5: Try to insert a test action item
      try {
        console.log('📝 Testing action_items INSERT...');
        const { data, error } = await supabase
          .from('action_items')
          .insert({
            post_id: '00000000-0000-0000-0000-000000000000', // Fake ID for test
            text: 'Test action item',
            author_id: '00000000-0000-0000-0000-000000000000', // Fake ID for test  
            author_name: 'Test User'
          })
          .select();
        addResult('Action Items INSERT Test', data, error);
        console.log('✅ Action items INSERT test:', { data, error });
      } catch (error) {
        addResult('Action Items INSERT Test', null, error);
        console.error('❌ Action items INSERT failed:', error);
      }

      // Test 6: Test authentication status
      try {
        console.log('🔐 Testing authentication...');
        const { data: { session }, error } = await supabase.auth.getSession();
        addResult('Authentication', session?.user ? 'User authenticated' : 'No user session', error);
        console.log('✅ Auth test:', { session: !!session, user: !!session?.user, error });
      } catch (error) {
        addResult('Authentication', null, error);
        console.error('❌ Auth test failed:', error);
      }

      console.log('🏁 All tests completed');
      addResult('Tests Complete', 'All diagnostic tests finished', null);
    };

    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Supabase Connection Diagnostics</h1>
        
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">{result.test}</h3>
                <span className="text-xs text-gray-500">{new Date(result.timestamp).toLocaleTimeString()}</span>
              </div>
              
              {result.result && (
                <div className="mb-2">
                  <p className="text-sm text-gray-600 mb-1">Result:</p>
                  <pre className="bg-green-50 p-2 rounded text-xs overflow-x-auto">
                    {typeof result.result === 'object' ? JSON.stringify(result.result, null, 2) : result.result}
                  </pre>
                </div>
              )}
              
              {result.error && (
                <div>
                  <p className="text-sm text-red-600 mb-1">Error:</p>
                  <pre className="bg-red-50 p-2 rounded text-xs overflow-x-auto text-red-800">
                    {typeof result.error === 'object' ? JSON.stringify(result.error, null, 2) : result.error}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Running connection tests...</p>
          </div>
        )}
      </div>
    </div>
  );
} 