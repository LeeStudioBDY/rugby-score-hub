import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, QrCode, Undo } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import GameTimeline from "@/components/GameTimeline";

interface Game {
  id: string;
  team_a_name: string;
  team_a_color: string;
  team_b_name: string;
  team_b_color: string;
  team_a_score: number;
  team_b_score: number;
  game_status: string;
  current_period: number;
  game_structure: string;
  viewer_token: string;
  last_heartbeat?: string;
}

interface Event {
  id: string;
  game_id?: string;
  team: string;
  event_type: string;
  points: number;
  period: number;
  created_at: string;
}

const Scorekeeper = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [game, setGame] = useState<Game | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [awaitingConversion, setAwaitingConversion] = useState<"team_a" | "team_b" | null>(null);
  const [syncQueue, setSyncQueue] = useState<Array<() => Promise<void>>>([]);

  useEffect(() => {
    if (!gameId || !token) {
      toast.error("Invalid game link");
      navigate("/");
      return;
    }

    loadGame();
    subscribeToChanges();
  }, [gameId, token]);

  // Process sync queue in background
  useEffect(() => {
    if (syncQueue.length === 0) return;

    const processSyncQueue = async () => {
      const operation = syncQueue[0];
      try {
        await operation();
        setSyncQueue(prev => prev.slice(1));
      } catch (error) {
        console.error("Sync failed, will retry:", error);
        // Keep in queue and retry after delay
        setTimeout(() => {
          setSyncQueue(prev => [...prev]);
        }, 2000);
      }
    };

    processSyncQueue();
  }, [syncQueue]);

  // Send heartbeat every 30 seconds to indicate scorekeeper is active
  useEffect(() => {
    if (!gameId) return;

    const sendHeartbeat = async () => {
      try {
        await supabase
          .from("games")
          .update({ last_heartbeat: new Date().toISOString() })
          .eq("id", gameId);
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(interval);
  }, [gameId]);

  const loadGame = async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .eq("scorekeeper_token", token)
        .single();

      if (error) throw error;
      setGame(data);

      // Load events
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (error) {
      console.error("Error loading game:", error);
      toast.error("Failed to load game");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const gameChannel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          setGame(payload.new as Game);
        }
      )
      .subscribe();

    const eventsChannel = supabase
      .channel(`events-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          loadGame();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(eventsChannel);
    };
  };

  const isGameInPlay = () => {
    return game?.game_status === "in_progress";
  };

  const countTries = (team: "team_a" | "team_b") => {
    return events.filter(e => e.team === team && e.event_type === "try").length;
  };

  const getNextGameStateButton = () => {
    if (!game) return null;
    
    const structure = game.game_structure;
    const currentPeriod = game.current_period;
    const status = game.game_status;

    if (status === "not_started") {
      return { label: "Kick Off", nextStatus: "in_progress", nextPeriod: 1 };
    }

    if (structure === "2_halves") {
      if (currentPeriod === 1 && status === "in_progress") {
        return { label: "End First Half", nextStatus: "half_time", nextPeriod: 1 };
      }
      if (currentPeriod === 1 && status === "half_time") {
        return { label: "Start Second Half", nextStatus: "in_progress", nextPeriod: 2 };
      }
      if (currentPeriod === 2 && status === "in_progress") {
        return { label: "End Game", nextStatus: "finished", nextPeriod: 2 };
      }
    }

    if (structure === "4_quarters") {
      if (currentPeriod === 1 && status === "in_progress") {
        return { label: "End Q1", nextStatus: "quarter_break", nextPeriod: 1 };
      }
      if (currentPeriod === 1 && status === "quarter_break") {
        return { label: "Start Q2", nextStatus: "in_progress", nextPeriod: 2 };
      }
      if (currentPeriod === 2 && status === "in_progress") {
        return { label: "Half Time", nextStatus: "half_time", nextPeriod: 2 };
      }
      if (currentPeriod === 2 && status === "half_time") {
        return { label: "Start Q3", nextStatus: "in_progress", nextPeriod: 3 };
      }
      if (currentPeriod === 3 && status === "in_progress") {
        return { label: "End Q3", nextStatus: "quarter_break", nextPeriod: 3 };
      }
      if (currentPeriod === 3 && status === "quarter_break") {
        return { label: "Start Q4", nextStatus: "in_progress", nextPeriod: 4 };
      }
      if (currentPeriod === 4 && status === "in_progress") {
        return { label: "End Game", nextStatus: "finished", nextPeriod: 4 };
      }
    }

    if (structure === "1_period") {
      if (currentPeriod === 1 && status === "in_progress") {
        return { label: "End Game", nextStatus: "finished", nextPeriod: 1 };
      }
    }

    return null;
  };

  const recordEvent = async (team: "team_a" | "team_b", eventType: string, points: number) => {
    if (!game || !gameId) return;

    // Create optimistic event
    const optimisticEvent: Event = {
      id: `temp-${Date.now()}`,
      game_id: gameId,
      team,
      event_type: eventType,
      points,
      period: game.current_period || 0,
      created_at: new Date().toISOString(),
    };

    // Update UI immediately (optimistic)
    setEvents(prev => [optimisticEvent, ...prev]);

    const scoreField = team === "team_a" ? "team_a_score" : "team_b_score";
    const newScore = (game[scoreField] || 0) + points;

    setGame(prev => prev ? { ...prev, [scoreField]: newScore } : null);

    toast.success(`${eventType.replace("_", " ")} recorded!`);

    // Queue database sync in background
    setSyncQueue(prev => [...prev, async () => {
      const { data: insertedEvent, error: insertError } = await supabase
        .from("events")
        .insert({
          game_id: gameId,
          team,
          event_type: eventType,
          points,
          period: game.current_period || 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Replace temp event with real one
      setEvents(prev => prev.map(e =>
        e.id === optimisticEvent.id ? insertedEvent : e
      ));

      await supabase
        .from("games")
        .update({ [scoreField]: newScore })
        .eq("id", gameId);
    }]);
  };

  const handleTry = async (team: "team_a" | "team_b") => {
    await recordEvent(team, "try", 5);
    setAwaitingConversion(team);
  };

  const handleConversion = async (made: boolean) => {
    if (!awaitingConversion) return;

    if (made) {
      await recordEvent(awaitingConversion, "conversion", 2);
    } else {
      // Record missed conversion with 0 points
      await recordEvent(awaitingConversion, "conversion_missed", 0);
    }

    setAwaitingConversion(null);
  };

  const advanceGameState = async () => {
    const nextState = getNextGameStateButton();
    if (!nextState || !game || !gameId) return;

    const eventType = nextState.label.toLowerCase().replace(/ /g, "_");

    // Create optimistic game control event
    const optimisticEvent: Event = {
      id: `temp-${Date.now()}`,
      game_id: gameId,
      team: "game_control",
      event_type: eventType,
      points: 0,
      period: nextState.nextPeriod,
      created_at: new Date().toISOString(),
    };

    // Update UI immediately (optimistic)
    setEvents(prev => [optimisticEvent, ...prev]);
    setGame(prev => prev ? {
      ...prev,
      game_status: nextState.nextStatus,
      current_period: nextState.nextPeriod
    } : null);

    toast.success(nextState.label);

    // Queue database sync in background
    setSyncQueue(prev => [...prev, async () => {
      const { data: insertedEvent, error: insertError } = await supabase
        .from("events")
        .insert({
          game_id: gameId,
          team: "game_control",
          event_type: eventType,
          points: 0,
          period: nextState.nextPeriod,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Replace temp event with real one
      setEvents(prev => prev.map(e =>
        e.id === optimisticEvent.id ? insertedEvent : e
      ));

      await supabase
        .from("games")
        .update({
          game_status: nextState.nextStatus,
          current_period: nextState.nextPeriod
        })
        .eq("id", gameId);
    }]);
  };

  const undoLastEvent = async () => {
    if (events.length === 0 || !game || !gameId) return;

    const lastEvent = events[0]; // events are in reverse chronological order

    // Update UI immediately (optimistic)
    setEvents(prev => prev.slice(1)); // Remove last event from UI

    try {
      // If it's a game control event, we need to restore the previous game state
      if (lastEvent.team === "game_control") {
        // Find the previous game control event to determine what state to restore
        const previousGameControlEvent = events.slice(1).find(e => e.team === "game_control");

        let restoreStatus = "not_started";
        let restorePeriod = 0;

        if (previousGameControlEvent) {
          // Determine the state from the previous game control event
          const eventType = previousGameControlEvent.event_type;
          restorePeriod = previousGameControlEvent.period;

          if (eventType === "kick_off") {
            restoreStatus = "in_progress";
          } else if (eventType === "end_first_half") {
            restoreStatus = "half_time";
          } else if (eventType === "start_second_half") {
            restoreStatus = "in_progress";
          } else if (eventType === "end_q1") {
            restoreStatus = "quarter_break";
          } else if (eventType === "start_q2") {
            restoreStatus = "in_progress";
          } else if (eventType === "half_time") {
            restoreStatus = "half_time";
          } else if (eventType === "start_q3") {
            restoreStatus = "in_progress";
          } else if (eventType === "end_q3") {
            restoreStatus = "quarter_break";
          } else if (eventType === "start_q4") {
            restoreStatus = "in_progress";
          } else if (eventType === "end_game") {
            restoreStatus = "finished";
          }
        }

        // Update game state optimistically
        setGame(prev => prev ? {
          ...prev,
          game_status: restoreStatus,
          current_period: restorePeriod
        } : null);

        setAwaitingConversion(null);

        // Queue database sync in background
        setSyncQueue(prev => [...prev, async () => {
          await supabase
            .from("events")
            .delete()
            .eq("id", lastEvent.id);

          await supabase
            .from("games")
            .update({
              game_status: restoreStatus,
              current_period: restorePeriod
            })
            .eq("id", gameId);
        }]);
      } else if (lastEvent.event_type === "conversion" || lastEvent.event_type === "conversion_missed") {
        // Undoing a conversion (made or missed) - restore the awaiting conversion state
        const scoreField = lastEvent.team === "team_a" ? "team_a_score" : "team_b_score";
        const newScore = Math.max(0, (game[scoreField] || 0) - lastEvent.points);

        // Update score optimistically (only if points were scored)
        if (lastEvent.points > 0) {
          setGame(prev => prev ? { ...prev, [scoreField]: newScore } : null);
        }

        // Restore awaiting conversion state
        setAwaitingConversion(lastEvent.team);
        toast.success("Conversion undone - please record result again");

        // Queue database sync in background
        setSyncQueue(prev => [...prev, async () => {
          await supabase
            .from("events")
            .delete()
            .eq("id", lastEvent.id);

          if (lastEvent.points > 0) {
            await supabase
              .from("games")
              .update({ [scoreField]: newScore })
              .eq("id", gameId);
          }
        }]);

        return; // Exit early to keep awaiting conversion state
      } else {
        // It's a scoring event - rollback the score
        const scoreField = lastEvent.team === "team_a" ? "team_a_score" : "team_b_score";
        const newScore = Math.max(0, (game[scoreField] || 0) - lastEvent.points);

        // Update score optimistically
        setGame(prev => prev ? { ...prev, [scoreField]: newScore } : null);

        // If undoing a try, clear awaiting conversion
        if (lastEvent.event_type === "try") {
          setAwaitingConversion(null);
        }

        // Queue database sync in background
        setSyncQueue(prev => [...prev, async () => {
          await supabase
            .from("events")
            .delete()
            .eq("id", lastEvent.id);

          await supabase
            .from("games")
            .update({ [scoreField]: newScore })
            .eq("id", gameId);
        }]);
      }

      toast.success("Event undone");
    } catch (error) {
      console.error("Error undoing event:", error);
      toast.error("Failed to undo event");
      // Revert optimistic update on error
      await loadGame();
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!game) {
    return <div className="min-h-screen flex items-center justify-center">Game not found</div>;
  }

  const viewerUrl = `${window.location.origin}/viewer/${gameId}?token=${game.viewer_token}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <QrCode className="w-4 h-4 mr-2" />
                Viewer QR
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Viewer Link</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4">
                <QRCodeSVG value={viewerUrl} size={256} />
                <p className="text-sm text-muted-foreground text-center break-all">{viewerUrl}</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6 mb-6 shadow-[var(--shadow-strong)] relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              background: `linear-gradient(to right, ${game.team_a_color}, ${game.team_b_color})`
            }}
          />
          <div className="grid grid-cols-2 gap-4 text-center relative">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: game.team_a_color }}>
                {game.team_a_name}
              </h2>
              <div className="text-6xl font-extrabold">{game.team_a_score}</div>
              {countTries("team_a") > 0 && (
                <div className="text-sm font-semibold text-muted-foreground mt-1">
                  {countTries("team_a")}T
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: game.team_b_color }}>
                {game.team_b_name}
              </h2>
              <div className="text-6xl font-extrabold">{game.team_b_score}</div>
              {countTries("team_b") > 0 && (
                <div className="text-sm font-semibold text-muted-foreground mt-1">
                  {countTries("team_b")}T
                </div>
              )}
            </div>
          </div>
        </Card>

        {awaitingConversion && (
          <Card className="p-6 mb-6 bg-accent/10 border-accent">
            <h3 className="text-xl font-bold mb-4 text-center">Conversion Result</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleConversion(true)}
                className="h-16 text-lg font-bold bg-gradient-to-r from-primary to-primary/80"
              >
                Made
              </Button>
              <Button
                onClick={() => handleConversion(false)}
                variant="outline"
                className="h-16 text-lg font-bold"
              >
                Missed
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 relative overflow-hidden" style={{ borderColor: game.team_a_color, borderWidth: '2px' }}>
            <div 
              className="absolute inset-0 opacity-5"
              style={{ backgroundColor: game.team_a_color }}
            />
            <h3 className="font-bold mb-3 text-center relative" style={{ color: game.team_a_color }}>
              {game.team_a_name}
            </h3>
            <div className="space-y-2 relative">
              <Button
                onClick={() => handleTry("team_a")}
                disabled={!!awaitingConversion || !isGameInPlay()}
                className="w-full h-14 font-bold"
                variant="outline"
                style={{ borderColor: game.team_a_color, color: game.team_a_color }}
              >
                Try
              </Button>
              <Button
                onClick={() => recordEvent("team_a", "penalty", 3)}
                disabled={!!awaitingConversion || !isGameInPlay()}
                className="w-full h-14 font-bold"
                variant="outline"
                style={{ borderColor: game.team_a_color, color: game.team_a_color }}
              >
                Penalty
              </Button>
              <Button
                onClick={() => recordEvent("team_a", "drop_goal", 3)}
                disabled={!!awaitingConversion || !isGameInPlay()}
                className="w-full h-14 font-bold"
                variant="outline"
                style={{ borderColor: game.team_a_color, color: game.team_a_color }}
              >
                Drop Goal
              </Button>
            </div>
          </Card>

          <Card className="p-4 relative overflow-hidden" style={{ borderColor: game.team_b_color, borderWidth: '2px' }}>
            <div 
              className="absolute inset-0 opacity-5"
              style={{ backgroundColor: game.team_b_color }}
            />
            <h3 className="font-bold mb-3 text-center relative" style={{ color: game.team_b_color }}>
              {game.team_b_name}
            </h3>
            <div className="space-y-2 relative">
              <Button
                onClick={() => handleTry("team_b")}
                disabled={!!awaitingConversion || !isGameInPlay()}
                className="w-full h-14 font-bold"
                variant="outline"
                style={{ borderColor: game.team_b_color, color: game.team_b_color }}
              >
                Try
              </Button>
              <Button
                onClick={() => recordEvent("team_b", "penalty", 3)}
                disabled={!!awaitingConversion || !isGameInPlay()}
                className="w-full h-14 font-bold"
                variant="outline"
                style={{ borderColor: game.team_b_color, color: game.team_b_color }}
              >
                Penalty
              </Button>
              <Button
                onClick={() => recordEvent("team_b", "drop_goal", 3)}
                disabled={!!awaitingConversion || !isGameInPlay()}
                className="w-full h-14 font-bold"
                variant="outline"
                style={{ borderColor: game.team_b_color, color: game.team_b_color }}
              >
                Drop Goal
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-4 mb-6">
          <h3 className="font-bold mb-3">Game Controls</h3>
          <div className="space-y-3">
            {getNextGameStateButton() ? (
              <Button
                onClick={advanceGameState}
                className="w-full h-16 text-lg font-bold bg-gradient-to-r from-primary to-primary/80"
                disabled={!!awaitingConversion || game?.game_status === "finished"}
              >
                {getNextGameStateButton()?.label}
              </Button>
            ) : (
              <p className="text-center text-muted-foreground py-4">Game Finished</p>
            )}
            <Button
              onClick={undoLastEvent}
              variant="outline"
              className="w-full h-14 font-bold text-destructive border-destructive hover:bg-destructive/10"
              disabled={events.length === 0}
            >
              <Undo className="w-4 h-4 mr-2" />
              {awaitingConversion ? "Undo Conversion" : "Undo Last Event"}
            </Button>
          </div>
        </Card>

        <GameTimeline events={events} game={game} />
      </div>
    </div>
  );
};

export default Scorekeeper;