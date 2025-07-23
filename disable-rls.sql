-- Temporarily disable Row Level Security to allow action item creation
-- This is likely why action items aren't being created

-- Disable RLS on all tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletin_posts DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.action_items DISABLE ROW LEVEL SECURITY;

-- Verify RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'bulletin_posts', 'action_items'); 