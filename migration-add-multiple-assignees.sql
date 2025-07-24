-- Migration: Add multiple assignee support to action items
-- This adds assigned_to_ids and assigned_to_names arrays to support multiple assignees per action item

-- Step 1: Add the new multiple assignee columns (arrays)
ALTER TABLE public.action_items 
ADD COLUMN IF NOT EXISTS assigned_to_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS assigned_to_names TEXT[] DEFAULT '{}';

-- Step 2: Create indexes for the new array columns for efficient querying
CREATE INDEX IF NOT EXISTS action_items_assigned_to_ids_idx ON public.action_items USING GIN(assigned_to_ids);

-- Step 3: Migrate existing single assignee data to array format
-- Convert existing single assignees to arrays (only where arrays are empty)
UPDATE public.action_items 
SET 
  assigned_to_ids = CASE 
    WHEN assigned_to_id IS NOT NULL THEN ARRAY[assigned_to_id]
    ELSE '{}'
  END,
  assigned_to_names = CASE 
    WHEN assigned_to_name IS NOT NULL THEN ARRAY[assigned_to_name]
    ELSE '{}'
  END
WHERE assigned_to_ids = '{}' AND assigned_to_names = '{}';

-- Step 4: Update RLS policies to work with multiple assignees
-- Allow users to read action items where they are one of the assignees
DROP POLICY IF EXISTS "Allow users to read multiple assigned action items" ON public.action_items;
CREATE POLICY "Allow users to read multiple assigned action items" ON public.action_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (auth.uid() = ANY(assigned_to_ids) OR auth.uid() = author_id OR auth.uid() = assigned_to_id)
    );

-- Allow users to update action items where they are one of the assignees or the author
DROP POLICY IF EXISTS "Allow users to update multiple assigned action items" ON public.action_items;
CREATE POLICY "Allow users to update multiple assigned action items" ON public.action_items
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        (auth.uid() = ANY(assigned_to_ids) OR auth.uid() = author_id OR auth.uid() = assigned_to_id)
    );

-- Step 5: Create a helper function to check if a user is assigned to an action item
CREATE OR REPLACE FUNCTION public.is_user_assigned_to_action_item(action_item_id UUID, user_id UUID)
RETURNS BOOLEAN AS 
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.action_items 
        WHERE id = action_item_id 
        AND (
            user_id = ANY(assigned_to_ids) OR 
            user_id = author_id OR 
            user_id = assigned_to_id
        )
    );
END;
 LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create a function to get all profiles for user selection
CREATE OR REPLACE FUNCTION public.get_available_assignees()
RETURNS TABLE(id UUID, full_name TEXT, email TEXT) AS 
BEGIN
    RETURN QUERY
    SELECT p.id, p.full_name, p.email
    FROM public.profiles p
    WHERE p.full_name IS NOT NULL
    ORDER BY p.full_name;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the helper functions
GRANT EXECUTE ON FUNCTION public.is_user_assigned_to_action_item(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_assignees() TO authenticated;

-- Step 7: Add comments for documentation
COMMENT ON COLUMN public.action_items.assigned_to_ids IS 'Array of user IDs assigned to this action item';
COMMENT ON COLUMN public.action_items.assigned_to_names IS 'Array of user names assigned to this action item (for display)';
COMMENT ON FUNCTION public.is_user_assigned_to_action_item(UUID, UUID) IS 'Check if a user is assigned to an action item (including author and legacy single assignee)';
COMMENT ON FUNCTION public.get_available_assignees() IS 'Get all available users that can be assigned to action items';

-- Note: We keep the old assigned_to_id and assigned_to_name columns for backward compatibility
-- They can be removed in a future migration once we are confident the new system works well
