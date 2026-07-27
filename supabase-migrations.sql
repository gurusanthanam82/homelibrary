-- Run in Supabase SQL Editor. Safe to re-run (all IF NOT EXISTS / idempotent defaults).

alter table books add column if not exists shelf text;
alter table books add column if not exists language text;
alter table books add column if not exists publisher text;
alter table books alter column status set default 'unread';

alter table books add column if not exists progress integer default 0;
alter table books add column if not exists ownership text default 'owned';
alter table books add column if not exists audiobook_url text;
alter table books add column if not exists seconds_read integer default 0;
alter table books add column if not exists back_cover_url text;
