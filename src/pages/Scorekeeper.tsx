import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, QrCode, Undo } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  viewer_token: string;
}

const Scorekeeper = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [awaitingConversion, setAwaitingConversion] = useState<"team_a" | "team_b" | null>(null);

  useEffect(() => {
    if (!gameId || !token) {
      toast.error("Invalid game link");
      navigate("/");
      return;
    }

    loadGame();
    subscribeToChanges();
  }, [gameId, token]);

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
    } catch (error) {
      console.error("Error loading game:", error);
      toast.error("Failed to load game");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const recordEvent = async (team: "team_a" | "team_b", eventType: string, points: number) => {
    try {
      const { error } = await supabase.from("events").insert({
        game_id: gameId,
        team,
        event_type: eventType,
        points,
        period: game?.current_period || 0,
      });

      if (error) throw error;

      const scoreField = team === "team_a" ? "team_a_score" : "team_b_score";
      const newScore = (game?.[scoreField] || 0) + points;

      await supabase
        .from("games")
        .update({ [scoreField]: newScore })
        .eq("id", gameId);

      toast.success(`${eventType.replace("_", " ")} recorded!`);
    } catch (error) {
      console.error("Error recording event:", error);
      toast.error("Failed to record event");
    }
  };

  const handleTry = async (team: "team_a" | "team_b") => {
    await recordEvent(team, "try", 5);
    setAwaitingConversion(team);
  };

  const handleConversion = async (made: boolean) => {
    if (!awaitingConversion) return;
    
    if (made) {
      await recordEvent(awaitingConversion, "conversion_made", 2);
    } else {
      await recordEvent(awaitingConversion, "conversion_missed", 0);
    }
    
    setAwaitingConversion(null);
  };

  const updateGameStatus = async (status: string) => {
    try {
      await supabase.from("games").update({ game_status: status }).eq("id", gameId);
      toast.success(`Game status: ${status}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
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

        <Card className="p-6 mb-6 shadow-[var(--shadow-strong)]">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: game.team_a_color }}>
                {game.team_a_name}
              </h2>
              <div className="text-6xl font-extrabold">{game.team_a_score}</div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: game.team_b_color }}>
                {game.team_b_name}
              </h2>
              <div className="text-6xl font-extrabold">{game.team_b_score}</div>
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
                Made (+2)
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
          <Card className="p-4">
            <h3 className="font-bold mb-3 text-center" style={{ color: game.team_a_color }}>
              {game.team_a_name}
            </h3>
            <div className="space-y-2">
              <Button
                onClick={() => handleTry("team_a")}
                disabled={!!awaitingConversion}
                className="w-full h-14 font-bold bg-gradient-to-r from-primary to-primary/80"
              >
                Try (5)
              </Button>
              <Button
                onClick={() => recordEvent("team_a", "penalty", 3)}
                disabled={!!awaitingConversion}
                className="w-full h-14 font-bold"
                variant="outline"
              >
                Penalty (3)
              </Button>
              <Button
                onClick={() => recordEvent("team_a", "drop_goal", 3)}
                disabled={!!awaitingConversion}
                className="w-full h-14 font-bold"
                variant="outline"
              >
                Drop Goal (3)
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-bold mb-3 text-center" style={{ color: game.team_b_color }}>
              {game.team_b_name}
            </h3>
            <div className="space-y-2">
              <Button
                onClick={() => handleTry("team_b")}
                disabled={!!awaitingConversion}
                className="w-full h-14 font-bold bg-gradient-to-r from-primary to-primary/80"
              >
                Try (5)
              </Button>
              <Button
                onClick={() => recordEvent("team_b", "penalty", 3)}
                disabled={!!awaitingConversion}
                className="w-full h-14 font-bold"
                variant="outline"
              >
                Penalty (3)
              </Button>
              <Button
                onClick={() => recordEvent("team_b", "drop_goal", 3)}
                disabled={!!awaitingConversion}
                className="w-full h-14 font-bold"
                variant="outline"
              >
                Drop Goal (3)
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="font-bold mb-3">Game Controls</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => updateGameStatus("in_progress")}
              variant="outline"
              className="h-12"
            >
              Kick-off
            </Button>
            <Button
              onClick={() => updateGameStatus("half_time")}
              variant="outline"
              className="h-12"
            >
              Half-time
            </Button>
            <Button
              onClick={() => updateGameStatus("in_progress")}
              variant="outline"
              className="h-12"
            >
              2nd Half
            </Button>
            <Button
              onClick={() => updateGameStatus("finished")}
              variant="outline"
              className="h-12"
            >
              Full-time
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Scorekeeper;