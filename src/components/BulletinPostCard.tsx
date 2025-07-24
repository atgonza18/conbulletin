'use client';

import React, { useState } from 'react';
import { BulletinPost } from '@/context/BulletinContext';
import { useBulletin } from '@/context/BulletinContext';
import { useAuth } from '@/context/AuthContext';
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
  const { deletePost, toggleActionItem, addActionItem, deleteActionItem, state } = useBulletin();
  const { user } = useAuth();
  const [showAddActionItem, setShowAddActionItem] = useState(false);
  const [newActionItemText, setNewActionItemText] = useState('');
  const [newActionItemAssigneeId, setNewActionItemAssigneeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { users } = state;

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
    if (!newActionItemText.trim() || !newActionItemAssigneeId) return;

    setIsSubmitting(true);
    try {
      await addActionItem(post.id, newActionItemText.trim(), newActionItemAssigneeId);
      setNewActionItemText('');
      setNewActionItemAssigneeId('');
      setShowAddActionItem(false);
    } catch (error) {
      console.error('Error adding action item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActionItem = async (actionItemId: string) => {
    if (!confirm('Are you sure you want to delete this action item?')) return;

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
    if (!confirm('Are you sure you want to delete this entire bulletin post?')) return;

    setIsSubmitting(true);
    try {
      await deletePost(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAssigneeName = (assigneeId: string) => {
    const assignee = users.find(u => u.id === assigneeId);
    return assignee?.full_name || 'Unknown User';
  };

  const canDeletePost = user?.id === post.author_id;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {post.title}
          </h3>
          <div className="text-sm text-gray-500">
            By {post.author_name} • {formatRelativeTime(post.created_at)}
          </div>
        </div>
        {canDeletePost && (
          <button
            onClick={handleDeletePost}
            disabled={isSubmitting}
            className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete bulletin"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="text-gray-700 mb-6 whitespace-pre-wrap">
        {post.content}
      </div>

      {/* Action Items Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-medium text-gray-900">
            Action Items ({post.actionItems.length})
          </h4>
          <button
            onClick={() => setShowAddActionItem(!showAddActionItem)}
            className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
            disabled={isSubmitting}
          >
            <PlusIcon className="h-3 w-3" />
            Add Item
          </button>
        </div>

        {/* Add Action Item Form */}
        {showAddActionItem && (
          <div className="mb-4 space-y-3 p-3 bg-gray-50 rounded-md border">
            <input
              type="text"
              value={newActionItemText}
              onChange={(e) => setNewActionItemText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddActionItem()}
              placeholder="Add new action item..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              autoFocus
              disabled={isSubmitting}
            />
            
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-600">
                Assign to:
              </label>
              <select
                value={newActionItemAssigneeId}
                onChange={(e) => setNewActionItemAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                disabled={isSubmitting}
              >
                <option value="">Select assignee...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddActionItem}
                disabled={isSubmitting || !newActionItemText.trim() || !newActionItemAssigneeId}
                className="flex-1 px-3 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add Action Item'}
              </button>
              <button
                onClick={() => {
                  setShowAddActionItem(false);
                  setNewActionItemText('');
                  setNewActionItemAssigneeId('');
                }}
                disabled={isSubmitting}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Action Items List */}
        <div className="space-y-3">
          {post.actionItems.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No action items yet
            </p>
          ) : (
            post.actionItems.map((item) => (
              <div key={item.id} className="group/item">
                <div className="flex items-start gap-3 p-3 rounded border hover:bg-gray-50 transition-colors">
                  {/* Checkbox */}
                  <div className="flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => handleToggleActionItem(item.id)}
                      disabled={isSubmitting}
                      className="transition-colors"
                    >
                      <CheckCircleIcon
                        className={`h-5 w-5 ${
                          item.completed
                            ? 'text-green-500'
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`block text-sm ${
                        item.completed 
                          ? 'text-gray-500 line-through' 
                          : 'text-gray-900'
                      }`}
                    >
                      {item.text}
                    </span>

                    {/* Assignee */}
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-xs text-gray-500">Assigned to:</span>
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                        {item.assigned_to_name || 'Unassigned'}
                      </span>
                    </div>

                    {/* Author stamp */}
                    <div className="mt-1">
                      <span className="text-xs text-gray-400">
                        Added by {item.author_name} • {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleDeleteActionItem(item.id)}
                      disabled={isSubmitting}
                      className="opacity-0 group-hover/item:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                      title="Delete action item"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}