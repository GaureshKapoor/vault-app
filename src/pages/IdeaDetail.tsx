import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Edit2, Check, X, Rocket, Target, Lightbulb, Layers, Share, Loader2, Save, Sparkles, Trash2, Lock, Unlock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, STATUS_OPTIONS, IdeaStatus as StatusBadgeStatus } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type IdeaStatus = "idea" | "shortlisted" | "building" | "paused" | "shipped" | "archived";

interface Idea {
  id: string;
  title: string;
  description: string | null;
  main_idea: string | null;
  category: string | null;
  status: IdeaStatus;
  ai_score: number | null;
  ai_reasoning: string | null;
  difficulty: number | null;
  priority: number | null;
  sprint_fit: number | null;
  target_user: string | null;
  core_problem: string;
  core_value_proposition: string;
  core_loop: string | null;
  mvp_shape: string | null;
  check_clear_problem: boolean;
  check_simple_loop: boolean;
  check_deployable_mvp: boolean;
  is_template: boolean;
}

interface IdeaNote {
  id: string;
  content: string;
  created_at: string;
}

interface ThinkingCardProps {
  icon: React.ElementType;
  title: string;
  content: string;
  isEditing: boolean;
  field: string;
  onUpdate: (field: string, value: string) => void;
}

function ThinkingCard({ icon: Icon, title, content, isEditing, field, onUpdate }: ThinkingCardProps) {
  const [localValue, setLocalValue] = useState(content);

  useEffect(() => {
    setLocalValue(content);
  }, [content]);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={cn(
        "bg-card rounded-xl border border-border p-4 transition-all duration-200",
        isEditing && "ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h4 className="font-medium text-foreground text-sm">{title}</h4>
      </div>
      {isEditing ? (
        <textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => onUpdate(field, localValue)}
          className="w-full bg-transparent text-sm text-foreground resize-none focus:outline-none min-h-[60px] leading-relaxed"
        />
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">{content || "Not defined"}</p>
      )}
    </motion.div>
  );
}

const difficultyLabels = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"];
const statusOptions: IdeaStatus[] = ["idea", "shortlisted", "building", "paused", "shipped", "archived"];

