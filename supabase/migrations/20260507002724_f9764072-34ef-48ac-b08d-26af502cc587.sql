-- Tambah kolom login_code untuk login dengan kode tunggal
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS login_code text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_login_code ON public.profiles(login_code);