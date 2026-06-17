-- members tablosuna team sütunu ekle
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS team text;
