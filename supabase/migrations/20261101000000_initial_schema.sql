-- ============================================================================
-- Migrasi Awal AduAI: 5 Tabel Aplikasi
-- 1. configuration
-- 2. complaint
-- 3. knowledge
-- 4. ai_evaluation
-- 5. evidence
-- Catatan: Supabase Auth (auth.users) dan Supabase Storage (storage.buckets)
-- digunakan langsung tanpa membuat tabel aplikasi tambahan.
-- ============================================================================

-- 1. Ekstensi pgvector
create schema if not exists extensions;
create extension if not exists vector with schema extensions;
set search_path = public, extensions;

-- ============================================================================
-- TABEL 1: configuration
-- Menyimpan pengaturan provider AI dan Main Knowledge (maksimal 3.000 karakter).
-- Istilah "persona" di sini merujuk pada Main Knowledge.
-- Positive dan negative prompt disimpan di ai_evaluation, bukan di sini.
-- ============================================================================
create table if not exists public.configuration (
  id text primary key default 'default' check (id = 'default'),
  ai_endpoint text,
  ai_model text,
  ai_api_key_ciphertext text,
  main_knowledge text check (main_knowledge is null or length(main_knowledge) <= 3000),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- Baris singleton default
insert into public.configuration (id, main_knowledge)
values ('default', '')
on conflict (id) do nothing;

-- ============================================================================
-- TABEL 2: complaint
-- Menyimpan laporan aduan warga, status terkini, dan nomor tiket.
-- Nomor WhatsApp tersimpan aman dan tidak pernah dikembalikan ke respons admin.
-- Pelacakan status oleh warga cukup menggunakan ticket_number (tanpa access_code_hash).
-- ============================================================================
create table if not exists public.complaint (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  idempotency_key uuid unique,
  request_hash text,
  reporter_whatsapp text not null,
  description text not null,
  category text,
  ai_summary text not null,
  status text not null default 'NEW' check (status in ('NEW', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists complaint_ticket_number_idx on public.complaint (ticket_number);
create index if not exists complaint_status_idx on public.complaint (status);
create index if not exists complaint_created_at_idx on public.complaint (created_at desc);

-- ============================================================================
-- TABEL 3: knowledge
-- Menyimpan potongan pengetahuan FAQ/instansi beserta vektor 384 dimensi
-- dalam satu tabel tunggal (tanpa tabel documents terpisah dan tanpa kolom embedding_model).
-- ============================================================================
create table if not exists public.knowledge (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  source_url text,
  status text not null default 'published' check (status in ('draft', 'published')),
  embedding extensions.vector(384) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_status_idx on public.knowledge (status);
create index if not exists knowledge_embedding_idx on public.knowledge using hnsw (embedding extensions.vector_cosine_ops);

-- Fungsi pencarian kemiripan kosinus
create or replace function public.match_knowledge(
  query_embedding extensions.vector(384),
  match_threshold double precision default 0.35,
  match_count integer default 3
)
returns table (
  id uuid,
  title text,
  content text,
  source_url text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select k.id,
         k.title,
         k.content,
         k.source_url,
         1 - (k.embedding <=> query_embedding) as similarity
  from public.knowledge as k
  where k.status = 'published'
    and 1 - (k.embedding <=> query_embedding) >= match_threshold
  order by k.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 5);
$$;

-- ============================================================================
-- TABEL 4: ai_evaluation
-- Memiliki satu baris per aduan (complaint_id unik).
-- Menyimpan status evaluasi dan daftar positive/negative prompt hasil pembelajaran.
-- Hasil yang berhasil langsung dipakai pada percakapan berikutnya tanpa persetujuan admin.
-- ============================================================================
create table if not exists public.ai_evaluation (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null unique references public.complaint(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED')),
  summary text,
  has_new_learning boolean not null default false,
  positive_prompts jsonb not null default '[]'::jsonb,
  negative_prompts jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_evaluation_complaint_id_idx on public.ai_evaluation (complaint_id);
create index if not exists ai_evaluation_status_idx on public.ai_evaluation (status);

-- ============================================================================
-- TABEL 5: evidence
-- Menyimpan SATU bukti wajib untuk setiap perubahan status admin, beserta status baru,
-- catatan, dan waktu. Berkas berada di bucket privat Supabase Storage ('evidence').
-- Baris-baris pada tabel ini sekaligus menjadi sumber riwayat status aduan.
-- Tidak ada tabel complaint_updates atau notifications terpisah.
-- ============================================================================
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaint(id) on delete cascade,
  status text not null check (status in ('ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists evidence_complaint_id_idx on public.evidence (complaint_id);
create index if not exists evidence_created_at_idx on public.evidence (created_at asc);

-- ============================================================================
-- SUPABASE STORAGE BUCKETS
-- Bucket privat untuk bukti dan sesi WhatsApp (Baileys)
-- ============================================================================
insert into storage.buckets (id, name, public)
values 
  ('evidence', 'evidence', false),
  ('whatsapp-session', 'whatsapp-session', false)
on conflict (id) do nothing;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Akses aplikasi dilakukan melalui server (Next.js Route Handlers) menggunakan
-- service_role key atau sesi terautentikasi (auth.users).
-- ============================================================================
alter table public.configuration enable row level security;
alter table public.complaint enable row level security;
alter table public.knowledge enable row level security;
alter table public.ai_evaluation enable row level security;
alter table public.evidence enable row level security;

-- Cabut akses anon langsung dari browser untuk melindungi privasi WhatsApp dan konfigurasi
revoke all on public.configuration from anon, authenticated;
revoke all on public.complaint from anon, authenticated;
revoke all on public.knowledge from anon, authenticated;
revoke all on public.ai_evaluation from anon, authenticated;
revoke all on public.evidence from anon, authenticated;

-- Berikan izin eksekusi match_knowledge ke service_role
revoke execute on function public.match_knowledge(extensions.vector, double precision, integer)
  from public, anon, authenticated;
grant execute on function public.match_knowledge(extensions.vector, double precision, integer)
  to service_role;

