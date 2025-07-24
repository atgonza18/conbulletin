'use client';

import React, { useState } from 'react';
import { useBulletin } from '@/context/BulletinContext';
import { useAuth } from '@/context/AuthContext';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ActionItemData {
  text: string;
  assignedToId: string;
}

export default function CreatePostForm() {
  const { createPost, state } = useBulletin();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [actionItems, setActionItems] = useState<ActionItemData[]>([]);
  const [newActionItem, setNewActionItem] = useState('');
  const [newActionItemAssigneeId, setNewActionItemAssigneeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { users } = state;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await createPost({
        title: title.trim(),
        content: content.trim(),
        actionItems: actionItems.filter(item => item.text.trim()),
      });

      // Reset form
      setTitle('');
      setContent('');
      setActionItems([]);
      setNewActionItem('');
      setNewActionItemAssigneeId('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddActionItem = () => {
    if (newActionItem.trim() && newActionItemAssigneeId) {
      setActionItems([...actionItems, { 
        text: newActionItem.trim(), 
        assignedToId: newActionItemAssigneeId 
      }]);
      setNewActionItem('');
      setNewActionItemAssigneeId('');
    }
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddActionItem();
    }
  };

  const getAssigneeName = (assigneeId: string) => {
    const assignee = users.find(u => u.id === assigneeId);
    return assignee?.full_name || 'Unknown User';
  };

  if (!isOpen) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Create New Daily Bulletin
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Create New Daily Bulletin
        </h2>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isSubmitting}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            placeholder="Enter bulletin title..."
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Daily Summary *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 resize-vertical"
            placeholder="Describe what happened today on the construction site..."
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Action Items (Optional)
          </label>
          
          <div className="border border-gray-200 rounded-md p-3">
            <div className="space-y-3 mb-3">
              <input
                type="text"
                value={newActionItem}
                onChange={(e) => setNewActionItem(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Add action item..."
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

              <button
                type="button"
                onClick={handleAddActionItem}
                className="w-full px-3 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
                disabled={isSubmitting || !newActionItem.trim() || !newActionItemAssigneeId}
              >
                Add Action Item
              </button>
            </div>
            
            {actionItems.length > 0 && (
              <div className="space-y-2">
                {actionItems.map((item, index) => (
                  <div key={index} className="bg-gray-50 px-3 py-2 rounded border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-sm text-gray-900 block mb-1">{item.text}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Assigned to:</span>
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                            {getAssigneeName(item.assignedToId)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveActionItem(index)}
                        className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                        disabled={isSubmitting}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {actionItems.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                No action items added
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? 'Creating...' : 'Create Bulletin'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setTitle('');
              setContent('');
              setActionItems([]);
              setNewActionItem('');
              setNewActionItemAssigneeId('');
            }}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}