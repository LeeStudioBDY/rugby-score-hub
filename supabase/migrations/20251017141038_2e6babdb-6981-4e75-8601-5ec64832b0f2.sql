-- Drop the existing check constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;

-- Add new check constraint that includes 'conversion' event type
ALTER TABLE events ADD CONSTRAINT events_event_type_check
  CHECK (event_type IN (
    'try',
    'conversion',
    'conversion_made',
    'conversion_missed',
    'penalty',
    'drop_goal',
    'kick_off',
    'end_first_half',
    'start_second_half',
    'end_game',
    'end_q1',
    'start_q2',
    'start_q3',
    'end_q3',
    'start_q4',
    'half_time'
  ));