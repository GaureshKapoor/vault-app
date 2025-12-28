import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  CloudOff,
  Feather,
  Lightbulb,
  Link2,
  Loader2,
  Mic,
  PartyPopper,
  PenLine,
  Plus,
  PlusCircle,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RawThought {
  id: string;
  text: string;
  createdAt: Date;
  status?: "active" | "promoted" | "archived";
  promotedAt?: Date | null;
}

const STORAGE_KEY = "vault-inbox-thoughts";

const loadThoughts = (): RawThought[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((item: RawThought & { createdAt: string; promotedAt?: string | null }) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      promotedAt: item.promotedAt ? new Date(item.promotedAt) : null,
      status: item.status || "active",
    }));
  } catch (error) {
    console.error("Error loading thoughts:", error);
    return [];
  }
};

const saveThoughts = (thoughts: RawThought[]) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      thoughts.map((thought) => ({
        ...thought,
        createdAt: thought.createdAt.toISOString(),
        promotedAt: thought.promotedAt ? thought.promotedAt.toISOString() : null,
      }))
    )
  );
};

const hoursSince = (date: Date) => {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
};

const formatTimestamp = (date: Date) => {
  const diffHours = hoursSince(date);
  if (diffHours < 1) return "Captured moments ago";
  if (diffHours < 24) return `${diffHours}h ago`;
  const days = Math.floor(diffHours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
};

const templates = [
  {
    id: "pain",
    label: "Customer pain",
    icon: Lightbulb,
    text: "Customer pain: ",
    helper: "Describe the friction you noticed",
  },
  {
    id: "workflow",
    label: "Workflow idea",
    icon: PenLine,
    text: "Workflow tweak: ",
    helper: "Capture the manual step you're replacing",
  },
  {
    id: "voice",
    label: "Voice memo",
    icon: Mic,
    text: "Voice memo transcription: ",
    helper: "Drop rough narration, edit later",
  },
  {
    id: "link",
    label: "Link drop",
    icon: Link2,
    text: "Interesting link → ",
    helper: "Save inspiration before it disappears",
  },
];

export default function Inbox() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [thoughts, setThoughts] = useState<RawThought[]>(() => loadThoughts());
  const [newThought, setNewThought] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    saveThoughts(thoughts);
  }, [thoughts]);

  const addThought = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const thought: RawThought = {
      id: Date.now().toString(),
      text: trimmed,
      createdAt: new Date(),
      status: "active",
    };
    setThoughts([thought, ...thoughts]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addThought(newThought);
    setNewThought("");
  };

  const handleTemplate = (templateText: string, helper: string) => {
    setNewThought((prev) => (prev ? `${prev}\n${templateText}` : templateText));
    toast({
      title: "Prompt ready",
      description: helper,
    });
  };

  const handleCreateWithAI = (thought: RawThought) => {
    navigate("/idea/new", { state: { inboxThought: thought.text } });
    setThoughts((prev) =>
      prev.map((item) =>
        item.id === thought.id
          ? { ...item, status: "promoted", promotedAt: new Date() }
          : item
      )
    );
    toast({
      title: "Idea drafting",
      description: "We moved this thought into Idea detail so you can shape it with AI.",
    });
  };

  const handleMarkPromoted = (thought: RawThought) => {
    setThoughts((prev) =>
      prev.map((item) =>
        item.id === thought.id
          ? { ...item, status: "promoted", promotedAt: new Date() }
          : item
      )
    );
    toast({
      title: "Captured as win",
      description: "You'll find it under Already promoted for future reference.",
    });
  };

  const handleArchive = (thought: RawThought) => {
    setThoughts((prev) =>
      prev.map((item) => (item.id === thought.id ? { ...item, status: "archived" } : item))
    );
  };

  const handleRestore = (thought: RawThought) => {
    setThoughts((prev) =>
      prev.map((item) => (item.id === thought.id ? { ...item, status: "active" } : item))
    );
  };

  const handleDelete = (thought: RawThought) => {
    setThoughts((prev) => prev.filter((item) => item.id !== thought.id));
  };

  const activeThoughts = useMemo(
    () => thoughts.filter((thought) => (thought.status || "active") === "active"),
    [thoughts]
  );

  const freshThoughts = useMemo(
    () =>
      activeThoughts
        .filter((thought) => hoursSince(thought.createdAt) < 12)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [activeThoughts]
  );

  const needsStructureThoughts = useMemo(
    () =>
      activeThoughts
        .filter((thought) => hoursSince(thought.createdAt) >= 12)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [activeThoughts]
  );

  const promotedThoughts = useMemo(
    () =>
      thoughts
        .filter((thought) => thought.status === "promoted")
        .sort(
          (a, b) =>
            (b.promotedAt?.getTime() || b.createdAt.getTime()) -
            (a.promotedAt?.getTime() || a.createdAt.getTime())
        ),
    [thoughts]
  );

  const archivedThoughts = useMemo(
    () =>
      thoughts
        .filter((thought) => thought.status === "archived")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [thoughts]
  );

  if (isLoading) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header - fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Inbox</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Dump sparks quickly, then decide whether to nurture, promote, or shelve them.
          </p>
        </div>
      </header>

      {/* Content - with top padding for fixed header (more on mobile) */}
      <div className="pt-[108px] md:pt-[92px] px-4 py-6 space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-card transition-colors"
          onClick={() => navigate("/idea/new", { state: { fromInbox: true } })}
        >
          <div className="w-16 h-16 rounded-full bg-primary-soft mx-auto mb-4 flex items-center justify-center">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground">Ideas are the future</p>
          <p className="text-sm text-muted-foreground mt-1">Tap to create a new idea</p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Mind dump HQ</h2>
              <p className="text-sm text-muted-foreground">
                Capture anything swirling in your head. Messy thoughts welcome.
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={newThought}
              onChange={(e) => setNewThought(e.target.value)}
              placeholder="Brain dump, question, half-formed pitch…"
              className="min-h-[120px]"
            />
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <Button
                  type="button"
                  key={template.id}
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleTemplate(template.text, template.helper)}
                >
                  <template.icon className="w-4 h-4" />
                  {template.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CloudOff className="w-3.5 h-3.5" />
                Thoughts stored locally. Clear browser data = wipe.
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setNewThought("")}>
                  Clear
                </Button>
                <Button type="submit" className="gap-2">
                  Log thought
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="grid gap-4 md:grid-cols-3"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="rounded-2xl border border-border p-4 bg-muted/20"
          >
            <p className="text-xs uppercase text-muted-foreground">Fresh drops</p>
            <h3 className="text-2xl font-semibold text-foreground">{freshThoughts.length}</h3>
            <p className="text-sm text-muted-foreground">Touch within 24h to keep energy.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="rounded-2xl border border-border p-4"
          >
            <p className="text-xs uppercase text-muted-foreground">Needs structure</p>
            <h3 className="text-2xl font-semibold text-foreground">{needsStructureThoughts.length}</h3>
            <p className="text-sm text-muted-foreground">Give these a quick AI pass so they don't stagnate.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="rounded-2xl border border-border p-4"
          >
            <p className="text-xs uppercase text-muted-foreground">Already promoted</p>
            <h3 className="text-2xl font-semibold text-foreground">{promotedThoughts.length}</h3>
            <p className="text-sm text-muted-foreground">Wins you can revisit or reuse.</p>
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
          className="space-y-8"
        >
          <ThoughtSection
            title="Just dropped"
            description="Stuff you captured recently. Lightly tag or promote while it's fresh."
            emptyLabel="Nothing new yet. Capture a thought to see it here."
            thoughts={freshThoughts}
            onCreateWithAI={handleCreateWithAI}
            onMarkPromoted={handleMarkPromoted}
            onArchive={handleArchive}
            delay={0.45}
          />

          <ThoughtSection
            title="Needs structure"
            description="Older notes that deserve five minutes of shaping before they go stale."
            emptyLabel="All caught up."
            thoughts={needsStructureThoughts}
            onCreateWithAI={handleCreateWithAI}
            onMarkPromoted={handleMarkPromoted}
            onArchive={handleArchive}
            delay={0.5}
          />

          <ThoughtSection
            title="Already promoted"
            description="Ideas that graduated into the pipeline. Celebrate and reuse them."
            emptyLabel="No conversions yet. Keep promoting promising sparks."
            thoughts={promotedThoughts}
            variant="promoted"
            onArchive={handleArchive}
            delay={0.55}
          />

          {!!archivedThoughts.length && (
            <ThoughtSection
              title="Shelf / Archive"
              description="Quiet storage for brain dumps you don't need right now."
              emptyLabel=""
              thoughts={archivedThoughts}
              variant="archived"
              onRestore={handleRestore}
              onDelete={handleDelete}
              delay={0.6}
            />
          )}
        </motion.section>
      </div>
    </div>
  );
}

