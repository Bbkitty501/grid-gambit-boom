
-- Create a table to store user game data
CREATE TABLE public.user_game_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.user_game_data ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own game data" 
  ON public.user_game_data 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game data" 
  ON public.user_game_data 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game data" 
  ON public.user_game_data 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to handle new user game data
CREATE OR REPLACE FUNCTION public.handle_new_user_game_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_game_data (user_id, balance)
  VALUES (new.id, 1000);
  RETURN new;
END;
$$;

-- Create trigger to automatically create game data for new users
CREATE TRIGGER on_auth_user_created_game_data
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_game_data();
