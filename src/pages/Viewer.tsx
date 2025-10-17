import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Download } from "lucide-react";

interface Game {
  id: string;
  team_a_name: string;
  team_a_color: string;
  team_b_name: string;
  team_b_color: string;
  team_a_score: number;
  team_b_score: number;
  game_status: string;
}

interface Event {
  id: string;
  team: string;
  event_type: string;
  points: number;
  period: number;
  created_at: string;
}

const Viewer = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [game, setGame] = useState<Game | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!gameId || !token) {
      toast.error("Invalid viewer link");
      return;
    }

    loadData();
    subscribeToChanges();
    
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [gameId, token]);

  const loadData = async () => {
    try {
      setRefreshing(true);
      
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .eq("viewer_token", token)
        .single();

      if (gameError) throw gameError;
      setGame(gameData);

      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load game data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const subscribeToChanges = () => {
    const gameChannel = supabase
      .channel(`viewer-game-${gameId}`)
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
      .channel(`viewer-events-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(eventsChannel);
    };
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-xl font-bold">Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-xl font-bold">Game not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Live Score</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Card className="p-6 mb-6 shadow-[var(--shadow-strong)]">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: game.team_a_color }}>
                {game.team_a_name}
              </h2>
              <div className="text-7xl font-extrabold">{game.team_a_score}</div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: game.team_b_color }}>
                {game.team_b_name}
              </h2>
              <div className="text-7xl font-extrabold">{game.team_b_score}</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="inline-block px-4 py-2 bg-muted rounded-full text-sm font-semibold">
              {formatEventType(game.game_status)}
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Timeline</h3>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No events yet</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: event.team === "team_a" ? game.team_a_color : game.team_b_color,
                      }}
                    />
                    <div>
                      <div className="font-semibold">
                        {event.team === "team_a" ? game.team_a_name : game.team_b_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatEventType(event.event_type)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {event.points > 0 && (
                      <div className="font-bold text-lg">+{event.points}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Viewer;