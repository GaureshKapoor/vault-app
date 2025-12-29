import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Save,
  Edit,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GeneratedIdea } from "@/hooks/useIdeaGeneration";

interface GeneratedIdeaCardProps {
  idea: GeneratedIdea;
  onQuickSave: (id: string) => void;
  onEditSave: (id: string) => void;
  onAutofill: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

export function GeneratedIdeaCard({
  idea,
  onQuickSave,
  onEditSave,
  onAutofill,
  onRemove,
  onToggleExpand,
}: GeneratedIdeaCardProps) {
  const isSaved = !!idea.savedId;
  const hasFullDetails = !!idea.fullDetails;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "bg-card border border-border rounded-xl p-4 space-y-3",
        isSaved && "border-green-500/50 bg-green-500/5"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{idea.title}</h3>
            {isSaved && (
              <Check className="w-4 h-4 text-green-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {idea.category}
            </Badge>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    level <= idea.difficulty
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  )}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                Difficulty
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onRemove(idea.id)}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          disabled={isSaved}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2">
        {idea.description}
      </p>

      {/* Expanded Details */}
      <AnimatePresence>
        {idea.isExpanded && hasFullDetails && idea.fullDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-border space-y-3">
              <DetailRow label="Core Problem" value={idea.fullDetails.core_problem} />
              <DetailRow label="Value Prop" value={idea.fullDetails.core_value_proposition} />
              <DetailRow label="Core Loop" value={idea.fullDetails.core_loop} />
              <DetailRow label="MVP Shape" value={idea.fullDetails.mvp_shape} />
              <DetailRow label="Target User" value={idea.fullDetails.target_user} />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Priority: {idea.fullDetails.priority}/5</span>
                <span>Sprint Fit: {idea.fullDetails.sprint_fit}/5</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {!isSaved && (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={() => onQuickSave(idea.id)}
              disabled={idea.isSaving}
              className="h-8"
            >
              {idea.isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1" />
              )}
              Quick Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditSave(idea.id)}
              disabled={idea.isSaving}
              className="h-8"
            >
              <Edit className="w-3.5 h-3.5 mr-1" />
              Edit & Save
            </Button>
          </>
        )}

        {!hasFullDetails && !isSaved && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAutofill(idea.id)}
            disabled={idea.isAutofilling}
            className="h-8"
          >
            {idea.isAutofilling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1" />
            )}
            Autofill
          </Button>
        )}

        {hasFullDetails && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleExpand(idea.id)}
            className="h-8 ml-auto"
          >
            {idea.isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 mr-1" />
                More
              </>
            )}
          </Button>
        )}

        {isSaved && (
          <a
            href={`/idea/${idea.savedId}`}
            className="text-sm text-primary hover:underline ml-auto"
          >
            View Idea →
          </a>
        )}
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
