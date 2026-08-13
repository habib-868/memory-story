create table public.journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journals enable row level security;

create policy "Users can view their own journals"
on public.journals
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can create their own journals"
on public.journals
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own journals"
on public.journals
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own journals"
on public.journals
for delete
to authenticated
using (user_id = auth.uid());


create table public.journal_days (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.journals(id) on delete cascade,
  day_number integer not null,
  created_at timestamptz not null default now(),

  constraint journal_days_day_number_check
    check (day_number between 1 and 7),

  constraint journal_days_unique_day
    unique (journal_id, day_number)
);

alter table public.journal_days enable row level security;

create policy "Users can view their own journal days"
on public.journal_days
for select
to authenticated
using (
  exists (
    select 1
    from public.journals
    where journals.id = journal_days.journal_id
      and journals.user_id = auth.uid()
  )
);

create policy "Users can create their own journal days"
on public.journal_days
for insert
to authenticated
with check (
  exists (
    select 1
    from public.journals
    where journals.id = journal_days.journal_id
      and journals.user_id = auth.uid()
  )
);

create policy "Users can update their own journal days"
on public.journal_days
for update
to authenticated
using (
  exists (
    select 1
    from public.journals
    where journals.id = journal_days.journal_id
      and journals.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.journals
    where journals.id = journal_days.journal_id
      and journals.user_id = auth.uid()
  )
);

create policy "Users can delete their own journal days"
on public.journal_days
for delete
to authenticated
using (
  exists (
    select 1
    from public.journals
    where journals.id = journal_days.journal_id
      and journals.user_id = auth.uid()
  )
);


create table public.photos (
  id uuid primary key default gen_random_uuid(),
  journal_day_id uuid not null references public.journal_days(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.photos enable row level security;

create policy "Users can view their own photos"
on public.photos
for select
to authenticated
using (
  exists (
    select 1
    from public.journal_days
    join public.journals
      on journals.id = journal_days.journal_id
    where journal_days.id = photos.journal_day_id
      and journals.user_id = auth.uid()
  )
);

create policy "Users can create their own photos"
on public.photos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.journal_days
    join public.journals
      on journals.id = journal_days.journal_id
    where journal_days.id = photos.journal_day_id
      and journals.user_id = auth.uid()
  )
);

create policy "Users can update their own photos"
on public.photos
for update
to authenticated
using (
  exists (
    select 1
    from public.journal_days
    join public.journals
      on journals.id = journal_days.journal_id
    where journal_days.id = photos.journal_day_id
      and journals.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.journal_days
    join public.journals
      on journals.id = journal_days.journal_id
    where journal_days.id = photos.journal_day_id
      and journals.user_id = auth.uid()
  )
);

create policy "Users can delete their own photos"
on public.photos
for delete
to authenticated
using (
  exists (
    select 1
    from public.journal_days
    join public.journals
      on journals.id = journal_days.journal_id
    where journal_days.id = photos.journal_day_id
      and journals.user_id = auth.uid()
  )
);
