import { Card } from "@/components/ui/card";

interface Event {
  id: string;
  team: string;
  event_type: string;
  points: number;
  period: number;
  created_at: string;
}

interface Game {
  team_a_name: string;
  team_a_color: string;
  team_b_name: string;
  team_b_color: string;
  game_structure: string;
}

interface GameTimelineProps {
  events: Event[];
  game: Game;
}

const GameTimeline = ({ events, game }: GameTimelineProps) => {
  const formatEventType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getTimeLabel = (event: Event, index: number, allEvents: Event[]) => {
    // Find the first event in this period (kick-off or period start)
    const periodEvents = allEvents.filter(e => e.period === event.period);
    const firstEventInPeriod = periodEvents[periodEvents.length - 1]; // oldest first
    
    if (!firstEventInPeriod) return "0'";
    
    const eventTime = new Date(event.created_at).getTime();
    const periodStartTime = new Date(firstEventInPeriod.created_at).getTime();
    const minutesElapsed = Math.floor((eventTime - periodStartTime) / 60000);
    
    // Determine the label based on period and game structure
    if (event.period === 1) {
      return `${minutesElapsed}'`;
    } else if (game.game_structure === "2_halves" && event.period === 2) {
      return `HT+${minutesElapsed}'`;
    } else if (game.game_structure === "4_quarters") {
      return `Q${event.period} ${minutesElapsed}'`;
    } else if (game.game_structure === "1_period") {
      return `${minutesElapsed}'`;
    }
    
    return `${minutesElapsed}'`;
  };

  if (events.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Timeline</h3>
        <p className="text-muted-foreground text-center py-8">No events yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">Timeline</h3>
      <div className="relative">
        {/* Center vertical line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />
        
        <div className="space-y-6">
          {events.map((event, index) => {
            // Check if this is a game control event
            if (event.team === "game_control") {
              return (
                <div key={event.id} className="relative">
                  {/* Center dot for game control events */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-background bg-primary z-10" />
                  
                  {/* Full-width strip for game control */}
                  <div className="relative px-8">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 border-y-2 border-primary/30 p-4 rounded-lg">
                      <div className="text-center">
                        <div className="font-bold text-lg text-primary">
                          {formatEventType(event.event_type)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {getTimeLabel(event, index, events)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Regular scoring event
            const isTeamA = event.team === "team_a";
            const teamColor = isTeamA ? game.team_a_color : game.team_b_color;
            const teamName = isTeamA ? game.team_a_name : game.team_b_name;
            
            return (
              <div key={event.id} className="relative">
                {/* Center dot on the timeline */}
                <div 
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-background z-10"
                  style={{ backgroundColor: teamColor }}
                />
                
                {/* Event card on the correct side */}
                <div className={`grid grid-cols-2 gap-8 items-center ${isTeamA ? '' : 'flex-row-reverse'}`}>
                  {isTeamA ? (
                    <>
                      {/* Team A - Left side */}
                      <div className="flex justify-end">
                        <div 
                          className="relative p-4 rounded-lg max-w-xs w-full border-2 overflow-hidden"
                          style={{ borderColor: teamColor }}
                        >
                          <div 
                            className="absolute inset-0 opacity-5"
                            style={{ backgroundColor: teamColor }}
                          />
                          <div className="relative">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-bold" style={{ color: teamColor }}>
                                {teamName}
                              </div>
                              {event.points > 0 && (
                                <div className="text-lg font-extrabold" style={{ color: teamColor }}>
                                  +{event.points}
                                </div>
                              )}
                            </div>
                            <div className="text-sm font-medium mb-1">
                              {formatEventType(event.event_type)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getTimeLabel(event, index, events)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div /> {/* Empty space on right */}
                    </>
                  ) : (
                    <>
                      <div /> {/* Empty space on left */}
                      {/* Team B - Right side */}
                      <div className="flex justify-start">
                        <div 
                          className="relative p-4 rounded-lg max-w-xs w-full border-2 overflow-hidden"
                          style={{ borderColor: teamColor }}
                        >
                          <div 
                            className="absolute inset-0 opacity-5"
                            style={{ backgroundColor: teamColor }}
                          />
                          <div className="relative">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-bold" style={{ color: teamColor }}>
                                {teamName}
                              </div>
                              {event.points > 0 && (
                                <div className="text-lg font-extrabold" style={{ color: teamColor }}>
                                  +{event.points}
                                </div>
                              )}
                            </div>
                            <div className="text-sm font-medium mb-1">
                              {formatEventType(event.event_type)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getTimeLabel(event, index, events)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default GameTimeline;
