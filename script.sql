create table analyses (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null,
  file_url    text        not null,
  file_name   text        not null,
  entity_name text,
  entity_rut  text,
  status      text        not null default 'pending',
  result      jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger analyses_updated_at
  before update on analyses
  for each row execute function set_updated_at();


grant all on public.analyses to service_role;
grant all on public.analyses to anon;