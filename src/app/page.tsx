'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBulletin } from '@/context/BulletinContext';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import BulletinPostCard from '@/components/BulletinPostCard';
import CreatePostForm from '@/components/CreatePostForm';
import { format } from 'date-fns';

export default function Home() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { state, refreshPosts } = useBulletin();
  const { posts, loading: postsLoading, error } = state;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting to login
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Filter posts based on selected date
  const filteredPosts = selectedDate
    ? posts.filter(post => format(new Date(post.created_at), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
    : posts;

  // Group posts by date for display
  const groupedPosts = filteredPosts.reduce((acc, post) => {
    const dateKey = format(new Date(post.created_at), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(post);
    return acc;
  }, {} as Record<string, typeof posts>);

  const sortedDateKeys = Object.keys(groupedPosts).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      <Header userName={profile?.full_name || 'User'} />
      
      <div className="ml-64 mt-24">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <CreatePostForm />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Error: {error}</span>
                <button
                  onClick={refreshPosts}
                  className="ml-auto text-sm underline hover:no-underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {postsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading bulletins...</p>
            </div>
          ) : sortedDateKeys.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bulletins yet</h3>
              <p className="text-gray-600">
                Create your first daily bulletin to start tracking construction progress.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedDateKeys.map((dateKey) => (
                <div key={dateKey}>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {groupedPosts[dateKey].map((post) => (
                      <BulletinPostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
