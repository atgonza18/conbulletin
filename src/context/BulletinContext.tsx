'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface ActionItem {
  id: string;
  post_id: string;
  text: string;
  completed: boolean;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface BulletinPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  actionItems: ActionItem[];
}

interface BulletinState {
  posts: BulletinPost[];
  loading: boolean;
  error: string | null;
}

type BulletinAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_POSTS'; payload: BulletinPost[] }
  | { type: 'ADD_POST'; payload: BulletinPost }
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'UPDATE_POST'; payload: BulletinPost }
  | { type: 'ADD_ACTION_ITEM'; payload: { postId: string; actionItem: ActionItem } }
  | { type: 'UPDATE_ACTION_ITEM'; payload: { postId: string; actionItem: ActionItem } }
  | { type: 'DELETE_ACTION_ITEM'; payload: { postId: string; actionItemId: string } };

const initialState: BulletinState = {
  posts: [],
  loading: false,
  error: null,
};

function bulletinReducer(state: BulletinState, action: BulletinAction): BulletinState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_POSTS':
      return { ...state, posts: action.payload, loading: false, error: null };
    case 'ADD_POST':
      return { ...state, posts: [action.payload, ...state.posts] };
    case 'DELETE_POST':
      return { ...state, posts: state.posts.filter(post => post.id !== action.payload) };
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.id ? action.payload : post
        ),
      };
    case 'ADD_ACTION_ITEM':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.postId
            ? { ...post, actionItems: [...post.actionItems, action.payload.actionItem] }
            : post
        ),
      };
    case 'UPDATE_ACTION_ITEM':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.postId
            ? {
                ...post,
                actionItems: post.actionItems.map(item =>
                  item.id === action.payload.actionItem.id ? action.payload.actionItem : item
                ),
              }
            : post
        ),
      };
    case 'DELETE_ACTION_ITEM':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.postId
            ? {
                ...post,
                actionItems: post.actionItems.filter(item => item.id !== action.payload.actionItemId),
              }
            : post
        ),
      };
    default:
      return state;
  }
}

interface BulletinContextType {
  state: BulletinState;
  createPost: (data: { title: string; content: string; actionItems: string[] }) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  addActionItem: (postId: string, text: string) => Promise<void>;
  toggleActionItem: (postId: string, actionItemId: string) => Promise<void>;
  deleteActionItem: (postId: string, actionItemId: string) => Promise<void>;
}

const BulletinContext = createContext<BulletinContextType | undefined>(undefined);

interface BulletinProviderProps {
  children: ReactNode;
}

