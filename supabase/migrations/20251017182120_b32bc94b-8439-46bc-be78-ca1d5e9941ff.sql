ALTER TABLE games ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_games_last_heartbeat ON games(last_heartbeat);
UPDATE games SET last_heartbeat = NOW() WHERE last_heartbeat IS NULL;