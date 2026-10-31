-- Migration 001: Initial Schema for AduAI
-- Berdasarkan PRD AduAI & Revisi Integrasi Supabase Auth

-- 1. Setup Ekstensi
create schema if not exists extensions;
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists vector with schema extensions;

set search_path = public, extensions;

-- 2. Tabel Complaints (Aduan)
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique not null, -- Nomor tiket 6 digit unik untuk pelacakan
  reporter_whatsapp text not null, -- Nomor WhatsApp disimpan privat, tidak boleh dikembalikan ke API admin
  description text not null,
  category text,
  ai_summary text not null,
  status text not null default 'NEW'
    check (status in ('NEW', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_complaints_ticket_number on public.complaints (ticket_number);
create index if not exists idx_complaints_status on public.complaints (status);
create index if not exists idx_complaints_created_at on public.complaints (created_at desc);

-- 3. Tabel Complaint Updates (Perubahan Status oleh Admin)
-- admin_id merujuk ke tabel bawaan Supabase: auth.users(id)
create table if not exists public.complaint_updates (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  admin_id uuid references auth.users(id) on delete set null,
  status text not null
    check (status in ('NEW', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
  note text,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_complaint_updates_complaint_id on public.complaint_updates (complaint_id);

-- 4. Tabel Update Evidence (Bukti Unggahan Perubahan Status)
create table if not exists public.update_evidence (
  id uuid primary key default gen_random_uuid(),
  complaint_update_id uuid not null references public.complaint_updates(id) on delete cascade,
  storage_key text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_update_evidence_update_id on public.update_evidence (complaint_update_id);

-- 5. Tabel Notifications (Antrean & Log Pengiriman Notifikasi WhatsApp)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  complaint_update_id uuid not null unique references public.complaint_updates(id) on delete cascade,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'SENT', 'FAILED')),
  attempt_count int not null default 0,
  provider_message_id text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists idx_notifications_status on public.notifications (status);

-- 6. Tabel AI Evaluations (Hasil Evaluasi Percakapan & Aduan)
create table if not exists public.ai_evaluations (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null unique references public.complaints(id) on delete cascade,
  summary text not null,
  has_new_learning boolean not null default false,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  lock_token text,
  locked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_evaluations_status on public.ai_evaluations (status);

-- 7. Tabel Persona Prompts (Hasil Pembelajaran Self-Learning Aktif)
create table if not exists public.persona_prompts (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid references public.ai_evaluations(id) on delete cascade,
  type text not null
    check (type in ('POSITIVE', 'NEGATIVE')),
  content text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_persona_prompts_active on public.persona_prompts (is_active);

-- 8. Tabel AI Provider Settings (Konfigurasi Provider & Main Knowledge)
create table if not exists public.ai_provider_settings (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  model text not null,
  api_key_ciphertext text not null,
  main_knowledge text default '',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- 9. Tabel Idempotency Keys (Mencegah Duplikasi Submit)
create table if not exists public.idempotency_keys (
  key text primary key,
  operation text not null,
  request_hash text not null,
  response_data jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_idempotency_keys_expires_at on public.idempotency_keys (expires_at);

-- 10. Tabel Knowledge Base & Dokumen Resmi (Pencarian Vektor)
create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  content text not null,
  embedding extensions.vector(384) not null,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_chunks_document_id_idx
  on public.knowledge_chunks (document_id);

create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using hnsw (embedding extensions.vector_cosine_ops);

-- Fungsi Pencarian Vektor Knowledge
create or replace function public.match_knowledge(
  query_embedding extensions.vector(384),
  match_threshold double precision default 0.35,
  match_count integer default 3
)
returns table (
  chunk_id uuid,
  document_id uuid,
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
  select kc.id as chunk_id,
         kd.id as document_id,
         kd.title,
         kc.content,
         kd.source_url,
         1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks as kc
  join public.knowledge_documents as kd on kd.id = kc.document_id
  where kd.status = 'published'
    and 1 - (kc.embedding <=> query_embedding) >= match_threshold
  order by kc.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 5);
$$;

-- 11. Keamanan RLS (Row Level Security)
-- Seluruh akses data melalui server/backend Next.js menggunakan Service Role Key
alter table public.complaints enable row level security;
alter table public.complaint_updates enable row level security;
alter table public.update_evidence enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_evaluations enable row level security;
alter table public.persona_prompts enable row level security;
alter table public.ai_provider_settings enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

-- Cabut akses publik langsung ke tabel
revoke all on public.complaints from anon, authenticated;
revoke all on public.complaint_updates from anon, authenticated;
revoke all on public.update_evidence from anon, authenticated;
revoke all on public.notifications from anon, authenticated;
revoke all on public.ai_evaluations from anon, authenticated;
revoke all on public.persona_prompts from anon, authenticated;
revoke all on public.ai_provider_settings from anon, authenticated;
revoke all on public.idempotency_keys from anon, authenticated;
revoke all on public.knowledge_documents from anon, authenticated;
revoke all on public.knowledge_chunks from anon, authenticated;

-- Berikan hak akses penuh kepada service_role
grant all on all tables in schema public to service_role;
grant execute on function public.match_knowledge(extensions.vector, double precision, integer) to service_role;
