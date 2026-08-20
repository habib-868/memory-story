alter table public.journals
  add column start_date date,
  add column end_date date,
  add column status text not null default 'active';

alter table public.journals
  add constraint journals_status_check
  check (status in ('active', 'completed'));