export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [notes, setNotes] = useState<IdeaNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Partial<Idea>>({});
  
  // Track if this is the first navigation from onboarding
  const fromOnboarding = searchParams.get("fromOnboarding") === "true";
  const hasNavigatedBack = useRef(false);

  useEffect(() => {
    if (id) {
      fetchIdea();
      fetchNotes();
    }
  }, [id]);

  const fetchIdea = async () => {
    try {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setIdea(data);
    } catch (error) {
      console.error("Error fetching idea:", error);
      toast({
        variant: "destructive",
        title: "Error loading idea",
        description: "Could not find this idea.",
      });
      navigate("/home");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("idea_notes")
        .select("id, content, created_at")
        .eq("idea_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handleFieldUpdate = (field: string, value: string | number | null) => {
    setPendingUpdates((prev) => ({ ...prev, [field]: value }));
  };

  const saveChanges = async () => {
    if (Object.keys(pendingUpdates).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ideas")
        .update(pendingUpdates)
        .eq("id", id);

      if (error) throw error;

      setIdea((prev) => prev ? { ...prev, ...pendingUpdates } : prev);
      setPendingUpdates({});
      setIsEditing(false);
      toast({
        title: "Changes saved",
        description: "Your idea has been updated.",
      });
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        variant: "destructive",
        title: "Error saving",
        description: "Could not save changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("idea_notes")
        .insert({
          idea_id: id,
          user_id: user.id,
          content: newNote.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setNotes((prev) => [data, ...prev]);
      setNewNote("");
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        variant: "destructive",
        title: "Error adding note",
        description: "Could not add note. Please try again.",
      });
    }
  };

  const handleCheckToggle = async (checkField: keyof Idea) => {
    if (!idea) return;

    const newValue = !idea[checkField];
    
    try {
      const { error } = await supabase
        .from("ideas")
        .update({ [checkField]: newValue })
        .eq("id", id);

      if (error) throw error;

      setIdea((prev) => prev ? { ...prev, [checkField]: newValue } : prev);
    } catch (error) {
      console.error("Error updating check:", error);
    }
  };

  const handleAutofill = () => {
    toast({
      title: "Coming soon",
      description: "AI autofill feature is under development.",
    });
  };

  const handleMakeItYours = async () => {
    if (!idea) return;

    try {
      const { error } = await supabase
        .from("ideas")
        .update({ is_template: false })
        .eq("id", id);

      if (error) throw error;

      setIdea((prev) => prev ? { ...prev, is_template: false } : prev);
      toast({
        title: "It's yours now!",
        description: "You can now edit and customize this idea.",
      });
    } catch (error) {
      console.error("Error updating template status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update idea. Please try again.",
      });
    }
  };

  const handleArchive = async () => {
    if (!idea) return;

    try {
      const { error } = await supabase
        .from("ideas")
        .update({ status: "archived" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Idea archived",
        description: "You can find it in the Archived section.",
      });
      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Error archiving idea:", error);
      toast({
        variant: "destructive",
        title: "Error archiving",
        description: "Could not archive idea. Please try again.",
      });
    }
  };

  const handleRestore = async () => {
    if (!idea) return;

    try {
      const { error } = await supabase
        .from("ideas")
        .update({ status: "idea" })
        .eq("id", id);

      if (error) throw error;

      setIdea((prev) => prev ? { ...prev, status: "idea" } : prev);
      toast({
        title: "Idea restored",
        description: "Idea is now back in your active list.",
      });
    } catch (error) {
      console.error("Error restoring idea:", error);
      toast({
        variant: "destructive",
        title: "Error restoring",
        description: "Could not restore idea. Please try again.",
      });
    }
  };

  const formatStatus = (status: IdeaStatus): StatusBadgeStatus => {
    return (status.charAt(0).toUpperCase() + status.slice(1)) as StatusBadgeStatus;
  };

  const handleStatusChange = async (newStatus: IdeaStatus) => {
    if (!idea) return;
    
    try {
      const { error } = await supabase
        .from("ideas")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setIdea((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast({
        title: "Status updated",
        description: `Idea moved to ${formatStatus(newStatus)}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: "Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!idea) {
    return null;
  }

  const isTemplate = idea.is_template;
  const canEdit = !isTemplate;

  return (
    <div className="bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => {
              if (fromOnboarding && !hasNavigatedBack.current) {
                hasNavigatedBack.current = true;
                navigate("/home", { replace: true });
              } else {
                navigate(-1);
              }
            }}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <Share className="w-4 h-4" />
            </Button>
            
            {/* Archive/Delete Button - only for non-archived ideas */}
            {idea.status !== "archived" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive this idea?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This idea will be moved to your archived section. You can restore it later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleArchive} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Archive
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {/* Restore Button - only for archived ideas */}
            {idea.status === "archived" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRestore}
                className="gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Restore
              </Button>
            )}
            
            {/* Edit Button - only show if not template */}
            {canEdit && (
              isEditing ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={saveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Save
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Template Banner */}
      {isTemplate && (
        <div className="bg-muted/50 border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                This is a template idea. Make it yours to edit.
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={handleMakeItYours} className="gap-1.5">
              <Unlock className="w-3.5 h-3.5" />
              Make it yours
            </Button>
          </div>
        </div>
      )}

      <div className="px-4 py-6 space-y-6">
        {/* Level 1: Identity */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3 flex-wrap">
            {isEditing ? (
              <input
                type="text"
                defaultValue={idea.title}
                onChange={(e) => handleFieldUpdate("title", e.target.value)}
                className="text-2xl font-bold text-foreground bg-transparent border-b-2 border-primary focus:outline-none flex-1 min-w-0"
                placeholder="Project name"
              />
            ) : (
              <h1 className="text-2xl font-bold text-foreground">{idea.title}</h1>
            )}
            {isEditing ? (
              <select
                defaultValue={idea.category || ""}
                onChange={(e) => handleFieldUpdate("category", e.target.value)}
                className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            ) : (
              idea.category && (
                <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {idea.category}
                </span>
              )
            )}
          </div>
          <div className={cn(
            "bg-primary-soft rounded-xl p-4 border border-primary/10",
            isEditing && "ring-2 ring-primary/20"
          )}>
            {isEditing ? (
              <textarea
                defaultValue={idea.main_idea || idea.description || ""}
                onChange={(e) => handleFieldUpdate("main_idea", e.target.value)}
                className="w-full bg-transparent text-foreground leading-relaxed resize-none focus:outline-none min-h-[60px]"
                placeholder="Main idea sentence..."
              />
            ) : (
              <p className="text-foreground leading-relaxed">
                {idea.main_idea || idea.description || "No description provided"}
              </p>
            )}
          </div>
        </motion.section>

        {/* Level 2: State & Meta */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Status & Details</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutofill}
              className="gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Autofill with AI
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border border-border p-3">
              <span className="text-xs text-muted-foreground">Status</span>
              <div className="mt-1">
                {idea.status !== "archived" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <span>
                        <StatusBadge 
                          status={formatStatus(idea.status)} 
                          interactive 
                        />
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {STATUS_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => handleStatusChange(option.value.toLowerCase() as IdeaStatus)}
                          className={cn(
                            idea.status === option.value.toLowerCase() && "bg-accent"
                          )}
                        >
                          <StatusBadge status={option.value} className="pointer-events-none" />
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <StatusBadge status={formatStatus(idea.status)} />
                )}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-3">
              <span className="text-xs text-muted-foreground">AI Score</span>
              <div className="mt-1 text-lg font-bold text-primary">
                {idea.ai_score !== null ? idea.ai_score.toFixed(1) : "—"}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-3">
              <span className="text-xs text-muted-foreground">Difficulty</span>
              <div className="mt-1">
                {isEditing ? (
                  <select
                    defaultValue={idea.difficulty || ""}
                    onChange={(e) => handleFieldUpdate("difficulty", parseInt(e.target.value) || null)}
                    className="w-full text-sm font-medium bg-transparent border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Not set</option>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <option key={val} value={val}>{difficultyLabels[val]}</option>
                    ))}
                  </select>
                ) : (
                  <span className="font-medium text-foreground">
                    {idea.difficulty ? difficultyLabels[idea.difficulty] : "—"}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-3">
              <span className="text-xs text-muted-foreground">Priority</span>
              <div className="mt-1">
                {isEditing ? (
                  <select
                    defaultValue={idea.priority || ""}
                    onChange={(e) => handleFieldUpdate("priority", parseInt(e.target.value) || null)}
                    className="w-full text-sm font-medium bg-transparent border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Not set</option>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <option key={val} value={val}>{val}/5</option>
                    ))}
                  </select>
                ) : (
                  <span className="font-medium text-foreground">
                    {idea.priority ? `${idea.priority}/5` : "—"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Level 3: Core Thinking Cards */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Core Thinking</h3>
          <div className="space-y-3">
            <ThinkingCard
              icon={Target}
              title="Core Problem"
              content={idea.core_problem}
              isEditing={isEditing}
              field="core_problem"
              onUpdate={handleFieldUpdate}
            />
            <ThinkingCard
              icon={Lightbulb}
              title="Core Product → Value Prop"
              content={idea.core_value_proposition}
              isEditing={isEditing}
              field="core_value_proposition"
              onUpdate={handleFieldUpdate}
            />
            <ThinkingCard
              icon={Layers}
              title="Core Loop"
              content={idea.core_loop || ""}
              isEditing={isEditing}
              field="core_loop"
              onUpdate={handleFieldUpdate}
            />
            <ThinkingCard
              icon={Rocket}
              title="MVP Shape"
              content={idea.mvp_shape || ""}
              isEditing={isEditing}
              field="mvp_shape"
              onUpdate={handleFieldUpdate}
            />
          </div>
        </motion.section>

        {/* Level 4: Readiness Check */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Readiness Check</h3>
          <div className="space-y-2">
            {[
              { label: "One clear consumer problem", field: "check_clear_problem" as const, checked: idea.check_clear_problem },
              { label: "One simple core loop", field: "check_simple_loop" as const, checked: idea.check_simple_loop },
              { label: "One deployable MVP shape", field: "check_deployable_mvp" as const, checked: idea.check_deployable_mvp },
            ].map((check, index) => (
              <button
                key={index}
                onClick={() => handleCheckToggle(check.field)}
                className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 w-full text-left hover:bg-accent/50 transition-colors"
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                  check.checked ? "bg-status-building text-primary-foreground" : "bg-muted"
                )}>
                  {check.checked ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 text-muted-foreground" />}
                </div>
                <span className={cn(
                  "text-sm",
                  check.checked ? "text-foreground" : "text-muted-foreground"
                )}>
                  {check.label}
                </span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Notes Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Notes</h3>
          
          {/* Add new note */}
          <div className="bg-card rounded-xl border border-border p-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none min-h-[60px] leading-relaxed"
            />
            {newNote.trim() && (
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={addNote}>
                  Add Note
                </Button>
              </div>
            )}
          </div>

          {/* Existing notes */}
          {notes.map((note) => (
            <div key={note.id} className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-foreground leading-relaxed">{note.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(note.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button 
            variant="hero" 
            size="xl" 
            className="w-full mt-2"
            onClick={() => navigate(fromOnboarding ? "/home" : "/build")}
          >
            <Rocket className="w-5 h-5 mr-2" />
            {fromOnboarding ? "Explore Vault" : "Start Building"}
          </Button>
          {!fromOnboarding && (
            <p className="text-center text-xs text-muted-foreground mt-3 mb-2">
              Build plugins coming soon
            </p>
          )}
        </motion.section>
      </div>
    </div>
  );
}