interface ThoughtSectionProps {
  title: string;
  description: string;
  emptyLabel: string;
  thoughts: RawThought[];
  variant?: "default" | "promoted" | "archived";
  delay?: number;
  onCreateWithAI?: (thought: RawThought) => void;
  onMarkPromoted?: (thought: RawThought) => void;
  onArchive?: (thought: RawThought) => void;
  onRestore?: (thought: RawThought) => void;
  onDelete?: (thought: RawThought) => void;
}

function ThoughtSection({
  title,
  description,
  emptyLabel,
  thoughts,
  variant = "default",
  delay = 0,
  onCreateWithAI,
  onMarkPromoted,
  onArchive,
  onRestore,
  onDelete,
}: ThoughtSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <span className="text-sm text-muted-foreground">{thoughts.length}</span>
        </div>
      </div>
      {!thoughts.length && emptyLabel && (
        <div className="border border-dashed border-border rounded-xl p-4 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      )}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {thoughts.map((thought) => (
            <motion.div
              key={thought.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-border p-4"
            >
              <p className="text-foreground whitespace-pre-line">{thought.text}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Feather className="w-3.5 h-3.5" />
                {formatTimestamp(thought.createdAt)}
                {thought.status === "promoted" && thought.promotedAt && (
                  <span className="inline-flex items-center gap-1">
                    <PartyPopper className="w-3.5 h-3.5 text-primary" />
                    Promoted {formatTimestamp(thought.promotedAt)}
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {variant === "default" && (
                  <>
                    {onCreateWithAI && (
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onCreateWithAI(thought)}>
                        <Sparkles className="w-4 h-4" />
                        Draft with AI
                      </Button>
                    )}
                    {onMarkPromoted && (
                      <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => onMarkPromoted(thought)}>
                        <PlusCircle className="w-4 h-4" />
                        Mark as promoted
                      </Button>
                    )}
                    {onArchive && (
                      <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => onArchive(thought)}>
                        <Archive className="w-4 h-4" />
                        Archive
                      </Button>
                    )}
                  </>
                )}
                {variant === "promoted" && onArchive && (
                  <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => onArchive(thought)}>
                    <Archive className="w-4 h-4" />
                    Move to shelf
                  </Button>
                )}
                {variant === "archived" && (
                  <>
                    {onRestore && (
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onRestore(thought)}>
                        <ArchiveRestore className="w-4 h-4" />
                        Restore
                      </Button>
                    )}
                    {onDelete && (
                      <Button size="sm" variant="ghost" className="gap-1.5 text-destructive" onClick={() => onDelete(thought)}>
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
