-- Migration: Add assignment tracking to action items
-- This adds assigned_to_id and assigned_to_name fields to track who action items are assigned to

-- Step 1: Add the new assignment columns (allow NULL initially)
ALTER TABLE public.action_items 
ADD COLUMN IF NOT EXISTS assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;

-- Step 2: Create index for the new assigned_to_id column
CREATE INDEX IF NOT EXISTS action_items_assigned_to_idx ON public.action_items(assigned_to_id);

-- Step 3: Update existing action items to assign them to their creators as default
-- This assigns existing action items to their authors as a reasonable default
UPDATE public.action_items 
SET 
  assigned_to_id = author_id,
  assigned_to_name = author_name
WHERE assigned_to_id IS NULL;

-- Step 4: Make assigned_to_name NOT NULL after updating existing data
-- Note: We keep assigned_to_id nullable to allow unassigned action items in the future
ALTER TABLE public.action_items 
ALTER COLUMN assigned_to_name SET NOT NULL;

-- Step 5: Update RLS policies to include assignment access
-- Allow users to read action items assigned to them
DROP POLICY IF EXISTS "Allow users to read assigned action items" ON public.action_items;
CREATE POLICY "Allow users to read assigned action items" ON public.action_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (auth.uid() = assigned_to_id OR auth.uid() = author_id)
    );

-- Allow users to update action items assigned to them or created by them
DROP POLICY IF EXISTS "Allow users to update own or assigned action items" ON public.action_items;
CREATE POLICY "Allow users to update own or assigned action items" ON public.action_items
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        (auth.uid() = assigned_to_id OR auth.uid() = author_id)
    );

-- Verification query (optional - run to check the migration worked)
-- SELECT 
--   ai.id,
--   ai.text,
--   ai.author_name as created_by,
--   ai.assigned_to_name as assigned_to,
--   ai.completed,
--   bp.title as post_title
-- FROM public.action_items ai
-- JOIN public.bulletin_posts bp ON ai.post_id = bp.id
-- ORDER BY ai.created_at DESC
-- LIMIT 10; 