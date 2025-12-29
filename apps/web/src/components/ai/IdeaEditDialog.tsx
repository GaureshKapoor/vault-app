import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Save } from "lucide-react";
import { GeneratedIdea } from "@/hooks/useIdeaGeneration";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IdeaEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idea: GeneratedIdea | null;
  onSaved: (ideaId: string, savedDbId: string) => void;
}

interface FormData {
  title: string;
  category: string;
  main_idea: string;
  core_problem: string;
  core_value_proposition: string;
  core_loop: string;
  mvp_shape: string;
  target_user: string;
}

export function IdeaEditDialog({
  open,
  onOpenChange,
  idea,
  onSaved,
}: IdeaEditDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    main_idea: "",
    core_problem: "",
    core_value_proposition: "",
    core_loop: "",
    mvp_shape: "",
    target_user: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const { toast } = useToast();

  // Initialize form when idea changes
  useEffect(() => {
    if (idea) {
      setFormData({
        title: idea.title,
        category: idea.category,
        main_idea: idea.description,
        core_problem: idea.fullDetails?.core_problem || "",
        core_value_proposition: idea.fullDetails?.core_value_proposition || "",
        core_loop: idea.fullDetails?.core_loop || "",
        mvp_shape: idea.fullDetails?.mvp_shape || "",
        target_user: idea.fullDetails?.target_user || "",
      });
    }
  }, [idea]);

  if (!idea) return null;

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAutofill = async () => {
    setIsAutofilling(true);

    try {
      const { data, error } = await supabase.functions.invoke("autofill-idea", {
        body: {
          title: formData.title,
          category: formData.category,
          main_idea: formData.main_idea,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setFormData(prev => ({
        ...prev,
        core_problem: data.core_problem || prev.core_problem,
        core_value_proposition: data.core_value_proposition || prev.core_value_proposition,
        core_loop: data.core_loop || prev.core_loop,
        mvp_shape: data.mvp_shape || prev.mvp_shape,
        target_user: data.target_user || prev.target_user,
      }));

      toast({
        title: "Autofilled",
        description: "Missing fields have been generated.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Autofill failed",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsAutofilling(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "Please enter a title for your idea.",
      });
      return;
    }

    if (!formData.core_problem.trim() || !formData.core_value_proposition.trim()) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Core Problem and Value Proposition are required.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ideaData = {
        user_id: user.id,
        title: formData.title.trim(),
        category: formData.category || null,
        description: formData.main_idea.trim() || null,
        main_idea: formData.main_idea.trim() || null,
        status: "idea" as const,
        core_problem: formData.core_problem.trim(),
        core_value_proposition: formData.core_value_proposition.trim(),
        core_loop: formData.core_loop.trim() || null,
        mvp_shape: formData.mvp_shape.trim() || null,
        target_user: formData.target_user.trim() || null,
        difficulty: idea.fullDetails?.difficulty || idea.difficulty,
        priority: idea.fullDetails?.priority || null,
        sprint_fit: idea.fullDetails?.sprint_fit || null,
      };

      const { data, error: insertError } = await supabase
        .from("ideas")
        .insert(ideaData)
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      toast({
        title: "Idea saved!",
        description: "Your idea has been added to your vault.",
      });

      onSaved(idea.id, data.id);
      onOpenChange(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasMissingDetails = !formData.core_problem || !formData.core_value_proposition;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Idea Before Saving</DialogTitle>
          <DialogDescription>
            Refine the details before adding this idea to your vault.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateField("category", value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Idea */}
          <div className="space-y-2">
            <Label htmlFor="main_idea">Main Idea (One-liner)</Label>
            <Textarea
              id="main_idea"
              value={formData.main_idea}
              onChange={(e) => updateField("main_idea", e.target.value)}
              placeholder="A brief description of what this idea is about..."
              className="min-h-[60px]"
            />
          </div>

          {/* Autofill Button */}
          {hasMissingDetails && (
            <Button
              variant="outline"
              onClick={handleAutofill}
              disabled={isAutofilling}
              className="w-full"
            >
              {isAutofilling ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Autofill Missing Details with AI
            </Button>
          )}

          {/* Core Problem */}
          <div className="space-y-2">
            <Label htmlFor="core_problem">Core Problem *</Label>
            <Textarea
              id="core_problem"
              value={formData.core_problem}
              onChange={(e) => updateField("core_problem", e.target.value)}
              placeholder="What specific problem does this solve?"
              className="min-h-[80px]"
            />
          </div>

          {/* Value Proposition */}
          <div className="space-y-2">
            <Label htmlFor="core_value_proposition">Value Proposition *</Label>
            <Textarea
              id="core_value_proposition"
              value={formData.core_value_proposition}
              onChange={(e) => updateField("core_value_proposition", e.target.value)}
              placeholder="What unique value does this provide to users?"
              className="min-h-[80px]"
            />
          </div>

          {/* Core Loop */}
          <div className="space-y-2">
            <Label htmlFor="core_loop">Core Loop</Label>
            <Textarea
              id="core_loop"
              value={formData.core_loop}
              onChange={(e) => updateField("core_loop", e.target.value)}
              placeholder="User does X → Gets Y → Returns for Z"
              className="min-h-[60px]"
            />
          </div>

          {/* MVP Shape */}
          <div className="space-y-2">
            <Label htmlFor="mvp_shape">MVP Shape</Label>
            <Textarea
              id="mvp_shape"
              value={formData.mvp_shape}
              onChange={(e) => updateField("mvp_shape", e.target.value)}
              placeholder="What's the simplest version that could work?"
              className="min-h-[60px]"
            />
          </div>

          {/* Target User */}
          <div className="space-y-2">
            <Label htmlFor="target_user">Target User</Label>
            <Textarea
              id="target_user"
              value={formData.target_user}
              onChange={(e) => updateField("target_user", e.target.value)}
              placeholder="Who is the ideal user for this?"
              className="min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Idea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
