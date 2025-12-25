import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Save, Sparkles, Target, Lightbulb, Layers, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CATEGORY_OPTIONS } from "@/lib/categories";

interface ThinkingCardProps {
  icon: React.ElementType;
  title: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function ThinkingCard({ icon: Icon, title, placeholder, value, onChange }: ThinkingCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-card rounded-xl border border-border p-4 transition-all duration-200"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h4 className="font-medium text-foreground text-sm">{title}</h4>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-foreground resize-none focus:outline-none min-h-[60px] leading-relaxed placeholder:text-muted-foreground"
      />
    </motion.div>
  );
}

export default function NewIdea() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Check if we're creating from an inbox thought
  const inboxThought = location.state?.inboxThought as string | undefined;
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [mainIdea, setMainIdea] = useState(inboxThought || "");
  const [coreProblem, setCoreProblem] = useState("");
  const [coreValueProp, setCoreValueProp] = useState("");
  const [coreLoop, setCoreLoop] = useState("");
  const [mvpShape, setMvpShape] = useState("");
  const [targetUser, setTargetUser] = useState("");

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

  const handleAutofill = () => {
    toast({
      title: "Coming soon",
      description: "AI autofill feature is under development.",
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "Please add a title for your idea.",
      });
      return;
    }

    if (!coreProblem.trim() || !coreValueProp.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in the Core Problem and Value Proposition.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("ideas")
        .insert({
          user_id: user.id,
          title: title.trim(),
          category: category || null,
          main_idea: mainIdea.trim() || null,
          description: mainIdea.trim() || null,
          core_problem: coreProblem.trim(),
          core_value_proposition: coreValueProp.trim(),
          core_loop: coreLoop.trim() || null,
          mvp_shape: mvpShape.trim() || null,
          target_user: targetUser.trim() || null,
          status: "idea",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Idea created!",
        description: "Your new idea has been saved.",
      });

      // Navigate to the new idea's detail page
      navigate(`/idea/${data.id}`);
    } catch (error) {
      console.error("Error saving idea:", error);
      toast({
        variant: "destructive",
        title: "Error saving",
        description: "Could not save idea. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">New Idea</h1>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Level 1: Identity */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold text-foreground bg-transparent border-b-2 border-primary focus:outline-none flex-1 min-w-0 h-auto py-1"
              placeholder="Project name"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="bg-primary-soft rounded-xl p-4 border border-primary/10">
            <textarea
              value={mainIdea}
              onChange={(e) => setMainIdea(e.target.value)}
              className="w-full bg-transparent text-foreground leading-relaxed resize-none focus:outline-none min-h-[60px] placeholder:text-muted-foreground"
              placeholder="Describe your main idea in one sentence..."
            />
          </div>
        </motion.section>

        {/* Autofill Button */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            variant="outline"
            onClick={handleAutofill}
            className="w-full gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Autofill with AI
          </Button>
        </motion.section>

        {/* Level 2: Thinking Cards */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Thinking Framework</h3>
          <div className="grid gap-3">
            <ThinkingCard
              icon={Target}
              title="Core Problem"
              placeholder="What problem are you solving?"
              value={coreProblem}
              onChange={setCoreProblem}
            />
            <ThinkingCard
              icon={Lightbulb}
              title="Value Proposition"
              placeholder="What's the unique value you offer?"
              value={coreValueProp}
              onChange={setCoreValueProp}
            />
            <ThinkingCard
              icon={Layers}
              title="Core Loop"
              placeholder="What's the repeatable user action?"
              value={coreLoop}
              onChange={setCoreLoop}
            />
            <ThinkingCard
              icon={Rocket}
              title="MVP Shape"
              placeholder="What's the simplest version you can build?"
              value={mvpShape}
              onChange={setMvpShape}
            />
          </div>
        </motion.section>

        {/* Target User */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Target User</h3>
          <div className="bg-card rounded-xl border border-border p-4">
            <textarea
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              placeholder="Who is this for? Describe your ideal user..."
              className="w-full bg-transparent text-sm text-foreground resize-none focus:outline-none min-h-[60px] leading-relaxed placeholder:text-muted-foreground"
            />
          </div>
        </motion.section>
      </div>
    </div>
  );
}
