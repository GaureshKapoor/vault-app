import { motion } from "framer-motion";
import { ArrowLeft, Rocket, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function StartBuilding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Start Building</h1>
        </div>
      </header>

      {/* Coming Soon */}
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 pt-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full gradient-hero mx-auto flex items-center justify-center animate-pulse-soft">
              <Rocket className="w-12 h-12 text-primary-foreground" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-status-shortlisted flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3">Build plugins coming soon</h2>
          <p className="text-muted-foreground max-w-sm mb-8">
            Connect directly to Lovable, Replit, Cursor, and more to go from idea to deployed app.
          </p>

          <div className="space-y-3 max-w-xs mx-auto">
            {["Lovable", "Replit", "Cursor", "Vercel"].map((tool) => (
              <div
                key={tool}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-lg font-bold text-muted-foreground">
                    {tool[0]}
                  </span>
                </div>
                <span className="font-medium text-foreground">{tool}</span>
                <span className="ml-auto text-xs text-muted-foreground">Soon</span>
              </div>
            ))}
          </div>

          <Button variant="soft" className="mt-8" onClick={() => navigate(-1)}>
            Back to Idea
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
