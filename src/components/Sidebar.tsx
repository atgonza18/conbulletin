'use client';

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday } from 'date-fns';
import { useBulletin } from '@/context/BulletinContext';
import { useAuth } from '@/context/AuthContext';
import { CalendarDaysIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get pending action items count for current user
  const getPendingActionItemsCount = () => {
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

  // Get posts count for a specific date
  const getPostsCountForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return posts.filter(post => format(new Date(post.created_at), 'yyyy-MM-dd') === dateStr).length;
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      onDateSelect(null); // Deselect if same date clicked
    } else {
      onDateSelect(date);
    }
  };

  const pendingCount = getPendingActionItemsCount();

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <CalendarDaysIcon className="h-6 w-6 text-gray-900" />
          <h1 className="text-lg font-semibold text-gray-900">Daily Bulletin</h1>
        </div>

        {/* View Switcher */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewChange('bulletins')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'bulletins'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DocumentTextIcon className="h-4 w-4" />
              Bulletins
            </button>
            <button
              onClick={() => onViewChange('my-action-items')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                currentView === 'my-action-items'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircleIcon className="h-4 w-4" />
              My Tasks
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={previousMonth}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="h-8 flex items-center justify-center text-gray-500 font-medium">
                {day}
              </div>
            ))}
            
            {calendarDays.map(date => {
              const postsCount = getPostsCountForDate(date);
              const isSelected = selectedDate && isSameDay(selectedDate, date);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  className={`h-8 flex items-center justify-center text-xs rounded transition-colors relative ${
                    isSelected
                      ? 'bg-gray-900 text-white'
                      : isToday(date)
                      ? 'bg-blue-100 text-blue-900 font-medium'
                      : isCurrentMonth
                      ? 'hover:bg-gray-100 text-gray-900'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {format(date, 'd')}
                  {postsCount > 0 && (
                    <div className={`absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-gray-900'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Info */}
        {selectedDate && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-600">
              Showing bulletins for{' '}
              <span className="font-medium text-gray-900">
                {format(selectedDate, 'MMM d, yyyy')}
              </span>
            </p>
            <button
              onClick={() => onDateSelect(null)}
              className="text-blue-600 hover:text-blue-700 text-xs mt-1"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
