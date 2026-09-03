-- Xuanji's Blog dynamic administration schema.
-- Run this file once in the Supabase SQL editor before enabling the production admin.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
	user_id uuid primary key references auth.users(id) on delete cascade,
	email text not null unique,
	created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_blog_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1 from public.admin_users where user_id = auth.uid()
	);
$$;

revoke all on function public.is_blog_admin() from public;
grant execute on function public.is_blog_admin() to authenticated;

create policy "admins can read their membership"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

create table if not exists public.content_entries (
	id uuid primary key default gen_random_uuid(),
	kind text not null check (kind in ('technical', 'study', 'diary')),
	title text not null,
	slug text not null unique,
	summary text not null default '',
	body text not null default '',
	cover_url text,
	category text not null default '',
	tags text[] not null default '{}',
	status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
	pinned boolean not null default false,
	published_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	created_by uuid references auth.users(id) on delete set null,
	updated_by uuid references auth.users(id) on delete set null
);

create index if not exists content_entries_status_published_idx
	on public.content_entries (status, published_at desc);
create index if not exists content_entries_kind_idx
	on public.content_entries (kind, updated_at desc);

create table if not exists public.content_revisions (
	id bigint generated always as identity primary key,
	entry_id uuid not null references public.content_entries(id) on delete cascade,
	snapshot jsonb not null,
	created_at timestamptz not null default now(),
	created_by uuid references auth.users(id) on delete set null
);

create index if not exists content_revisions_entry_idx
	on public.content_revisions (entry_id, created_at desc);

create table if not exists public.site_settings (
	key text primary key,
	draft_value jsonb not null default '{}'::jsonb,
	published_value jsonb not null default '{}'::jsonb,
	default_value jsonb not null default '{}'::jsonb,
	version integer not null default 1,
	updated_at timestamptz not null default now(),
	updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.managed_items (
	id uuid primary key default gen_random_uuid(),
	kind text not null check (kind in ('project', 'announcement', 'anime')),
	title text not null,
	data jsonb not null default '{}'::jsonb,
	status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
	sort_order integer not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	created_by uuid references auth.users(id) on delete set null,
	updated_by uuid references auth.users(id) on delete set null
);

create index if not exists managed_items_kind_status_idx
	on public.managed_items (kind, status, sort_order, updated_at desc);

create table if not exists public.media_assets (
	id uuid primary key default gen_random_uuid(),
	storage_path text not null unique,
	public_url text not null,
	file_name text not null,
	content_type text not null,
	file_size bigint not null default 0,
	alt_text text not null default '',
	created_at timestamptz not null default now(),
	created_by uuid references auth.users(id) on delete set null
);

alter table public.content_entries enable row level security;
alter table public.content_revisions enable row level security;
alter table public.site_settings enable row level security;
alter table public.managed_items enable row level security;
alter table public.media_assets enable row level security;

create policy "public can read published content"
on public.content_entries for select
to anon, authenticated
using (status = 'published' or public.is_blog_admin());

create policy "admins manage content"
on public.content_entries for all
to authenticated
using (public.is_blog_admin())
with check (public.is_blog_admin());

create policy "admins manage content revisions"
on public.content_revisions for all
to authenticated
using (public.is_blog_admin())
with check (public.is_blog_admin());

create policy "admins manage site settings"
on public.site_settings for all
to authenticated
using (public.is_blog_admin())
with check (public.is_blog_admin());

-- Public visitors must only receive the published copy. Keeping this behind a
-- narrowly shaped function prevents saved drafts from being exposed through
-- the REST API.
create or replace function public.get_published_site_settings()
returns table (key text, value jsonb)
language sql
stable
security definer
set search_path = public
as $$
	select site_settings.key, site_settings.published_value
	from public.site_settings;
$$;

revoke all on function public.get_published_site_settings() from public;
grant execute on function public.get_published_site_settings() to anon, authenticated;

create policy "public can read published managed items"
on public.managed_items for select
to anon, authenticated
using (status = 'published' or public.is_blog_admin());

create policy "admins manage structured items"
on public.managed_items for all
to authenticated
using (public.is_blog_admin())
with check (public.is_blog_admin());

create policy "public can read media metadata"
on public.media_assets for select
to anon, authenticated
using (true);

create policy "admins manage media metadata"
on public.media_assets for all
to authenticated
using (public.is_blog_admin())
with check (public.is_blog_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'blog-media',
	'blog-media',
	true,
	10485760,
	array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

create policy "public can view blog media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'blog-media');

create policy "admins upload blog media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'blog-media' and public.is_blog_admin());

create policy "admins update blog media"
on storage.objects for update
to authenticated
using (bucket_id = 'blog-media' and public.is_blog_admin())
with check (bucket_id = 'blog-media' and public.is_blog_admin());

create policy "admins delete blog media"
on storage.objects for delete
to authenticated
using (bucket_id = 'blog-media' and public.is_blog_admin());
