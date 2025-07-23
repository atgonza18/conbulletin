'use client';

import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { useBulletin } from '@/context/BulletinContext';

interface SidebarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
}

export default function Sidebar({ selectedDate, onDateSelect }: SidebarProps) {
  const { state } = useBulletin();
  const { posts } = state;

  // Get unique dates from posts, sorted by most recent
  const uniqueDates = Array.from(
    new Set(posts.map(post => format(new Date(post.created_at), 'yyyy-MM-dd')))
  )
    .map(dateStr => new Date(dateStr))
    .sort((a, b) => b.getTime() - a.getTime());

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const getPostCount = (date: Date) => {
    return posts.filter(p => format(new Date(p.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')).length;
  };

  const totalPosts = posts.length;

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Daily Bulletins
          </h2>
          <p className="text-sm text-gray-500">
            {totalPosts} {totalPosts === 1 ? 'bulletin' : 'bulletins'} total
          </p>
        </div>
        
        {/* All Days Button */}
        <button
          onClick={() => onDateSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-md mb-4 text-sm transition-colors ${
            selectedDate === null
              ? 'bg-gray-900 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">All Days</span>
            <span className={`text-xs px-2 py-1 rounded ${
              selectedDate === null 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {totalPosts}
            </span>
          </div>
        </button>

        {/* Date List */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3">
            Recent Days
          </h3>
          <div className="space-y-1">
            {uniqueDates.map((date) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateKey;
              const count = getPostCount(date);
              
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => onDateSelect(date)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    isSelected
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        isSelected ? 'bg-white/60' : 
                        isToday(date) ? 'bg-blue-600' :
                        isYesterday(date) ? 'bg-orange-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-medium">{getDateLabel(date)}</p>
                        {!isToday(date) && !isYesterday(date) && (
                          <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                            {format(date, 'yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {uniqueDates.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No bulletins yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
