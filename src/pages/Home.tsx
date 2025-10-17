import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Trophy, Users, Info } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

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