-- Migration 002: Revisi Auth ke Supabase Auth (auth.users) & Penyederhanaan Tiket 6 Digit
-- Menghapus public.admins dan kolom access_code_hash sesuai revisi arsitektur

-- 1. Hapus Foreign Key lama yang merujuk ke public.admins
alter table public.complaint_updates
  drop constraint if exists complaint_updates_admin_id_fkey;

alter table public.ai_provider_settings
  drop constraint if exists ai_provider_settings_updated_by_fkey;

-- 2. Hapus tabel public.admins
drop table if exists public.admins cascade;

-- 3. Sambungkan relasi admin ke auth.users bawaan Supabase
alter table public.complaint_updates
  alter column admin_id drop not null;

alter table public.complaint_updates
  add constraint complaint_updates_admin_id_fkey
  foreign key (admin_id) references auth.users(id) on delete set null;

alter table public.ai_provider_settings
  add constraint ai_provider_settings_updated_by_fkey
  foreign key (updated_by) references auth.users(id) on delete set null;

-- 4. Hapus kolom access_code_hash dari tabel complaints
alter table public.complaints
  drop column if exists access_code_hash;
