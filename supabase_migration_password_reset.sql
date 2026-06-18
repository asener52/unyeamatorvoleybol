-- Şifre sıfırlama için members tablosuna alan ekle
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS reset_token text,
  ADD COLUMN IF NOT EXISTS reset_token_expires_at timestamptz;
