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

  const getScoreAtEvent = (currentIndex: number, allEvents: Event[]) => {
    // Events are in reverse chronological order, so we need to sum from the end up to current index
    let teamAScore = 0;
    let teamBScore = 0;

    // Sum all events from oldest to current (reverse order in the array)
    for (let i = allEvents.length - 1; i >= currentIndex; i--) {
      const evt = allEvents[i];
      if (evt.team === "team_a") {
        teamAScore += evt.points;
      } else if (evt.team === "team_b") {
        teamBScore += evt.points;
      }
    }

    return { teamAScore, teamBScore };
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

        <div className="space-y-3">
          {events.map((event, index) => {
            // Check if this is a game control event
            if (event.team === "game_control") {
              return (
                <div key={event.id} className="relative z-10">
                  {/* Full-width strip for game control - covers center line and dot */}
                  <div className="relative w-full bg-background">
                    <div className="relative overflow-hidden border-2 border-gray-500 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <div className="text-center relative">
                        <div className="font-bold text-lg text-gray-600 dark:text-gray-300">
                          {formatEventType(event.event_type)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
            const { teamAScore, teamBScore } = getScoreAtEvent(index, events);

            return (
              <div key={event.id} className="relative">
                {/* Center section with scores and dot */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 z-10">
                  {/* Team A score on left */}
                  <div className="flex flex-col items-end">
                    <div className="text-base font-bold text-muted-foreground">{teamAScore}</div>
                    <div className="text-[9px] text-muted-foreground h-3 leading-none">
                      {isTeamA && getTimeLabel(event, index, events)}
                    </div>
                  </div>

                  {/* Center dot */}
                  <div
                    className="w-3 h-3 rounded-full border-2 border-background flex-shrink-0"
                    style={{ backgroundColor: teamColor }}
                  />

                  {/* Team B score on right */}
                  <div className="flex flex-col items-start">
                    <div className="text-base font-bold text-muted-foreground">{teamBScore}</div>
                    <div className="text-[9px] text-muted-foreground h-3 leading-none">
                      {!isTeamA && getTimeLabel(event, index, events)}
                    </div>
                  </div>
                </div>

                {/* Event card on the correct side */}
                <div className={`grid grid-cols-2 gap-8 items-center ${isTeamA ? '' : 'flex-row-reverse'}`}>
                  {isTeamA ? (
                    <>
                      {/* Team A - Left side */}
                      <div className="flex justify-start">
                        <div
                          className="relative px-3 py-2 rounded-md max-w-[120px] w-full border overflow-hidden"
                          style={{ borderColor: teamColor }}
                        >
                          <div
                            className="absolute inset-0 opacity-5"
                            style={{ backgroundColor: teamColor }}
                          />
                          <div className="relative text-center">
                            <div className="text-sm font-semibold" style={{ color: teamColor }}>
                              {formatEventType(event.event_type)}
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
                      <div className="flex justify-end">
                        <div
                          className="relative px-3 py-2 rounded-md max-w-[120px] w-full border overflow-hidden"
                          style={{ borderColor: teamColor }}
                        >
                          <div
                            className="absolute inset-0 opacity-5"
                            style={{ backgroundColor: teamColor }}
                          />
                          <div className="relative text-center">
                            <div className="text-sm font-semibold" style={{ color: teamColor }}>
                              {formatEventType(event.event_type)}
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
