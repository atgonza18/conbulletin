-- Revert Multiple Assignees Feature - SQL Script
-- This script removes all multiple assignee functionality and reverts to the stable single assignee system
-- Run this in your Supabase SQL Editor to revert the database changes

-- Step 1: Drop the helper functions created for multiple assignees
DROP FUNCTION IF EXISTS public.get_available_assignees();
DROP FUNCTION IF EXISTS public.is_user_assigned_to_action_item(UUID, UUID);

-- Step 2: Drop the RLS policies for multiple assignees
DROP POLICY IF EXISTS "Allow users to read multiple assigned action items" ON public.action_items;
DROP POLICY IF EXISTS "Allow users to update multiple assigned action items" ON public.action_items;

-- Step 3: Recreate the original RLS policies for single assignee system
-- Allow users to read action items assigned to them or created by them
CREATE POLICY "Allow users to read assigned action items" ON public.action_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (auth.uid() = assigned_to_id OR auth.uid() = author_id)
    );

-- Allow users to update action items assigned to them or created by them
CREATE POLICY "Allow users to update own or assigned action items" ON public.action_items
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        (auth.uid() = assigned_to_id OR auth.uid() = author_id)
    );

-- Step 4: Drop the indexes for multiple assignee columns
DROP INDEX IF EXISTS action_items_assigned_to_ids_idx;

-- Step 5: Remove the multiple assignee columns
ALTER TABLE public.action_items 
DROP COLUMN IF EXISTS assigned_to_ids,
DROP COLUMN IF EXISTS assigned_to_names;

-- Step 6: Ensure assigned_to_name is NOT NULL (as it was before)
-- First, fix any NULL values by setting them to a default
UPDATE public.action_items 
SET assigned_to_name = author_name
WHERE assigned_to_name IS NULL;

-- Then set the constraint
ALTER TABLE public.action_items 
ALTER COLUMN assigned_to_name SET NOT NULL;

-- Verification query (optional - run to check the reversion worked)
-- This should show the current structure with only single assignee fields
SELECT 
  ai.id,
  ai.text,
  ai.author_name as created_by,
  ai.assigned_to_name as assigned_to,
  ai.completed,
  bp.title as post_title
FROM public.action_items ai
JOIN public.bulletin_posts bp ON ai.post_id = bp.id
ORDER BY ai.created_at DESC
LIMIT 10; 