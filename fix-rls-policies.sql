-- Fix Row Level Security Policies
-- The tables have RLS enabled but no policies, which blocks all access

-- Allow authenticated users to read all bulletin posts
CREATE POLICY "Allow authenticated users to read bulletin posts" ON public.bulletin_posts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert their own bulletin posts
CREATE POLICY "Allow authenticated users to insert bulletin posts" ON public.bulletin_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);

-- Allow users to update their own bulletin posts
CREATE POLICY "Allow users to update their own bulletin posts" ON public.bulletin_posts
    FOR UPDATE USING (auth.role() = 'authenticated' AND auth.uid() = author_id);

-- Allow users to delete their own bulletin posts
CREATE POLICY "Allow users to delete their own bulletin posts" ON public.bulletin_posts
    FOR DELETE USING (auth.role() = 'authenticated' AND auth.uid() = author_id);

-- Allow authenticated users to read all action items
CREATE POLICY "Allow authenticated users to read action items" ON public.action_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert action items
CREATE POLICY "Allow authenticated users to insert action items" ON public.action_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);

-- Allow users to update their own action items
CREATE POLICY "Allow users to update their own action items" ON public.action_items
    FOR UPDATE USING (auth.role() = 'authenticated' AND auth.uid() = author_id);

-- Allow users to delete their own action items
CREATE POLICY "Allow users to delete their own action items" ON public.action_items
    FOR DELETE USING (auth.role() = 'authenticated' AND auth.uid() = author_id);

-- Allow authenticated users to read all profiles
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated' AND auth.uid() = id); 