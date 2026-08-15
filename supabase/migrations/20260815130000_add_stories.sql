create table public.stories (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.journals(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint stories_unique_journal
    unique (journal_id)
);

alter table public.stories enable row level security;

create policy "Users can view their own stories"
on public.stories
for select
to authenticated
using (
  exists (
    select 1
    from public.journals
    where journals.id = stories.journal_id
      and journals.user_id = auth.uid()
  )
);

create policy "Users can create their own stories"
on public.stories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.journals
    where journals.id = stories.journal_id
      and journals.user_id = auth.uid()
  )
);

create policy "Users can update their own stories"
on public.stories
for update
to authenticated
using (
  exists (
    select 1
    from public.journals
    where journals.id = stories.journal_id
      and journals.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.journals
    where journals.id = stories.journal_id
      and journals.user_id = auth.uid()
  )
);

create policy "Users can delete their own stories"
on public.stories
for delete
to authenticated
using (
  exists (
    select 1
    from public.journals
    where journals.id = stories.journal_id
      and journals.user_id = auth.uid()
  )
);