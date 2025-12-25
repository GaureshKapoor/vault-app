import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type IdeaStatus = "idea" | "shortlisted" | "building" | "paused" | "shipped" | "archived";

interface IdeaProgress {
  id: string;
  title: string;
  status: IdeaStatus;
}

const statusOrder: IdeaStatus[] = ["building", "shortlisted", "idea", "paused", "shipped"];
const statusLabels: Record<IdeaStatus, string> = {
  idea: "Idea",
  shortlisted: "Shortlisted",
  building: "Building",
  paused: "Paused",
  shipped: "Shipped",
  archived: "Archived",
};

export default function Progress() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<IdeaProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }

      fetchIdeas();
    };

    checkAuthAndFetch();
  }, [navigate]);

  const fetchIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from("ideas")
        .select("id, title, status")
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error("Error fetching ideas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group ideas by status
  const groupedIdeas = statusOrder.reduce((acc, status) => {
    acc[status] = ideas.filter((idea) => idea.status === status);
    return acc;
  }, {} as Record<IdeaStatus, IdeaProgress[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Progress</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ideas organized by status</p>
        </div>
      </header>

      {/* Grouped List */}
      <div className="px-4 py-4 space-y-6">
        {statusOrder.map((status) => {
          const statusIdeas = groupedIdeas[status];
          if (!statusIdeas || statusIdeas.length === 0) return null;

          return (
            <motion.section
              key={status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={statusLabels[status] as any} />
                <span className="text-sm text-muted-foreground">({statusIdeas.length})</span>
              </div>
              <div className="space-y-2">
                {statusIdeas.map((idea) => (
                  <Link key={idea.id} to={`/idea/${idea.id}`}>
                    <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors group flex items-center justify-between">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {idea.title}
                      </span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </motion.section>
          );
        })}

        {ideas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No ideas yet. Start adding ideas to track your progress!</p>
          </div>
        )}
      </div>
    </div>
  );
}
