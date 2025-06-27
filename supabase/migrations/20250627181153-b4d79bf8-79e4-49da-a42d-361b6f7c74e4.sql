
-- Create tables for real-time multiplayer functionality
CREATE TABLE public.meme_coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  price DECIMAL(10,6) NOT NULL DEFAULT 0.01,
  change_24h DECIMAL(5,2) NOT NULL DEFAULT 0,
  market_cap DECIMAL(15,2) NOT NULL DEFAULT 0,
  creator_id UUID REFERENCES auth.users NOT NULL,
  creator_name TEXT NOT NULL,
  description TEXT,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  coin_id UUID REFERENCES public.meme_coins NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, coin_id)
);

-- Enable Row Level Security
ALTER TABLE public.meme_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meme_coins (everyone can read, only authenticated users can create)
CREATE POLICY "Anyone can view meme coins" ON public.meme_coins FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create meme coins" ON public.meme_coins FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators can update their coins" ON public.meme_coins FOR UPDATE USING (auth.uid() = creator_id);

-- RLS Policies for chat_messages (everyone can read, only authenticated users can create)
CREATE POLICY "Anyone can view chat messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for user_portfolios (users can only see/modify their own portfolio)
CREATE POLICY "Users can view their own portfolio" ON public.user_portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own portfolio entries" ON public.user_portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own portfolio entries" ON public.user_portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own portfolio entries" ON public.user_portfolios FOR DELETE USING (auth.uid() = user_id);

-- Enable real-time for the tables
ALTER TABLE public.meme_coins REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.user_portfolios REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.meme_coins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_portfolios;
