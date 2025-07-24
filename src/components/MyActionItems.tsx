'use client';

import React, { useMemo, useState } from 'react';
import { useBulletin } from '@/context/BulletinContext';
import { useAuth } from '@/context/AuthContext';
import { formatRelativeTime } from '@/lib/dateUtils';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function MyActionItems() {
  const { state, toggleActionItem } = useBulletin();
  const { user } = useAuth();
  const { posts, loading } = state;
  const [togglingItems, setTogglingItems] = useState<Set<string>>(new Set());

  // Get all action items assigned to the current user
  const myActionItems = useMemo(() => {
    if (!user) return [];
    
    const items: any[] = [];
    posts.forEach(post => {
      post.actionItems.forEach(item => {
        // Check if assigned to current user, fallback to author for backward compatibility
        const isAssignedToMe = 
          item.assigned_to_id === user.id || 
          // Fallback to author for backward compatibility (when no assignments exist)
          (!item.assigned_to_id && item.author_id === user.id);
        
        if (isAssignedToMe) {
          items.push({
            ...item,
            post_title: post.title,
            post_id: post.id,
            post_created_at: item.created_at, // Use item.created_at for action item specific date
            // Handle missing assignment fields gracefully
            assigned_to_name: item.assigned_to_name || item.author_name,
            assigned_to_id: item.assigned_to_id || item.author_id,
          });
        }
      });
    });
    
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [posts, user]);

  const pendingItems = myActionItems.filter(item => !item.completed);
  const completedItems = myActionItems.filter(item => item.completed);

  const handleToggleActionItem = async (postId: string, actionItemId: string) => {
    // Add to toggling set to show loading state
    setTogglingItems(prev => new Set(prev).add(actionItemId));
    
    try {
      await toggleActionItem(postId, actionItemId);
    } catch (error) {
      console.error('Error toggling action item:', error);
      // Show user-friendly error
      alert('Failed to update action item. Please try again.');
    } finally {
      // Remove from toggling set
      setTogglingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionItemId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your action items...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to view your action items.</p>
      </div>
    );
  }

  const renderActionItem = (item: any, isPending: boolean) => {
    const isToggling = togglingItems.has(item.id);
    
    return (
      <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-start gap-3">
          <button
            onClick={() => handleToggleActionItem(item.post_id, item.id)}
            disabled={isToggling}
            className={'flex-shrink-0 mt-1 transition-all ' + 
              (isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')
            }
          >
            <CheckCircleIcon className={'h-5 w-5 ' + 
              (item.completed 
                ? 'text-green-500' 
                : 'text-gray-300 hover:text-green-400') + 
              (isToggling ? ' animate-pulse' : '')
            } />
          </button>
          <div className="flex-1">
            <p className={'font-medium ' + 
              (item.completed 
                ? 'text-gray-500 line-through' 
                : 'text-gray-900')
            }>
              {item.text}
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                From: <span className="font-medium">{item.post_title}</span>
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Created by {item.author_name}</span>
                <span>•</span>
                <span>{formatRelativeTime(item.created_at)}</span>
              </div>
              
              {/* Show assignee information */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Assigned to:</span>
                <span className={'inline-flex items-center px-2 py-0.5 rounded text-xs ' +
                  (item.assigned_to_id === user?.id 
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'bg-gray-100 text-gray-600')
                }>
                  {item.assigned_to_name || 'Unassigned'}
                  {item.assigned_to_id === user?.id && ' (you)'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            {item.completed && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                <CheckCircleIcon className="h-3 w-3" />
                Completed
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">My Action Items</h1>
        <p className="text-gray-600 mt-1">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 bg-orange-500 rounded-full animate-pulse inline-block"></span>
            {pendingItems.length} pending
          </span>
          <span className="mx-2">•</span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 bg-green-500 rounded-full inline-block"></span>
            {completedItems.length} completed
          </span>
          <span className="mx-2">•</span>
          <span>{myActionItems.length} total</span>
        </p>
      </div>

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="h-3 w-3 bg-orange-500 rounded-full animate-pulse inline-block"></span>
            Pending ({pendingItems.length})
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200 shadow-sm">
            {pendingItems.map((item) => renderActionItem(item, true))}
          </div>
        </div>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="h-3 w-3 bg-green-500 rounded-full inline-block"></span>
            Completed ({completedItems.length})
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200 shadow-sm opacity-75">
            {completedItems.map((item) => renderActionItem(item, false))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {myActionItems.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <CheckCircleIcon className="mx-auto h-16 w-16" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No action items assigned</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            You don't have any action items assigned to you yet. Action items will appear here when they're created in daily bulletins.
          </p>
        </div>
      )}
    </div>
  );
}
