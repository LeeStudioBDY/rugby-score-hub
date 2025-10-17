import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const GameSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [teamAName, setTeamAName] = useState("");
  const [teamAColor, setTeamAColor] = useState("#1a5f3a");
  const [teamBName, setTeamBName] = useState("");
  const [teamBColor, setTeamBColor] = useState("#c2410c");
  const [gameStructure, setGameStructure] = useState<"no_halves" | "2_halves" | "4_quarters">("2_halves");

  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleCreateGame = async () => {
    if (!teamAName || !teamBName) {
      toast.error("Please enter both team names");
      return;
    }

    setLoading(true);
    try {
      const scorekeeperToken = generateToken();
      const viewerToken = generateToken();

      const { data, error } = await supabase
        .from("games")
        .insert({
          scorekeeper_token: scorekeeperToken,
          viewer_token: viewerToken,
          team_a_name: teamAName,
          team_a_color: teamAColor,
          team_b_name: teamBName,
          team_b_color: teamBColor,
          game_structure: gameStructure,
        })
        .select()
        .single();

      if (error) throw error;

      // Store game info in localStorage for quick access
      const myGames = JSON.parse(localStorage.getItem('myGames') || '[]');
      myGames.push({
        id: data.id,
        token: scorekeeperToken,
        teamAName,
        teamBName,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('myGames', JSON.stringify(myGames));

      toast.success("Game created successfully!");
      navigate(`/scorekeeper/${data.id}?token=${scorekeeperToken}`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game");
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold mb-6 text-center">Setup New Game</h1>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teamA">Team A Name</Label>
              <Input
                id="teamA"
                placeholder="e.g., Lions"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamAColor">Team A Color</Label>
              <div className="flex gap-2">
                <Input
                  id="teamAColor"
                  type="color"
                  value={teamAColor}
                  onChange={(e) => setTeamAColor(e.target.value)}
                  className="w-20 h-12"
                />
                <Input
                  value={teamAColor}
                  onChange={(e) => setTeamAColor(e.target.value)}
                  className="flex-1 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamB">Team B Name</Label>
              <Input
                id="teamB"
                placeholder="e.g., Tigers"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamBColor">Team B Color</Label>
              <div className="flex gap-2">
                <Input
                  id="teamBColor"
                  type="color"
                  value={teamBColor}
                  onChange={(e) => setTeamBColor(e.target.value)}
                  className="w-20 h-12"
                />
                <Input
                  value={teamBColor}
                  onChange={(e) => setTeamBColor(e.target.value)}
                  className="flex-1 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="structure">Game Structure</Label>
              <Select value={gameStructure} onValueChange={(value: any) => setGameStructure(value)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_halves">No Halves</SelectItem>
                  <SelectItem value="2_halves">2 Halves</SelectItem>
                  <SelectItem value="4_quarters">4 Quarters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreateGame}
              disabled={loading}
              className="w-full h-14 text-xl font-bold bg-gradient-to-r from-primary to-primary/80 hover:shadow-[var(--shadow-glow)]"
            >
              {loading ? "Creating..." : "Create Game"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GameSetup;