export const BulletinProvider: React.FC<BulletinProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(bulletinReducer, initialState);
  const { user, profile } = useAuth();
  const fetchingRef = useRef(false);

  const fetchPosts = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      console.log('🔄 fetchPosts already running, skipping');
      return;
    }

    console.log('🔄 fetchPosts called');
    fetchingRef.current = true;
    
    // Add timeout to prevent indefinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Fetch timeout - resetting loading state');
      fetchingRef.current = false;
      dispatch({ type: 'SET_ERROR', payload: 'Request timed out. Please try again.' });
    }, 15000); // 15 second timeout

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('📡 Starting to fetch posts...');

      // Fetch posts with action items
      const { data: posts, error: postsError } = await supabase
        .from('bulletin_posts')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📝 Posts query result:', { posts, postsError });
      if (postsError) throw postsError;

      // Fetch all action items
      console.log('📡 Fetching action items...');
      console.log('🔍 About to query action_items table with select *');
      
      const { data: actionItems, error: actionItemsError } = await supabase
        .from('action_items')
        .select('*')
        .order('created_at', { ascending: true });

      console.log('✅ Action items query completed');
      console.log('📊 Action items result:', { 
        itemsCount: actionItems?.length || 0, 
        items: actionItems,
        error: actionItemsError 
      });
      
      if (actionItemsError) {
        console.error('❌ Action items query failed:', actionItemsError);
        throw actionItemsError;
      }

      // Group action items by post_id
      const actionItemsByPost: Record<string, ActionItem[]> = {};
      actionItems?.forEach(item => {
        if (!actionItemsByPost[item.post_id]) {
          actionItemsByPost[item.post_id] = [];
        }
        actionItemsByPost[item.post_id].push(item);
      });

      // Combine posts with their action items
      const postsWithActionItems: BulletinPost[] = posts?.map(post => ({
        ...post,
        actionItems: actionItemsByPost[post.id] || [],
      })) || [];

      // Clear timeout since we succeeded
      clearTimeout(timeoutId);
      fetchingRef.current = false;
      
      console.log('🎉 Successfully processed data, dispatching SET_POSTS with:', postsWithActionItems.length, 'posts');
      dispatch({ type: 'SET_POSTS', payload: postsWithActionItems });
      console.log('✅ fetchPosts completed successfully');
    } catch (error) {
      clearTimeout(timeoutId);
      fetchingRef.current = false;
      console.error('❌ Error fetching posts:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch posts' });
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // Handle browser tab visibility changes
  useEffect(() => {
    let visibilityTimeout: NodeJS.Timeout;
    let lastVisibilityTime = 0;

    const handleVisibilityChange = () => {
      const now = Date.now();
      
      if (document.visibilityState === 'visible' && user && !fetchingRef.current) {
        // Prevent rapid successive visibility changes (within 2 seconds)
        if (now - lastVisibilityTime < 2000) {
          console.log('👁️ Tab visibility change too rapid, ignoring');
          return;
        }
        
        lastVisibilityTime = now;
        console.log('👁️ Tab became visible, refreshing data');
        
        // Clear any existing timeout
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
        }
        
        // Debounce the visibility refresh to prevent multiple rapid calls
        visibilityTimeout = setTimeout(() => {
          if (user && !fetchingRef.current && document.visibilityState === 'visible') {
            fetchPosts();
          }
        }, 1000); // Increased delay to prevent rapid firing
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
    };
  }, [user, fetchPosts]);

  useEffect(() => {
    console.log('🔍 useEffect triggered - user:', !!user);
    if (user && !fetchingRef.current) {
      console.log('👤 User authenticated, calling fetchPosts');
      fetchPosts();
    } else if (!user) {
      console.log('❌ No user, skipping fetchPosts');
      // Reset state when no user
      fetchingRef.current = false;
      dispatch({ type: 'SET_POSTS', payload: [] });
    }
  }, [user, fetchPosts]);

  const createPost = async (data: { title: string; content: string; actionItems: string[] }) => {
    if (!user || !profile) {
      throw new Error('User not authenticated');
    }

    try {
      // Create the post
      const { data: newPost, error: postError } = await supabase
        .from('bulletin_posts')
        .insert({
          title: data.title,
          content: data.content,
          author_id: user.id,
          author_name: profile.full_name,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Create action items if any
      const actionItems: ActionItem[] = [];
      console.log('🔍 Action items to create:', data.actionItems);
      if (data.actionItems.length > 0) {
        console.log('📝 Creating action items for post:', newPost.id);
        console.log('👤 User info:', { userId: user.id, authorName: profile.full_name });
        
        const itemsToInsert = data.actionItems.map(text => ({
          post_id: newPost.id,
          text,
          author_id: user.id,
          author_name: profile.full_name,
        }));
        console.log('📋 Items to insert:', itemsToInsert);

        const { data: newActionItems, error: actionItemsError } = await supabase
          .from('action_items')
          .insert(itemsToInsert)
          .select();

        console.log('✅ Action items insert result:', { newActionItems, actionItemsError });
        if (actionItemsError) {
          console.error('❌ Action items insert error:', actionItemsError);
          throw actionItemsError;
        }
        actionItems.push(...(newActionItems || []));
        console.log('🎉 Action items created successfully:', actionItems.length);
      } else {
        console.log('ℹ️ No action items to create');
      }

      const postWithActionItems: BulletinPost = {
        ...newPost,
        actionItems,
      };

      dispatch({ type: 'ADD_POST', payload: postWithActionItems });
    } catch (error) {
      console.error('Error creating post:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create post' });
      throw error;
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('bulletin_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      dispatch({ type: 'DELETE_POST', payload: postId });
    } catch (error) {
      console.error('Error deleting post:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete post' });
      throw error;
    }
  };

  const addActionItem = async (postId: string, text: string) => {
    if (!user || !profile) {
      throw new Error('User not authenticated');
    }

    try {
      const { data: newActionItem, error } = await supabase
        .from('action_items')
        .insert({
          post_id: postId,
          text,
          author_id: user.id,
          author_name: profile.full_name,
        })
        .select()
        .single();

      if (error) throw error;

      dispatch({
        type: 'ADD_ACTION_ITEM',
        payload: { postId, actionItem: newActionItem },
      });
    } catch (error) {
      console.error('Error adding action item:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add action item' });
      throw error;
    }
  };

  const toggleActionItem = async (postId: string, actionItemId: string) => {
    try {
      // Find current state
      const post = state.posts.find(p => p.id === postId);
      const actionItem = post?.actionItems.find(item => item.id === actionItemId);
      
      if (!actionItem) throw new Error('Action item not found');

      const { data: updatedActionItem, error } = await supabase
        .from('action_items')
        .update({ completed: !actionItem.completed })
        .eq('id', actionItemId)
        .select()
        .single();

      if (error) throw error;

      dispatch({
        type: 'UPDATE_ACTION_ITEM',
        payload: { postId, actionItem: updatedActionItem },
      });
    } catch (error) {
      console.error('Error toggling action item:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update action item' });
      throw error;
    }
  };

  const deleteActionItem = async (postId: string, actionItemId: string) => {
    try {
      const { error } = await supabase
        .from('action_items')
        .delete()
        .eq('id', actionItemId);

      if (error) throw error;

      dispatch({
        type: 'DELETE_ACTION_ITEM',
        payload: { postId, actionItemId },
      });
    } catch (error) {
      console.error('Error deleting action item:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete action item' });
      throw error;
    }
  };

  const value: BulletinContextType = {
    state,
    createPost,
    deletePost,
    addActionItem,
    toggleActionItem,
    deleteActionItem,
  };

  return (
    <BulletinContext.Provider value={value}>
      {children}
    </BulletinContext.Provider>
  );
};

export const useBulletin = () => {
  const context = useContext(BulletinContext);
  if (context === undefined) {
    throw new Error('useBulletin must be used within a BulletinProvider');
  }
  return context;
};
