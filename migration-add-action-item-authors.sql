-- Migration: Add author tracking to action items
-- Run this if you have existing data and need to add the author fields

-- Step 1: Add the new columns (allow NULL initially)
ALTER TABLE public.action_items 
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Step 2: Create index for the new author_id column
CREATE INDEX IF NOT EXISTS action_items_author_idx ON public.action_items(author_id);

-- Step 3: Update existing action items to set author from the post author
-- This assigns existing action items to the post author as a reasonable default
UPDATE public.action_items 
SET 
  author_id = bp.author_id,
  author_name = bp.author_name
FROM public.bulletin_posts bp
WHERE public.action_items.post_id = bp.id
  AND public.action_items.author_id IS NULL;

-- Step 4: Make the columns NOT NULL after updating existing data
ALTER TABLE public.action_items 
ALTER COLUMN author_id SET NOT NULL,
ALTER COLUMN author_name SET NOT NULL;

-- Verification query (optional - run to check the migration worked)
-- SELECT 
--   ai.id,
--   ai.text,
--   ai.author_name,
--   ai.created_at,
--   bp.title as post_title
-- FROM public.action_items ai
-- JOIN public.bulletin_posts bp ON ai.post_id = bp.id
-- ORDER BY ai.created_at DESC
-- LIMIT 10; 