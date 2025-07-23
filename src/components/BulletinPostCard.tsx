'use client';

import React, { useState } from 'react';
import { BulletinPost } from '@/context/BulletinContext';
import { useBulletin } from '@/context/BulletinContext';
import { formatRelativeTime } from '@/lib/dateUtils';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface BulletinPostCardProps {
  post: BulletinPost;
}

export default function BulletinPostCard({ post }: BulletinPostCardProps) {
  const { deletePost, toggleActionItem, addActionItem, deleteActionItem } = useBulletin();
  const [showAddActionItem, setShowAddActionItem] = useState(false);
  const [newActionItemText, setNewActionItemText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleActionItem = async (actionItemId: string) => {
    setIsSubmitting(true);
    try {
      await toggleActionItem(post.id, actionItemId);
    } catch (error) {
      console.error('Error toggling action item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddActionItem = async () => {
    if (!newActionItemText.trim()) return;

    setIsSubmitting(true);
    try {
      await addActionItem(post.id, newActionItemText.trim());
      setNewActionItemText('');
      setShowAddActionItem(false);
    } catch (error) {
      console.error('Error adding action item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActionItem = async (actionItemId: string) => {
    setIsSubmitting(true);
    try {
      await deleteActionItem(post.id, actionItemId);
    } catch (error) {
      console.error('Error deleting action item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setIsSubmitting(true);
      try {
        await deletePost(post.id);
      } catch (error) {
        console.error('Error deleting post:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {post.title}
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{post.author_name}</span>
            <span>•</span>
            <span>{formatRelativeTime(post.created_at)}</span>
          </div>
        </div>
        <button
          onClick={handleDeletePost}
          disabled={isSubmitting}
          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-900">
            Action Items
            {post.actionItems.length > 0 && (
              <span className="ml-2 text-xs text-gray-500">
                ({post.actionItems.filter(item => !item.completed).length} pending)
              </span>
            )}
          </h3>
          <button
            onClick={() => setShowAddActionItem(true)}
            disabled={isSubmitting}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            + Add item
          </button>
        </div>

        {showAddActionItem && (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newActionItemText}
              onChange={(e) => setNewActionItemText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddActionItem()}
              placeholder="Add new action item..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              autoFocus
              disabled={isSubmitting}
            />
            <button
              onClick={handleAddActionItem}
              disabled={isSubmitting}
              className="px-3 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddActionItem(false);
                setNewActionItemText('');
              }}
              disabled={isSubmitting}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="space-y-3">
          {post.actionItems.map((item) => (
            <div key={item.id} className="group/item">
              <div className="flex items-center gap-3 py-1">
                <button
                  onClick={() => handleToggleActionItem(item.id)}
                  disabled={isSubmitting}
                  className="flex-shrink-0 disabled:opacity-50"
                >
                  {item.completed ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full hover:border-gray-400"></div>
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    item.completed 
                      ? 'text-gray-500 line-through' 
                      : 'text-gray-900'
                  }`}
                >
                  {item.text}
                </span>
                <button
                  onClick={() => handleDeleteActionItem(item.id)}
                  disabled={isSubmitting}
                  className="opacity-0 group-hover/item:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
              {/* Author stamp */}
              <div className="ml-8 mt-1">
                <span className="text-xs text-gray-400">
                  Added by {item.author_name} • {formatRelativeTime(item.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {post.actionItems.length === 0 && !showAddActionItem && (
          <p className="text-sm text-gray-500 italic">No action items</p>
        )}
      </div>
    </div>
  );
}
