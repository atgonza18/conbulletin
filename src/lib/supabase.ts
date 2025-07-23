import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Validate environment variables
if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.error('🚨 CRITICAL: NEXT_PUBLIC_SUPABASE_URL is not set! Auth will fail.')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL in your Vercel environment variables')
}

if (supabaseAnonKey === 'placeholder-key') {
  console.error('🚨 CRITICAL: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set! Auth will fail.')
  console.error('Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel environment variables')
}

console.log('🔧 Supabase Config:', {
  url: supabaseUrl === 'https://placeholder.supabase.co' ? '❌ PLACEHOLDER' : '✅ SET',
  key: supabaseAnonKey === 'placeholder-key' ? '❌ PLACEHOLDER' : '✅ SET',
  actualUrl: supabaseUrl.substring(0, 30) + '...'
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'construction-bulletin'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Types for our database tables
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          role: string
          scope: string
          full_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          role: string
          scope: string
          full_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          role?: string
          scope?: string
          full_name?: string
          updated_at?: string
        }
      }
      bulletin_posts: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string
          author_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id: string
          author_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string
          author_name?: string
          updated_at?: string
        }
      }
      action_items: {
        Row: {
          id: string
          post_id: string
          text: string
          completed: boolean
          author_id: string
          author_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          text: string
          completed?: boolean
          author_id: string
          author_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          text?: string
          completed?: boolean
          author_id?: string
          author_name?: string
          updated_at?: string
        }
      }
    }
  }
} 