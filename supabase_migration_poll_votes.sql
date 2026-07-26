-- Kimlikli anket oyları
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id bigint NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  member_name text NOT NULL,
  option_id text NOT NULL,
  option_label text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (poll_id, member_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_poll_votes" ON public.poll_votes;
CREATE POLICY "admin_read_poll_votes" ON public.poll_votes
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin_delete_poll_votes" ON public.poll_votes;
CREATE POLICY "admin_delete_poll_votes" ON public.poll_votes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Oy kaydı ve toplam sayacı aynı transaction içinde güncellenir.
CREATE OR REPLACE FUNCTION public.cast_poll_vote(
  p_poll_id bigint,
  p_member_id uuid,
  p_option_id text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_member_name text;
  v_option_label text;
BEGIN
  SELECT name INTO v_member_name
  FROM public.members
  WHERE id = p_member_id AND status = 'approved';
  IF v_member_name IS NULL THEN RAISE EXCEPTION 'Üye bulunamadı'; END IF;

  SELECT option_item->>'label' INTO v_option_label
  FROM public.polls AS poll,
       jsonb_array_elements(poll.options) AS option_item
  WHERE poll.id = p_poll_id
    AND poll.published = true
    AND option_item->>'id' = p_option_id;
  IF v_option_label IS NULL THEN RAISE EXCEPTION 'Anket seçeneği bulunamadı'; END IF;

  INSERT INTO public.poll_votes (poll_id, member_id, member_name, option_id, option_label)
  VALUES (p_poll_id, p_member_id, v_member_name, p_option_id, v_option_label);

  UPDATE public.polls
  SET votes = jsonb_set(
    COALESCE(votes, '{}'::jsonb),
    ARRAY[p_option_id],
    to_jsonb(COALESCE((votes->>p_option_id)::integer, 0) + 1),
    true
  )
  WHERE id = p_poll_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.cast_poll_vote(bigint, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cast_poll_vote(bigint, uuid, text) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
