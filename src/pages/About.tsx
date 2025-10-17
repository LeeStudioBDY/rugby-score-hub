import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Shield, ExternalLink } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  const charities = [
    {
      name: "RugbyWorks",
      description: "Using rugby to transform the lives of young people",
      link: "https://www.rugbyworks.co.uk/",
    },
    {
      name: "State of Mind Sport",
      description: "Raising awareness and tackling the stigma of mental health",
      link: "https://www.stateofmindsport.org/",
    },
    {
      name: "Restart Rugby",
      description: "Supporting grassroots rugby clubs worldwide",
      link: "https://www.restartrugby.org/",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="space-y-6">
          <Card className="p-6 shadow-[var(--shadow-strong)]">
            <h1 className="text-3xl font-bold mb-4">About Rugby Scorekeeper</h1>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Rugby Scorekeeper is a free, mobile-first web app designed for parents and coaches
                to track live scores at grassroots rugby games.
              </p>
              <p>
                No login required - just create a game and share the viewer link. Perfect for
                outdoor conditions with large, high-contrast buttons and offline support.
              </p>
              
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg mt-4">
                <Shield className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Privacy First</h3>
                  <p className="text-sm">
                    No accounts, no tracking, no ads. Just simple scorekeeping with secure,
                    tokenized links that only you control.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-[var(--shadow-strong)]">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-destructive" />
              <h2 className="text-2xl font-bold">Support Rugby Charities</h2>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Consider supporting these amazing organizations working to grow and improve rugby:
            </p>

            <div className="space-y-4">
              {charities.map((charity) => (
                <Card key={charity.name} className="p-4 hover:border-primary/50 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{charity.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {charity.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={charity.link} target="_blank" rel="noopener noreferrer">
                        Visit
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Know a rugby charity that should be featured here?{" "}
                <a
                  href="mailto:suggest@rugbyscorekeeper.app"
                  className="text-primary hover:underline font-semibold"
                >
                  Suggest a charity
                </a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;