-- members tablosuna avatar_url sütunu ekle
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- avatars bucket oluştur (Supabase Dashboard > Storage > New Bucket ile de yapılabilir)
-- Bucket adı: avatars, Public: true
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Herkes kendi avatarını yükleyebilsin
CREATE POLICY "avatar_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Herkes avatarları görebilsin
CREATE POLICY "avatar_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Üyeler kendi avatarlarını güncelleyebilsin (upsert)
CREATE POLICY "avatar_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars');
