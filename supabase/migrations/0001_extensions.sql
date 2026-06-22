-- 0001_extensions.sql
-- Extensions required by the Nosh Social schema.
-- Non-destructive: create-if-not-exists only.

-- gen_random_uuid() for primary keys
create extension if not exists pgcrypto with schema extensions;

-- moddatetime() for auto-touching updated_at columns
create extension if not exists moddatetime with schema extensions;
