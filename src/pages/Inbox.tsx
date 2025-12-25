import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RawThought {
  id: string;
  text: string;
  createdAt: Date;
}

// For now, thoughts are stored locally. In the future, we could persist them to the database.
const STORAGE_KEY = "vault-inbox-thoughts";

function loadThoughts(): RawThought[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
      }));
    }
  } catch (e) {
    console.error("Error loading thoughts:", e);
  }
  return [];
}

function saveThoughts(thoughts: RawThought[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
}

export default function Inbox() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [thoughts, setThoughts] = useState<RawThought[]>(() => loadThoughts());
  const [newThought, setNewThought] = useState("");

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  // Save thoughts whenever they change
  useEffect(() => {
    saveThoughts(thoughts);
  }, [thoughts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThought.trim()) return;

    const thought: RawThought = {
      id: Date.now().toString(),
      text: newThought.trim(),
      createdAt: new Date(),
    };
    setThoughts([thought, ...thoughts]);
    setNewThought("");
  };

  const handleDelete = (id: string) => {
    setThoughts(thoughts.filter(t => t.id !== id));
  };

  const handleCreateWithAI = (thought: RawThought) => {
    // Navigate to new idea page with the thought pre-filled
    navigate("/idea/new", { state: { inboxThought: thought.text } });
    
    // Remove the thought from inbox after creating
    setThoughts(thoughts.filter(t => t.id !== thought.id));
    
    toast({
      title: "Creating idea",
      description: "Fill in the details or use AI to autofill.",
    });
  };

  return (
    <div className="bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Inbox</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Capture raw thoughts & brain dumps</p>
        </div>
      </header>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-4 border-b border-border">
        <div className="flex gap-2">
          <Input
            value={newThought}
            onChange={(e) => setNewThought(e.target.value)}
            placeholder="What's on your mind?"
            className="flex-1 h-12"
          />
          <Button type="submit" size="icon" className="h-12 w-12 shrink-0">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>

      {/* Thoughts List */}
      <div className="px-4 py-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {thoughts.map((thought, index) => (
            <motion.div
              key={thought.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors"
            >
              <p className="text-foreground mb-3">{thought.text}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {thought.createdAt.toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(thought.id)}
                    className="text-muted-foreground hover:text-destructive h-8 px-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateWithAI(thought)}
                    className="gap-1.5 h-8"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Create with AI
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {thoughts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary-soft mx-auto mb-4 flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">Ideas are the future</p>
            <p className="text-sm text-muted-foreground mt-1">Start capturing your thoughts</p>
          </div>
        )}
      </div>
    </div>
  );
}
