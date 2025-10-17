import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const JoinGame = () => {
  const navigate = useNavigate();
  const [gameUrl, setGameUrl] = useState("");

  const handleJoin = () => {
    if (!gameUrl) return;
    
    try {
      const url = new URL(gameUrl);
      const path = url.pathname + url.search;
      navigate(path);
    } catch (error) {
      console.error("Invalid URL:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-6 shadow-[var(--shadow-strong)]">
          <h1 className="text-3xl font-bold mb-6 text-center">Join/View Game</h1>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gameUrl">Game Link</Label>
              <Input
                id="gameUrl"
                placeholder="Paste game link or scan QR code"
                value={gameUrl}
                onChange={(e) => setGameUrl(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <Button
              onClick={handleJoin}
              className="w-full h-14 text-xl font-bold bg-gradient-to-r from-primary to-primary/80 hover:shadow-[var(--shadow-glow)]"
            >
              Join Game
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>Or scan a QR code with your camera</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default JoinGame;