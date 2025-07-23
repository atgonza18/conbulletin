'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { createClient } from '@supabase/supabase-js';

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
  const lastFetchTimeRef = useRef(0);
  const initialLoadDoneRef = useRef(false);

  const fetchPosts = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      console.log('🔄 fetchPosts already running, skipping');
      return;
    }

    // Prevent frequent fetches unless forced
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (!forceRefresh && initialLoadDoneRef.current && timeSinceLastFetch < 30000) {
      console.log('🔄 fetchPosts called too soon, skipping (last fetch:', timeSinceLastFetch, 'ms ago)');
      return;
    }

    console.log('🔄 fetchPosts called', forceRefresh ? '(forced)' : '', 'at', new Date().toISOString());
    fetchingRef.current = true;
    lastFetchTimeRef.current = now;
    
    const MAX_RETRIES = 2;
    let retryCount = 0;
    
    const attemptFetch = async (): Promise<void> => {
      // Shorter timeout per attempt with retries
      const timeoutId = setTimeout(() => {
        console.log('⏰ Fetch timeout - attempt', retryCount + 1, 'at', new Date().toISOString());
        fetchingRef.current = false;
        
        if (retryCount < MAX_RETRIES) {
          console.log('🔄 Retrying fetch... (attempt', retryCount + 2, 'of', MAX_RETRIES + 1, ')');
          retryCount++;
          setTimeout(() => attemptFetch(), 1000); // Retry after 1 second
        } else {
          dispatch({ type: 'SET_ERROR', payload: 'Request timed out after multiple attempts. Please refresh the page.' });
        }
      }, 8000); // Shorter timeout per attempt

      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        console.log('📡 Starting fetch attempt', retryCount + 1, 'at', new Date().toISOString());

        // Test session validity first with failsafe for corrupted auth client
        console.log('🔐 Checking session validity...');
        let session = null;
        let currentClient = supabase;
        
        try {
          // Race the session check against a timeout to detect stuck auth client
          const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Session check timeout - auth client may be corrupted')), 3000)
            )
          ]);
          
          const { data, error: sessionError } = sessionResult as any;
          if (sessionError) {
            console.error('❌ Session error:', sessionError);
            throw new Error(`Session validation failed: ${sessionError.message}`);
          }
          session = data.session;
          console.log('✅ Main client session check succeeded');
          
        } catch (sessionCheckError) {
          console.warn('⚠️ Main client session check failed/timed out:', sessionCheckError);
          console.log('🔄 Creating fresh client to bypass corrupted auth state...');
          
          // Create fresh client as fallback
          const freshClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
            {
              auth: {
                persistSession: false, // Don't persist to avoid conflicts
                autoRefreshToken: false
              }
            }
          );
          
          // Try to get session from fresh client
          try {
            const freshSessionResult = await Promise.race([
              freshClient.auth.getSession(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Fresh client session timeout')), 3000)
              )
            ]);
            
            const { data, error } = freshSessionResult as any;
            if (error) throw error;
            
            session = data.session;
            currentClient = freshClient;
            console.log('✅ Fresh client session check succeeded - will use fresh client for queries');
            
            // Set the session on the fresh client for database queries
            if (session) {
              console.log('🔄 Setting session on fresh client for database access');
              await currentClient.auth.setSession(session);
            }
            
          } catch (freshError) {
            console.error('❌ Fresh client also failed:', freshError);
            throw new Error('Both main and fresh client auth checks failed');
          }
        }
        
        if (!session) {
          console.error('❌ No valid session found in either client');
          throw new Error('Authentication session expired');
        }
        
        console.log('✅ Session valid, proceeding with queries using', currentClient === supabase ? 'main client' : 'fresh client');

        // Fetch posts with a more aggressive timeout approach
        console.log('🔍 Querying bulletin_posts table...');
        const postsStartTime = Date.now();
        
        const postsPromise = currentClient
          .from('bulletin_posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Race the query against a timeout
        const postsResult = await Promise.race([
          postsPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Posts query timeout')), 6000)
          )
        ]);
        
        const postsEndTime = Date.now();
        console.log('📝 Posts query completed in', postsEndTime - postsStartTime, 'ms');
        
        const { data: posts, error: postsError } = postsResult as any;
        console.log('📝 Posts result:', { 
          postsCount: posts?.length || 0, 
          hasError: !!postsError 
        });
        
        if (postsError) {
          console.error('❌ Posts query failed:', postsError);
          throw postsError;
        }

        // Fetch action items with timeout
        console.log('🔍 Querying action_items table...');
        const actionItemsStartTime = Date.now();
        
        const actionItemsPromise = currentClient
          .from('action_items')
          .select('*')
          .order('created_at', { ascending: true });
        
        const actionItemsResult = await Promise.race([
          actionItemsPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Action items query timeout')), 6000)
          )
        ]);
        
        const actionItemsEndTime = Date.now();
        console.log('📊 Action items query completed in', actionItemsEndTime - actionItemsStartTime, 'ms');
        
        const { data: actionItems, error: actionItemsError } = actionItemsResult as any;
        console.log('📊 Action items result:', { 
          itemsCount: actionItems?.length || 0, 
          hasError: !!actionItemsError 
        });
        
        if (actionItemsError) {
          console.error('❌ Action items query failed:', actionItemsError);
          throw actionItemsError;
        }

        // Process data
        console.log('🔧 Processing data...');
        const actionItemsByPost: Record<string, ActionItem[]> = {};
        actionItems?.forEach((item: ActionItem) => {
          if (!actionItemsByPost[item.post_id]) {
            actionItemsByPost[item.post_id] = [];
          }
          actionItemsByPost[item.post_id].push(item);
        });

        const postsWithActionItems: BulletinPost[] = posts?.map((post: any) => ({
          ...post,
          actionItems: actionItemsByPost[post.id] || [],
        })) || [];

        // Success!
        clearTimeout(timeoutId);
        fetchingRef.current = false;
        initialLoadDoneRef.current = true;
        
        const totalTime = Date.now() - now;
        console.log('🎉 fetchPosts completed successfully in', totalTime, 'ms with', postsWithActionItems.length, 'posts');
        dispatch({ type: 'SET_POSTS', payload: postsWithActionItems });
        
      } catch (error) {
        clearTimeout(timeoutId);
        const totalTime = Date.now() - now;
        console.error('❌ fetchPosts attempt', retryCount + 1, 'failed after', totalTime, 'ms. Error:', error);
        
        if (retryCount < MAX_RETRIES) {
          console.log('🔄 Will retry in 1 second... (attempt', retryCount + 2, 'of', MAX_RETRIES + 1, ')');
          retryCount++;
          setTimeout(() => attemptFetch(), 1000);
        } else {
          fetchingRef.current = false;
          dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch posts after multiple attempts. Please refresh the page.' });
        }
      }
    };
    
    await attemptFetch();
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // TEMPORARILY DISABLED - Handle browser tab visibility changes 
  // useEffect(() => {
  //   let visibilityTimeout: NodeJS.Timeout;
  //   let lastVisibilityTime = 0;

  //   const handleVisibilityChange = () => {
  //     console.log('👁️ Tab visibility change handler DISABLED - not refreshing data');
  //   };

  //   document.addEventListener('visibilitychange', handleVisibilityChange);
    
  //   return () => {
  //     document.removeEventListener('visibilitychange', handleVisibilityChange);
  //     if (visibilityTimeout) {
  //       clearTimeout(visibilityTimeout);
  //     }
  //   };
  // }, [user, fetchPosts]);

  useEffect(() => {
    console.log('🔍 BulletinContext useEffect triggered:', {
      hasUser: !!user,
      userId: user?.id,
      isFetching: fetchingRef.current,
      initialLoadDone: initialLoadDoneRef.current,
      timestamp: new Date().toISOString()
    });
    
    if (user && !fetchingRef.current) {
      console.log('👤 User authenticated, calling fetchPosts');
      fetchPosts(true); // Force refresh on initial load or user change
    } else if (!user) {
      console.log('❌ No user, skipping fetchPosts and clearing data');
      // Reset state when no user
      fetchingRef.current = false;
      initialLoadDoneRef.current = false;
      lastFetchTimeRef.current = 0;
      dispatch({ type: 'SET_POSTS', payload: [] });
    } else {
      console.log('⚠️ User exists but fetchPosts skipped (already fetching)');
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
