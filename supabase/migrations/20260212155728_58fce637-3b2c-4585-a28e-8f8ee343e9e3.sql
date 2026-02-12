
-- Add github_token column to profiles (encrypted at rest by Supabase)
ALTER TABLE public.profiles ADD COLUMN github_token TEXT DEFAULT NULL;

-- Only the owner can read/update their own token
-- (existing RLS policies already restrict by auth.uid() = id)
