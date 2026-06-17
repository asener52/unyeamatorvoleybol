-- members tablosuna admin_note sütunu ekle (sadece admin görebilir)
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS admin_note text;
