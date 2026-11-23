grant usage on schema public to authenticated;

grant select, insert, update, delete
  on table public.profiles, public.workout_plans, public.workout_sessions, public.nutrition_plans
  to authenticated;

grant select on table public.coach_media_assets to authenticated;
