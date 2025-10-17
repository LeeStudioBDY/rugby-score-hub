-- Create games table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scorekeeper_token TEXT NOT NULL UNIQUE,
  viewer_token TEXT NOT NULL UNIQUE,
  team_a_name TEXT NOT NULL,
  team_a_color TEXT NOT NULL,
  team_b_name TEXT NOT NULL,
  team_b_color TEXT NOT NULL,
  game_structure TEXT NOT NULL CHECK (game_structure IN ('no_halves', '2_halves', '4_quarters')),
  current_period INT NOT NULL DEFAULT 0,
  game_status TEXT NOT NULL DEFAULT 'not_started' CHECK (game_status IN ('not_started', 'in_progress', 'half_time', 'finished', 'locked')),
  team_a_score INT NOT NULL DEFAULT 0,
  team_b_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  team TEXT NOT NULL CHECK (team IN ('team_a', 'team_b')),
  event_type TEXT NOT NULL CHECK (event_type IN ('try', 'conversion_made', 'conversion_missed', 'penalty', 'drop_goal', 'kickoff', 'half_time', 'second_half', 'full_time')),
  points INT NOT NULL DEFAULT 0,
  period INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games (public access via tokens)
CREATE POLICY "Anyone can view games"
  ON public.games
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create games"
  ON public.games
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update games with scorekeeper token"
  ON public.games
  FOR UPDATE
  USING (true);

-- RLS Policies for events (public access)
CREATE POLICY "Anyone can view events"
  ON public.events
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create events"
  ON public.events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update events"
  ON public.events
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete events"
  ON public.events
  FOR DELETE
  USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();