
-- Create a profiles table to store user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create function to generate random usernames
CREATE OR REPLACE FUNCTION public.generate_random_username()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    adjectives TEXT[] := ARRAY[
        'Swift', 'Brave', 'Clever', 'Mighty', 'Silent', 'Golden', 'Silver', 'Cosmic', 
        'Mystic', 'Noble', 'Wild', 'Fierce', 'Gentle', 'Bright', 'Dark', 'Storm',
        'Fire', 'Ice', 'Thunder', 'Lightning', 'Shadow', 'Crystal', 'Diamond', 'Ruby',
        'Sapphire', 'Emerald', 'Pearl', 'Jade', 'Coral', 'Ocean', 'Mountain', 'River',
        'Forest', 'Desert', 'Arctic', 'Tropical', 'Ancient', 'Future', 'Quantum', 'Cyber',
        'Neon', 'Plasma', 'Stellar', 'Lunar', 'Solar', 'Galactic', 'Cosmic', 'Ethereal'
    ];
    
    animals TEXT[] := ARRAY[
        'Wolf', 'Eagle', 'Tiger', 'Lion', 'Bear', 'Fox', 'Hawk', 'Owl', 'Shark',
        'Dolphin', 'Whale', 'Falcon', 'Raven', 'Phoenix', 'Dragon', 'Unicorn', 'Griffin',
        'Panther', 'Jaguar', 'Cheetah', 'Leopard', 'Lynx', 'Puma', 'Cougar', 'Bobcat',
        'Seal', 'Otter', 'Beaver', 'Badger', 'Raccoon', 'Squirrel', 'Chipmunk', 'Rabbit',
        'Deer', 'Elk', 'Moose', 'Buffalo', 'Bison', 'Rhino', 'Hippo', 'Elephant',
        'Giraffe', 'Zebra', 'Gazelle', 'Antelope', 'Kangaroo', 'Koala', 'Panda', 'Sloth'
    ];
    
    adjective TEXT;
    animal TEXT;
    number_suffix TEXT;
    username TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Select random adjective and animal
        adjective := adjectives[1 + floor(random() * array_length(adjectives, 1))];
        animal := animals[1 + floor(random() * array_length(animals, 1))];
        
        -- Generate random number suffix (100-999)
        number_suffix := (100 + floor(random() * 900))::TEXT;
        
        -- Combine them
        username := 'The' || adjective || animal || number_suffix;
        
        -- Check if username already exists
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = username) THEN
            RETURN username;
        END IF;
        
        -- Safety counter to prevent infinite loop
        counter := counter + 1;
        IF counter > 100 THEN
            -- Fallback with timestamp
            username := 'TheUser' || extract(epoch from now())::TEXT;
            RETURN username;
        END IF;
    END LOOP;
END;
$$;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (NEW.id, public.generate_random_username());
    RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Enable realtime for profiles
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
