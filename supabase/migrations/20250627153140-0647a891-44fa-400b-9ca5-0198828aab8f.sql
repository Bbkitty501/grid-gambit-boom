
-- Create a table to store money transfers between players
CREATE TABLE public.money_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users NOT NULL,
  to_user_email TEXT NOT NULL,
  to_user_id UUID REFERENCES auth.users,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add Row Level Security (RLS)
ALTER TABLE public.money_transfers ENABLE ROW LEVEL SECURITY;

-- Users can view transfers they sent or received
CREATE POLICY "Users can view their own transfers" 
  ON public.money_transfers 
  FOR SELECT 
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can create transfers (sending money)
CREATE POLICY "Users can create transfers" 
  ON public.money_transfers 
  FOR INSERT 
  WITH CHECK (auth.uid() = from_user_id);

-- System can update transfer status
CREATE POLICY "System can update transfer status" 
  ON public.money_transfers 
  FOR UPDATE 
  USING (true);

-- Create an index for faster lookups
CREATE INDEX idx_money_transfers_to_email ON public.money_transfers(to_user_email);
CREATE INDEX idx_money_transfers_from_user ON public.money_transfers(from_user_id);
CREATE INDEX idx_money_transfers_to_user ON public.money_transfers(to_user_id);
