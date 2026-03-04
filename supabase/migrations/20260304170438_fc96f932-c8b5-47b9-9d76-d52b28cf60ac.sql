CREATE TABLE public.scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scanned_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own scan logs"
ON public.scan_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own scan logs"
ON public.scan_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_scan_logs_user_date ON public.scan_logs (user_id, scanned_at);