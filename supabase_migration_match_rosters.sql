-- Yayınlanabilir ve sonradan düzenlenebilir maç kadroları
CREATE TABLE IF NOT EXISTS public.match_rosters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL UNIQUE,
  event_title text NOT NULL,
  event_date date,
  team_a jsonb NOT NULL DEFAULT '[]'::jsonb,
  team_b jsonb NOT NULL DEFAULT '[]'::jsonb,
  reserves jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.match_rosters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_match_rosters" ON public.match_rosters;
CREATE POLICY "public_read_match_rosters" ON public.match_rosters
  FOR SELECT USING (published = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin_all_match_rosters" ON public.match_rosters;
CREATE POLICY "admin_all_match_rosters" ON public.match_rosters
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.match_rosters;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
