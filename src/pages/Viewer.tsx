import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Share2, WifiOff, Wifi } from "lucide-react";
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
  game_structure: string;
  last_heartbeat?: string;
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

  const countTries = (team: "team_a" | "team_b") => {
    return events.filter(e => e.team === team && e.event_type === "try").length;
  };

  const isDataStale = () => {
    if (!game?.last_heartbeat) return false;

    const lastHeartbeat = new Date(game.last_heartbeat).getTime();
    const now = new Date().getTime();
    const secondsSinceHeartbeat = (now - lastHeartbeat) / 1000;

    // Consider data stale if no heartbeat for 60 seconds (2x heartbeat interval)
    return secondsSinceHeartbeat > 60;
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

  const viewerUrl = `${window.location.origin}/viewer/${gameId}?token=${token}`;
  const dataIsStale = isDataStale();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Live Score</h1>
          <div className="flex gap-2 items-center">
            {dataIsStale && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                <WifiOff className="w-4 h-4" />
                <span>Slow Connection</span>
              </div>
            )}
            {!dataIsStale && game?.last_heartbeat && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm font-medium">
                <Wifi className="w-4 h-4" />
                <span>Live</span>
              </div>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
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
        </div>

        <Card className="p-6 mb-6 shadow-[var(--shadow-strong)]">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: game.team_a_color }}>
                {game.team_a_name}
              </h2>
              <div className="text-7xl font-extrabold">{game.team_a_score}</div>
              {countTries("team_a") > 0 && (
                <div className="text-sm font-semibold text-muted-foreground mt-1">
                  {countTries("team_a")}T
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: game.team_b_color }}>
                {game.team_b_name}
              </h2>
              <div className="text-7xl font-extrabold">{game.team_b_score}</div>
              {countTries("team_b") > 0 && (
                <div className="text-sm font-semibold text-muted-foreground mt-1">
                  {countTries("team_b")}T
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="inline-block px-4 py-2 bg-muted rounded-full text-sm font-semibold">
              {game.game_status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </div>
        </Card>

        <GameTimeline events={events} game={game} />
      </div>
    </div>
  );
};

export default Viewer;