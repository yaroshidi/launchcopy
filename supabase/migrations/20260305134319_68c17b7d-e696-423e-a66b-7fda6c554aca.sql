
-- Add soft-delete column
ALTER TABLE public.analyses ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Update SELECT policy to exclude soft-deleted by default
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.analyses;
CREATE POLICY "Users can view their own analyses"
ON public.analyses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create pg_cron extension if not exists
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule daily purge of items deleted > 1 day ago
SELECT cron.schedule(
  'purge-soft-deleted-analyses',
  '0 * * * *',
  $$DELETE FROM public.analyses WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '1 day'$$
);
