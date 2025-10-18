-- Add last_heartbeat column to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_games_last_heartbeat ON games(last_heartbeat);

-- Update existing games to have a heartbeat timestamp
UPDATE games SET last_heartbeat = NOW() WHERE last_heartbeat IS NULL;
