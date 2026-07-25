-- Üye profilindeki isteğe bağlı doğum tarihi ve meslek alanları
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS occupation text;

-- PostgREST şema önbelleğini hemen yenile
NOTIFY pgrst, 'reload schema';
