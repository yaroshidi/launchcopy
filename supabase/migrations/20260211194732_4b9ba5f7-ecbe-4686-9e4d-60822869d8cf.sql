
-- Item 1: Add permissive INSERT policy on analyses
CREATE POLICY "Users can insert own analyses (permissive)"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Item 2: Add permissive UPDATE policy on analyses  
CREATE POLICY "Users can update own analyses"
  ON public.analyses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
