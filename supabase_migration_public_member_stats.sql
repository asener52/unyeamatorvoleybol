-- Üye performansının halka açık paylaşım tercihi
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS stats_published boolean NOT NULL DEFAULT false;

-- Yalnızca güvenli, toplulaştırılmış alanları dışarı açan görünüm
CREATE OR REPLACE VIEW public.public_member_stats AS
SELECT
  m.id,
  m.name,
  COUNT(r.id)::integer AS total,
  COUNT(r.id) FILTER (WHERE r.status = 'as_kadro')::integer AS as_kadro,
  COUNT(r.id) FILTER (WHERE r.status = 'yedek_kadro')::integer AS yedek_kadro,
  COUNT(r.id) FILTER (WHERE r.status = 'bekliyor')::integer AS bekliyor,
  CASE
    WHEN COUNT(r.id) FILTER (WHERE r.status IN ('as_kadro', 'yedek_kadro', 'bekliyor', 'reddedildi')) = 0 THEN 0
    ELSE ROUND(
      100.0 * COUNT(r.id) FILTER (WHERE r.status IN ('as_kadro', 'yedek_kadro'))
      / COUNT(r.id) FILTER (WHERE r.status IN ('as_kadro', 'yedek_kadro', 'bekliyor', 'reddedildi'))
    )::integer
  END AS attendance_rate
FROM public.members m
LEFT JOIN public.match_requests r ON r.member_id = m.id
WHERE m.stats_published = true
GROUP BY m.id, m.name;

GRANT SELECT ON public.public_member_stats TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
