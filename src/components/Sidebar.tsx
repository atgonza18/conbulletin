'use client';

import React from 'react';
import { format, isToday, isYesterday, subDays, startOfDay } from 'date-fns';
import { useBulletin } from '@/context/BulletinContext';
import { useAuth } from '@/context/AuthContext';
import { CheckCircleIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  currentView: 'bulletins' | 'my-action-items';
  onViewChange: (view: 'bulletins' | 'my-action-items') => void;
}

export default function Sidebar({ selectedDate, onDateSelect, currentView, onViewChange }: SidebarProps) {
  const { state } = useBulletin();
  const { user } = useAuth();
  const { posts } = state;

  // Generate the last 7 days (including today) to always show in navigation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    return startOfDay(subDays(new Date(), i));
  });

  // Get unique dates from posts that are older than 7 days
  const olderPostDates = Array.from(
    new Set(
      posts
        .filter(post => {
          const postDate = startOfDay(new Date(post.created_at));
          return !last7Days.some(recentDate => recentDate.getTime() === postDate.getTime());
        })
        .map(post => startOfDay(new Date(post.created_at)).getTime())
    )
  )
    .map(timestamp => new Date(timestamp))
    .sort((a, b) => b.getTime() - a.getTime());

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const getPostCount = (date: Date) => {
    return posts.filter(p => {
      const postDate = startOfDay(new Date(p.created_at));
      return postDate.getTime() === date.getTime();
    }).length;
  };

  // Get count of action items assigned to current user (supporting multiple assignees)
  const getMyActionItemsCount = () => {
    if (!user) return 0;
    let count = 0;
    posts.forEach(post => {
      post.actionItems.forEach(item => {
        // Check if assigned to current user, fallback to author for backward compatibility
        const isAssignedToMe = 
          item.assigned_to_id === user.id || 
          // Fallback to author for backward compatibility (when no assignments exist)
          (!item.assigned_to_id && item.author_id === user.id);
        
        if (isAssignedToMe && !item.completed) {
          count++;
        }
      });
    });
    return count;
  };

  const renderDateButton = (date: Date, isOlder = false) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateKey;
    const count = getPostCount(date);

    return (
      <button
        key={date.toISOString()}
        onClick={() => {
          onViewChange('bulletins');
          onDateSelect(date);
        }}
        className={'w-full text-left px-3 py-2 rounded-md text-sm transition-colors ' + 
          (isSelected && currentView === 'bulletins'
            ? 'bg-gray-900 text-white'
            : 'text-gray-700 hover:bg-gray-100')
        }
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={'h-2 w-2 rounded-full ' + 
              (isSelected && currentView === 'bulletins' ? 'bg-white/60' :
              isToday(date) ? 'bg-blue-600' :
              isYesterday(date) ? 'bg-orange-500' :
              count > 0 ? 'bg-green-500' : 'bg-gray-300')
            }></div>
            <div>
              <p className="font-medium">{getDateLabel(date)}</p>
              {!isToday(date) && !isYesterday(date) && (
                <p className={'text-xs ' + (isSelected && currentView === 'bulletins' ? 'text-white/70' : 'text-gray-500')}>
                  {format(date, 'yyyy')}
                </p>
              )}
            </div>
          </div>
          <span className={'text-xs px-2 py-1 rounded ' +
            (isSelected && currentView === 'bulletins'
              ? 'bg-white/20 text-white'
              : count > 0
              ? 'bg-gray-200 text-gray-600'
              : 'bg-gray-100 text-gray-400')
          }>
            {count}
          </span>
        </div>
      </button>
    );
  };

  const totalPosts = posts.length;
  const myActionItemsCount = getMyActionItemsCount();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Construction Bulletin
          </h2>
          <p className="text-sm text-gray-500">
            {totalPosts} {totalPosts === 1 ? 'bulletin' : 'bulletins'}
          </p>
        </div>

        {/* View Selector */}
        <div className="mb-6 space-y-2">
          {/* My Action Items Button */}
          <button
            onClick={() => onViewChange('my-action-items')}
            className={'w-full text-left px-3 py-2 rounded-md text-sm transition-colors ' +
              (currentView === 'my-action-items'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100')
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="font-medium">My Action Items</span>
              </div>
              {myActionItemsCount > 0 && (
                <span className={'text-xs px-2 py-1 rounded ' +
                  (currentView === 'my-action-items'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-600')
                }>
                  {myActionItemsCount}
                </span>
              )}
            </div>
          </button>

          {/* All Days Button */}
          <button
            onClick={() => {
              onViewChange('bulletins');
              onDateSelect(null);
            }}
            className={'w-full text-left px-3 py-2 rounded-md text-sm transition-colors ' +
              (selectedDate === null && currentView === 'bulletins'
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100')
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-4 w-4" />
                <span className="font-medium">All Bulletins</span>
              </div>
              <span className={'text-xs px-2 py-1 rounded ' +
                (selectedDate === null && currentView === 'bulletins'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600')
              }>
                {totalPosts}
              </span>
            </div>
          </button>
        </div>

        {/* Recent Days - Only show when in bulletins view */}
        {currentView === 'bulletins' && (
          <div className="mb-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3">
              Recent Days
            </h3>
            <div className="space-y-1">
              {last7Days.map((date) => renderDateButton(date))}
            </div>
          </div>
        )}

        {/* Older Bulletins - Only show when in bulletins view */}
        {currentView === 'bulletins' && olderPostDates.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3">
              Older Bulletins
            </h3>
            <div className="space-y-1">
              {olderPostDates.map((date) => renderDateButton(date, true))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
