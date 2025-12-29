import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sparkles, Check } from "lucide-react";
import type { AutofillResult } from "@/hooks/useAIOperations";

interface AutofillPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: AutofillResult | null;
  currentValues?: Partial<AutofillResult>;
  onApply: (selectedFields: Partial<AutofillResult>) => void;
}

interface FieldConfig {
  key: keyof AutofillResult;
  label: string;
  isNumeric?: boolean;
}

const FIELDS: FieldConfig[] = [
  { key: "description", label: "Description" },
  { key: "core_problem", label: "Core Problem" },
  { key: "core_value_proposition", label: "Value Proposition" },
  { key: "core_loop", label: "Core Loop" },
  { key: "mvp_shape", label: "MVP Shape" },
  { key: "target_user", label: "Target User" },
  { key: "difficulty", label: "Difficulty", isNumeric: true },
  { key: "priority", label: "Priority", isNumeric: true },
  { key: "sprint_fit", label: "Sprint Fit", isNumeric: true },
];

export function AutofillPreviewDialog({
  open,
  onOpenChange,
  suggestions,
  currentValues = {},
  onApply,
}: AutofillPreviewDialogProps) {
  const [selectedFields, setSelectedFields] = useState<Set<keyof AutofillResult>>(
    new Set(FIELDS.map(f => f.key))
  );

  if (!suggestions) return null;

  const toggleField = (field: keyof AutofillResult) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(field)) {
      newSelected.delete(field);
    } else {
      newSelected.add(field);
    }
    setSelectedFields(newSelected);
  };

  const selectAll = () => {
    setSelectedFields(new Set(FIELDS.map(f => f.key)));
  };

  const selectNone = () => {
    setSelectedFields(new Set());
  };

  const handleApply = () => {
    const fieldsToApply: Partial<AutofillResult> = {};
    selectedFields.forEach(field => {
      (fieldsToApply as any)[field] = suggestions[field];
    });
    onApply(fieldsToApply);
    onOpenChange(false);
  };

  const formatValue = (value: string | number, isNumeric?: boolean): string => {
    if (isNumeric && typeof value === "number") {
      return `${value}/5`;
    }
    return String(value);
  };

  const hasCurrentValue = (field: keyof AutofillResult): boolean => {
    const current = currentValues[field];
    return current !== undefined && current !== null && current !== "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Suggestions
          </DialogTitle>
          <DialogDescription>
            Review the AI-generated suggestions below. Select which fields to apply.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={selectNone}>
            Select None
          </Button>
        </div>

        <div className="space-y-4">
          {FIELDS.map(({ key, label, isNumeric }) => {
            const suggestedValue = suggestions[key];
            const currentValue = currentValues[key];
            const isSelected = selectedFields.has(key);
            const hasCurrent = hasCurrentValue(key);

            return (
              <div
                key={key}
                className={`p-3 rounded-lg border transition-colors ${
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={key}
                    checked={isSelected}
                    onCheckedChange={() => toggleField(key)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={key}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {label}
                      {hasCurrent && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (has existing value)
                        </span>
                      )}
                    </Label>

                    {hasCurrent && (
                      <div className="mt-1 text-xs text-muted-foreground line-through">
                        {formatValue(currentValue as string | number, isNumeric)}
                      </div>
                    )}

                    <div className="mt-1 text-sm">
                      {formatValue(suggestedValue, isNumeric)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={selectedFields.size === 0}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Apply {selectedFields.size} Field{selectedFields.size !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
