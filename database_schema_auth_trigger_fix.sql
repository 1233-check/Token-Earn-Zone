-- Fix the handle_new_user function to explicitly use public schema for generate_unique_id
-- This resolves an issue where the auth schema trigger could not find generate_unique_id()

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, unique_id, full_name, referred_by, referral_side)
  VALUES (
    NEW.id,
    NEW.email,
    public.generate_unique_id(),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'referred_by', ''),
    NULLIF(NEW.raw_user_meta_data->>'referral_side', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
