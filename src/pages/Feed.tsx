import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Feed() {
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Feed</h1>
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Beta
            </span>
          </div>
        </div>
      </header>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-20 h-20 rounded-full bg-primary-soft mx-auto mb-6 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Coming Soon</h2>
          <p className="text-muted-foreground max-w-sm">
            Discover public ideas, get inspiration, and find what others are building
          </p>
          <p className="text-sm text-primary mt-4 font-medium">
            Vibe-ideate in the world of vibe-coding
          </p>
        </motion.div>
      </div>
    </div>
  );
}
