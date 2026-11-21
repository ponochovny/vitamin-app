create table public.meal_reminder_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  schedule_mode text not null default 'preset'
    check (schedule_mode in ('preset', 'custom')),
  morning_at time not null default '09:00',
  day_at time not null default '14:00',
  evening_at time not null default '18:00',
  updated_at timestamptz not null default now(),
  check (morning_at < '12:00'::time),
  check (day_at >= '12:00'::time and day_at < '18:00'::time),
  check (evening_at >= '18:00'::time)
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (
    endpoint ~ '^https://(fcm\.googleapis\.com|web\.push\.apple\.com|[a-z0-9.-]+\.push\.services\.mozilla\.com|[a-z0-9.-]+\.notify\.windows\.com)/'
  ),
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table public.meal_reminder_deliveries (
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_date date not null,
  period text not null check (period in ('morning', 'day', 'evening')),
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent')),
  attempts smallint not null default 0 check (attempts between 0 and 5),
  locked_until timestamptz not null default 'epoch',
  sent_at timestamptz,
  last_error text,
  primary key (user_id, reminder_date, period)
);

create index logs_user_date_created_at_idx
  on public.logs(user_id, date, created_at);

alter table public.meal_reminder_settings enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.meal_reminder_deliveries enable row level security;

create policy "meal_reminder_settings_owner" on public.meal_reminder_settings
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_subscriptions_owner" on public.push_subscriptions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.meal_reminder_deliveries from public, anon, authenticated;
grant select, insert, update, delete on public.push_subscriptions to service_role;
grant select, insert, update on public.meal_reminder_deliveries to service_role;

create or replace function public.claim_due_meal_reminders()
returns table (
  user_id uuid,
  reminder_date date,
  period text,
  missing_food boolean,
  missing_mood boolean,
  endpoint text,
  p256dh text,
  auth text
)
language sql
security definer
set search_path = ''
as $$
  with local_clock as (
    select
      settings.user_id,
      settings.morning_at,
      settings.day_at,
      settings.evening_at,
      now() at time zone 'Europe/Kyiv' as local_now
    from public.meal_reminder_settings as settings
    where settings.enabled
  ),
  scheduled as (
    select
      clock.user_id,
      clock.local_now::date as reminder_date,
      slot.period,
      slot.reminder_at
    from local_clock as clock
    cross join lateral (
      values
        ('morning'::text, clock.morning_at),
        ('day'::text, clock.day_at),
        ('evening'::text, clock.evening_at)
    ) as slot(period, reminder_at)
    where date_trunc('minute', clock.local_now)
      = date_trunc('minute', clock.local_now::date + slot.reminder_at)
  ),
  checked as (
    select
      scheduled.user_id,
      scheduled.reminder_date,
      scheduled.period,
      not exists (
        select 1
        from public.logs as food
        where food.user_id = scheduled.user_id
          and food.date = scheduled.reminder_date
          and food.created_at >= (
            (scheduled.reminder_date::timestamp + case scheduled.period
              when 'morning' then interval '0 hours'
              when 'day' then interval '12 hours'
              else interval '18 hours'
            end) at time zone 'Europe/Kyiv'
          )
          and food.created_at < (
            (scheduled.reminder_date::timestamp + case scheduled.period
              when 'morning' then interval '12 hours'
              when 'day' then interval '18 hours'
              else interval '24 hours'
            end) at time zone 'Europe/Kyiv'
          )
      ) as missing_food,
      not exists (
        select 1
        from public.wellbeing_entries as mood
        where mood.user_id = scheduled.user_id
          and mood.entry_date = scheduled.reminder_date
          and mood.kind = 'mood'
          and mood.value->>'period' = scheduled.period
      ) as missing_mood
    from scheduled
    where exists (
      select 1
      from public.push_subscriptions as subscription
      where subscription.user_id = scheduled.user_id
    )
  ),
  eligible as (
    select *
    from checked
    where missing_food or missing_mood
  ),
  claimed as (
    insert into public.meal_reminder_deliveries as delivery (
      user_id,
      reminder_date,
      period,
      status,
      attempts,
      locked_until
    )
    select
      eligible.user_id,
      eligible.reminder_date,
      eligible.period,
      'sending',
      1,
      now() + interval '5 minutes'
    from eligible
    on conflict (user_id, reminder_date, period) do update
      set status = 'sending',
          attempts = delivery.attempts + 1,
          locked_until = excluded.locked_until,
          last_error = null
      where delivery.status <> 'sent'
        and delivery.attempts < 5
        and delivery.locked_until <= now()
    returning delivery.user_id, delivery.reminder_date, delivery.period
  )
  select
    claimed.user_id,
    claimed.reminder_date,
    claimed.period,
    eligible.missing_food,
    eligible.missing_mood,
    subscription.endpoint,
    subscription.p256dh,
    subscription.auth
  from claimed
  join eligible
    on eligible.user_id = claimed.user_id
    and eligible.reminder_date = claimed.reminder_date
    and eligible.period = claimed.period
  join public.push_subscriptions as subscription
    on subscription.user_id = claimed.user_id;
$$;

revoke all on function public.claim_due_meal_reminders() from public, anon, authenticated;
grant execute on function public.claim_due_meal_reminders() to service_role;
