-- Hábitos + Finanzas: un documento JSON por usuario y por app.
-- Reversible: ver 001_app_state.down.sql. No toca ninguna otra tabla.
create table if not exists public.app_state (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  app        text        not null check (app in ('finanzas', 'habitos')),
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, app)
);

alter table public.app_state enable row level security;

create policy "app_state: leer lo propio"    on public.app_state for select using (user_id = auth.uid());
create policy "app_state: crear lo propio"   on public.app_state for insert with check (user_id = auth.uid());
create policy "app_state: editar lo propio"  on public.app_state for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "app_state: borrar lo propio"  on public.app_state for delete using (user_id = auth.uid());
