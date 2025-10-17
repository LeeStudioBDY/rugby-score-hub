import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Trophy, Users, Info, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MyGame {
  id: string;
  token: string;
  teamAName: string;
  teamBName: string;
  createdAt: string;
}

interface GameStatus {
  id: string;
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
  game_status: string;
}

const Home = () => {
  const navigate = useNavigate();
  const [myGames, setMyGames] = useState<(MyGame & { status?: GameStatus })[]>([]);

  useEffect(() => {
    const loadMyGames = async () => {
      const stored = JSON.parse(localStorage.getItem('myGames') || '[]') as MyGame[];
      
      if (stored.length > 0) {
        const { data } = await supabase
          .from('games')
          .select('id, team_a_name, team_b_name, team_a_score, team_b_score, game_status')
          .in('id', stored.map(g => g.id))
          .neq('game_status', 'ended');

        const gamesWithStatus = stored
          .map(game => ({
            ...game,
            status: data?.find(d => d.id === game.id)
          }))
          .filter(game => game.status); // Only show games that still exist and aren't ended

        setMyGames(gamesWithStatus);
      }
    };

    loadMyGames();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 flex flex-col">
      <header className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="w-12 h-12 text-primary" />
          <h1 className="text-5xl font-extrabold text-foreground">Rugby Scorekeeper</h1>
        </div>
        <p className="text-muted-foreground text-lg">Track live scores with ease</p>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          {myGames.length > 0 && (
            <Card className="p-6 shadow-[var(--shadow-strong)] border-2 border-primary/30">
              <h2 className="text-lg font-bold mb-4 text-primary">My Games In Progress</h2>
              <div className="space-y-2">
                {myGames.map((game) => (
                  <Button
                    key={game.id}
                    onClick={() => navigate(`/scorekeeper/${game.id}?token=${game.token}`)}
                    variant="outline"
                    className="w-full h-auto p-4 flex flex-col items-start hover:bg-primary/5"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Play className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{game.status?.team_a_name} vs {game.status?.team_b_name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Score: {game.status?.team_a_score} - {game.status?.team_b_score}
                    </div>
                  </Button>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-8 shadow-[var(--shadow-strong)] border-2 hover:border-primary/50 transition-all">
            <Button
              onClick={() => navigate("/setup")}
              className="w-full h-20 text-xl font-bold bg-gradient-to-r from-primary to-primary/80 hover:shadow-[var(--shadow-glow)] transition-all"
              size="lg"
            >
              <Trophy className="w-6 h-6 mr-3" />
              Start New Game
            </Button>
          </Card>

          <Card className="p-8 shadow-[var(--shadow-strong)] border-2 hover:border-primary/50 transition-all">
            <Button
              onClick={() => navigate("/join")}
              variant="outline"
              className="w-full h-20 text-xl font-bold border-2 hover:bg-muted transition-all"
              size="lg"
            >
              <Users className="w-6 h-6 mr-3" />
              Join/View Game
            </Button>
          </Card>

          <Card className="p-8 shadow-[var(--shadow-strong)] border-2 hover:border-primary/50 transition-all">
            <Button
              onClick={() => navigate("/about")}
              variant="outline"
              className="w-full h-20 text-xl font-bold border-2 hover:bg-muted transition-all"
              size="lg"
            >
              <Info className="w-6 h-6 mr-3" />
              About & Donate
            </Button>
          </Card>
        </div>
      </main>

      <footer className="text-center py-4 text-sm text-muted-foreground">
        Made with ❤️ for grassroots rugby
      </footer>
    </div>
  );
};

export default Home;