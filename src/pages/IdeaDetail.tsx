import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Edit2, Check, X, Rocket, Target, Lightbulb, Layers, Share, Loader2, Save, Sparkles, Trash2, Lock, Unlock, RotateCcw, Zap, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, STATUS_OPTIONS, IdeaStatus as StatusBadgeStatus } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import { useAIOperations, type AutofillResult, type ScoreResult, type NameSuggestion, type PitchSuggestion } from "@/hooks/useAIOperations";
import { AutofillPreviewDialog } from "@/components/ai/AutofillPreviewDialog";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  created_at?: string;
  updated_at?: string;
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
  const { autofillIdea, scoreIdea, suggestName, draftPitch, isLoading: isAILoading, isSuggestingName, isDraftingPitch } = useAIOperations();

  const [idea, setIdea] = useState<Idea | null>(null);
  const [notes, setNotes] = useState<IdeaNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Partial<Idea>>({});
  const [isExporting, setIsExporting] = useState(false);

  // AI state
  const [autofillSuggestions, setAutofillSuggestions] = useState<AutofillResult | null>(null);
  const [showAutofillDialog, setShowAutofillDialog] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<NameSuggestion[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [pitchSuggestions, setPitchSuggestions] = useState<PitchSuggestion[]>([]);
  const [showPitchSuggestions, setShowPitchSuggestions] = useState(false);

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
      // If this was a template, convert it to a user-owned idea
      const updatesToApply = idea?.is_template
        ? { ...pendingUpdates, is_template: false, sort_order: null }
        : pendingUpdates;

      const { error } = await supabase
        .from("ideas")
        .update(updatesToApply)
        .eq("id", id);

      if (error) throw error;

      setIdea((prev) => prev ? { ...prev, ...updatesToApply } : prev);
      setPendingUpdates({});
      setIsEditing(false);

      const wasTemplate = idea?.is_template;
      toast({
        title: wasTemplate ? "It's yours now!" : "Changes saved",
        description: wasTemplate
          ? "This idea is now yours and has been updated."
          : "Your idea has been updated.",
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

  const handleAutofill = async () => {
    if (!idea) return;

    const result = await autofillIdea({
      title: idea.title,
      category: idea.category || undefined,
      main_idea: idea.main_idea || idea.description || undefined,
    });

    if (result) {
      setAutofillSuggestions(result);
      setShowAutofillDialog(true);
    }
  };

  const handleApplyAutofill = async (selectedFields: Partial<AutofillResult>) => {
    if (!idea) return;

    try {
      const { error } = await supabase
        .from("ideas")
        .update(selectedFields)
        .eq("id", idea.id);

      if (error) throw error;

      setIdea((prev) => prev ? { ...prev, ...selectedFields } : prev);
      toast({
        title: "Fields updated",
        description: `Applied ${Object.keys(selectedFields).length} AI suggestions.`,
      });
    } catch (error) {
      console.error("Error applying autofill:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to apply suggestions.",
      });
    }
  };

  const handleScore = async () => {
    if (!idea) return;

    setIsScoring(true);
    try {
      const result = await scoreIdea({
        title: idea.title,
        description: idea.description || undefined,
        category: idea.category || undefined,
        core_problem: idea.core_problem,
        core_value_proposition: idea.core_value_proposition,
        core_loop: idea.core_loop || undefined,
        mvp_shape: idea.mvp_shape || undefined,
        target_user: idea.target_user || undefined,
      });

      if (result) {
        // Only update score-related fields, not the readiness checks (those are set by autofill)
        const { error } = await supabase
          .from("ideas")
          .update({
            ai_score: result.ai_score,
            ai_reasoning: result.ai_reasoning,
            difficulty: result.suggested_difficulty,
            priority: result.suggested_priority,
            sprint_fit: result.suggested_sprint_fit,
          })
          .eq("id", idea.id);

        if (error) throw error;

        setIdea((prev) => prev ? {
          ...prev,
          ai_score: result.ai_score,
          ai_reasoning: result.ai_reasoning,
          difficulty: result.suggested_difficulty,
          priority: result.suggested_priority,
          sprint_fit: result.suggested_sprint_fit,
        } : prev);

        toast({
          title: "Idea scored!",
          description: `AI Score: ${result.ai_score}/10`,
        });
      }
    } catch (error) {
      console.error("Error scoring idea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to score idea.",
      });
    } finally {
      setIsScoring(false);
    }
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

  const handleSuggestName = async () => {
    if (!idea) return;

    const result = await suggestName({
      main_idea: idea.main_idea || idea.description || undefined,
      description: idea.description || undefined,
      category: idea.category || undefined,
      core_problem: idea.core_problem || undefined,
    });

    if (result) {
      setNameSuggestions(result);
      setShowNameSuggestions(true);
    }
  };

  const handleSelectName = async (name: string) => {
    setShowNameSuggestions(false);

    if (isEditing) {
      // If editing, just update the pending updates (will save when user clicks Save)
      handleFieldUpdate("title", name);
      toast({
        title: "Name selected",
        description: `Click Save to apply "${name}"`,
      });
    } else {
      // If not editing, save directly to database
      try {
        const { error } = await supabase
          .from("ideas")
          .update({ title: name })
          .eq("id", id);

        if (error) throw error;

        setIdea((prev) => prev ? { ...prev, title: name } : prev);
        toast({
          title: "Name updated",
          description: `Project name set to "${name}"`,
        });
      } catch (error) {
        console.error("Error updating name:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not update name. Please try again.",
        });
      }
    }
  };

  const handleDraftPitch = async () => {
    if (!idea) return;

    const result = await draftPitch({
      title: idea.title,
      category: idea.category || undefined,
      description: idea.main_idea || idea.description || undefined,
      core_problem: idea.core_problem || undefined,
      core_value_proposition: idea.core_value_proposition || undefined,
    });

    if (result) {
      setPitchSuggestions(result);
      setShowPitchSuggestions(true);
    }
  };

  const handleSelectPitch = async (pitch: string) => {
    setShowPitchSuggestions(false);

    if (isEditing) {
      // If editing, just update the pending updates (will save when user clicks Save)
      handleFieldUpdate("main_idea", pitch);
      toast({
        title: "Pitch selected",
        description: `Click Save to apply the new pitch.`,
      });
    } else {
      // If not editing, save directly to database
      try {
        const { error } = await supabase
          .from("ideas")
          .update({ main_idea: pitch })
          .eq("id", id);

        if (error) throw error;

        setIdea((prev) => prev ? { ...prev, main_idea: pitch } : prev);
        toast({
          title: "Pitch updated",
          description: "Your 1-liner has been updated.",
        });
      } catch (error) {
        console.error("Error updating pitch:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not update pitch. Please try again.",
        });
      }
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
      <div className="flex-1 bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!idea) {
    return null;
  }

  const isTemplate = idea.is_template;
  const canEdit = !isTemplate;

  const buildIdeaExportSummary = () => {
    if (!idea) return "";

    const lastEdited = idea.updated_at
      ? new Date(idea.updated_at).toLocaleString()
      : "Unknown";
    const createdAt = idea.created_at
      ? new Date(idea.created_at).toLocaleDateString()
      : "Unknown";

    const evalLines = [
      `Difficulty: ${idea.difficulty ?? "-"}`,
      `Priority: ${idea.priority ?? "-"}`,
      `Sprint Fit: ${idea.sprint_fit ?? "-"}`,
    ].join(" | ");

    const readiness = [
      { label: "Clear Problem", value: idea.check_clear_problem },
      { label: "Simple Loop", value: idea.check_simple_loop },
      { label: "Deployable MVP", value: idea.check_deployable_mvp },
    ]
      .map((item) => `- ${item.label}: ${item.value ? "✅" : "⬜"}`)
      .join("\n");

    const sections = [
      `Vault Idea — ${idea.title || "Untitled"}`,
      "",
      `${idea.category || "Uncategorized"} | Status: ${formatStatus(idea.status)} | AI Score: ${idea.ai_score ?? "N/A"}`,
      `Last Edited: ${lastEdited} • Created: ${createdAt}`,
      "",
      idea.main_idea ? `Summary: ${idea.main_idea}` : undefined,
      idea.description ? `Description: ${idea.description}` : undefined,
      idea.main_idea || idea.description ? "" : undefined,
      "Core Narrative",
      "",
      `• Problem: ${idea.core_problem || "Not defined"}`,
      `• Value Proposition: ${idea.core_value_proposition || "Not defined"}`,
      `• Core Loop: ${idea.core_loop || "Not defined"}`,
      `• MVP Shape: ${idea.mvp_shape || "Not defined"}`,
      `• Target User: ${idea.target_user || "Not defined"}`,
      "",
      "Evaluation",
      "",
      evalLines,
      "",
      "Readiness Checks",
      "",
      readiness,
      idea.ai_reasoning ? `\nAI Reasoning:\n${idea.ai_reasoning}` : undefined,
    ].filter(Boolean);

    if (notes.length) {
      sections.push("", "Notes", "");
      notes.forEach((note, index) => {
        const noteTime = new Date(note.created_at).toLocaleString();
        sections.push(`${index + 1}. ${note.content} (${noteTime})`);
      });
    }

    return sections.join("\n");
  };

  const handleShareIdea = async () => {
    if (!idea) return;

    setIsExporting(true);
    const summary = buildIdeaExportSummary();
    const canUseWebShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

    if (canUseWebShare) {
      try {
        await navigator.share({ text: summary });
        toast({
          title: "Shared",
          description: "Idea summary sent via the native share sheet.",
        });
        setIsExporting(false);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setIsExporting(false);
          return;
        }
        console.warn("Web Share API failed, falling back to download", error);
      }
    }

    try {
      const blob = new Blob([summary], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${idea.title || "vault-idea"}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export ready",
        description: "Downloaded text summary for this idea.",
      });
    } catch (error) {
      console.error("Error exporting idea:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Couldn't export this idea. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShareIdea}
              disabled={isExporting}
              aria-label="Export or share idea"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share className="w-4 h-4" />
              )}
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
            <div className="flex items-center gap-2 flex-1 min-w-0">
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleSuggestName}
                    disabled={isSuggestingName}
                    className="shrink-0"
                  >
                    {isSuggestingName ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 text-primary" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Suggest project name</p>
                </TooltipContent>
              </Tooltip>
            </div>
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
            "bg-primary-soft rounded-xl p-4 border border-primary/10 relative",
            isEditing && "ring-2 ring-primary/20"
          )}>
            <div className="flex items-start gap-2">
              <div className="flex-1">
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleDraftPitch}
                    disabled={isDraftingPitch}
                    className="shrink-0 h-8 w-8"
                  >
                    {isDraftingPitch ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-primary" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draft Pitch</p>
                </TooltipContent>
              </Tooltip>
            </div>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleScore}
                disabled={isScoring || isAILoading}
                className="gap-1.5"
              >
                {isScoring ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                {isScoring ? "Scoring..." : idea.ai_score !== null ? "Re-score" : "Score"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutofill}
                disabled={isAILoading}
                className="gap-1.5"
              >
                {isAILoading && !isScoring ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isAILoading && !isScoring ? "Generating..." : (idea.core_problem && idea.core_value_proposition) ? "Re-autofill" : "Autofill"}
              </Button>
            </div>
          </div>

          {/* AI Score - Prominent display */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">AI Score</span>
                <div className="text-3xl font-bold text-primary mt-1">
                  {idea.ai_score !== null ? idea.ai_score.toFixed(1) : "—"}<span className="text-lg text-muted-foreground font-normal">/10</span>
                </div>
              </div>
              {idea.ai_score !== null && (
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  idea.ai_score >= 7 ? "bg-status-building/20 text-status-building" :
                  idea.ai_score >= 5 ? "bg-status-shortlisted/20 text-status-shortlisted" :
                  "bg-status-paused/20 text-status-paused"
                )}>
                  {idea.ai_score >= 7 ? "Strong" : idea.ai_score >= 5 ? "Moderate" : "Needs Work"}
                </div>
              )}
            </div>
          </div>

          {/* AI Reasoning */}
          {idea.ai_reasoning && (
            <div className="bg-card rounded-xl border border-border p-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">AI Reasoning</span>
              <p className="text-sm text-foreground mt-2 leading-relaxed">{idea.ai_reasoning}</p>
            </div>
          )}

          {/* Status, Sprint Fit, Difficulty, Priority grid */}
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
              <span className="text-xs text-muted-foreground">Sprint Fit</span>
              <div className="mt-1">
                {isEditing ? (
                  <select
                    defaultValue={idea.sprint_fit || ""}
                    onChange={(e) => handleFieldUpdate("sprint_fit", parseInt(e.target.value) || null)}
                    className="w-full text-sm font-medium bg-transparent border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Not set</option>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <option key={val} value={val}>{val}/5</option>
                    ))}
                  </select>
                ) : (
                  <span className="font-medium text-foreground">
                    {idea.sprint_fit ? `${idea.sprint_fit}/5` : "—"}
                  </span>
                )}
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

      {/* AI Autofill Preview Dialog */}
      <AutofillPreviewDialog
        open={showAutofillDialog}
        onOpenChange={setShowAutofillDialog}
        suggestions={autofillSuggestions}
        currentValues={{
          core_problem: idea?.core_problem,
          core_value_proposition: idea?.core_value_proposition,
          core_loop: idea?.core_loop || undefined,
          mvp_shape: idea?.mvp_shape || undefined,
          target_user: idea?.target_user || undefined,
          difficulty: idea?.difficulty || undefined,
          priority: idea?.priority || undefined,
          sprint_fit: idea?.sprint_fit || undefined,
        }}
        onApply={handleApplyAutofill}
      />

      {/* AI Name Suggestions Dialog */}
      <Dialog open={showNameSuggestions} onOpenChange={setShowNameSuggestions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              AI Name Suggestions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {nameSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelectName(suggestion.name)}
                className="w-full text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <p className="font-semibold text-foreground">{suggestion.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Pitch Suggestions Dialog */}
      <Dialog open={showPitchSuggestions} onOpenChange={setShowPitchSuggestions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Draft Pitch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {pitchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelectPitch(suggestion.pitch)}
                className="w-full text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <p className="text-foreground leading-relaxed">{suggestion.pitch}</p>
                <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wide">{suggestion.tone}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
