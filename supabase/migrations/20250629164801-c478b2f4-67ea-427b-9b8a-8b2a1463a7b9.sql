
-- Remove the profiles table and related functions/triggers
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_profile();
DROP FUNCTION IF EXISTS public.generate_random_username();
DROP TABLE IF EXISTS public.profiles CASCADE;
