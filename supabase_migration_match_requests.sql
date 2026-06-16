-- match_requests tablosuna member_id ve event_date sütunları ekle
ALTER TABLE public.match_requests
  ADD COLUMN IF NOT EXISTS member_id uuid,
  ADD COLUMN IF NOT EXISTS event_date date;

-- Tekrar başvuru engeli: aynı üye aynı etkinliğe bir defa başvurabilir
ALTER TABLE public.match_requests
  DROP CONSTRAINT IF EXISTS unique_member_event;

ALTER TABLE public.match_requests
  ADD CONSTRAINT unique_member_event UNIQUE (member_id, event_id);
