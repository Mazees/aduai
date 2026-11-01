-- Token Fonnte disimpan di konfigurasi server; jangan buat policy baca publik.
alter table public.configuration add column if not exists whatsapp_api_token text;
revoke all on public.configuration from anon, authenticated;

-- Berkas berada di bucket privat; hanya lokasi objek dan catatan yang dibutuhkan.
alter table public.evidence add column if not exists note text;
alter table public.evidence add column if not exists storage_path text;

-- Skema terdahulu mewajibkan metadata tambahan. Jadikan opsional tanpa
-- menghapus kolom atau data agar deployment lama tetap kompatibel.
do $$
declare v_column_name text;
begin
  foreach v_column_name in array array['file_name', 'mime_type', 'size_bytes'] loop
    if exists (select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = 'evidence' and c.column_name = v_column_name) then
      execute format('alter table public.evidence alter column %I drop not null', v_column_name);
    end if;
  end loop;
end $$;

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do update set public = false;
