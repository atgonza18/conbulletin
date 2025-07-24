-- ========================================
-- COMPLETE SUPABASE SCHEMA SETUP - NO RLS
-- Construction Daily Bulletin App
-- ========================================
-- This script will completely wipe and recreate your schema
-- WARNING: This will delete ALL existing data!

-- Step 1: Drop all existing tables, functions, and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS handle_bulletin_posts_updated_at ON public.bulletin_posts;
DROP TRIGGER IF EXISTS handle_action_items_updated_at ON public.action_items;

DROP FUNCTION IF EXISTS public.get_available_assignees();
DROP FUNCTION IF EXISTS public.is_user_assigned_to_action_item(UUID, UUID);
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_updated_at();

DROP TABLE IF EXISTS public.action_items CASCADE;
DROP TABLE IF EXISTS public.bulletin_posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  scope TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- Step 4: Create bulletin_posts table
CREATE TABLE public.bulletin_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 5: Create action_items table with single assignee support
CREATE TABLE public.action_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.bulletin_posts(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 6: Create indexes for better performance
CREATE INDEX profiles_email_idx ON public.profiles(email);
CREATE INDEX profiles_username_idx ON public.profiles(username);
CREATE INDEX bulletin_posts_author_idx ON public.bulletin_posts(author_id);
CREATE INDEX bulletin_posts_created_at_idx ON public.bulletin_posts(created_at DESC);
CREATE INDEX action_items_post_idx ON public.action_items(post_id);
CREATE INDEX action_items_author_idx ON public.action_items(author_id);
CREATE INDEX action_items_assigned_to_idx ON public.action_items(assigned_to_id);
CREATE INDEX action_items_completed_idx ON public.action_items(completed);

-- Step 7: Create function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_bulletin_posts_updated_at
  BEFORE UPDATE ON public.bulletin_posts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_action_items_updated_at
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Step 9: Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role, scope, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Field Engineer'),
    COALESCE(NEW.raw_user_meta_data->>'scope', 'General'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 11: NO RLS - Full open access as requested
-- Tables are left without RLS enabled for full access
-- No RLS policies are created

-- Step 12: Grant permissions for authenticated users
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.bulletin_posts TO authenticated;
GRANT ALL ON public.action_items TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 13: Create a helper function to get all users (for assignee selection)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id UUID, full_name TEXT, email TEXT, role TEXT, scope TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.full_name, p.email, p.role, p.scope
    FROM public.profiles p
    ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;

-- Step 14: Add helpful comments
COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE public.bulletin_posts IS 'Daily bulletin posts with title and content';
COMMENT ON TABLE public.action_items IS 'Action items associated with bulletin posts';
COMMENT ON COLUMN public.action_items.assigned_to_id IS 'User ID of who this action item is assigned to';
COMMENT ON COLUMN public.action_items.assigned_to_name IS 'Display name of who this action item is assigned to';

-- ========================================
-- SETUP COMPLETE!
-- ========================================
-- Your app should now work fully with:
-- ✅ User authentication and profiles
-- ✅ Bulletin posts with authors
-- ✅ Action items with single assignee support
-- ✅ Automatic timestamp handling
-- ✅ NO RLS (full open access)
-- ✅ All necessary indexes for performance
-- ✅ Helper functions for user management

-- Test query to verify setup:
SELECT 'Schema setup complete!' as status; 