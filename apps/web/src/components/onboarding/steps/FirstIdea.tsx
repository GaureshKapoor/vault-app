import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";

interface FirstIdeaProps {
  name: string;
  category: string;
  description: string;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function FirstIdea({
  name,
  category,
  description,
  onNameChange,
  onCategoryChange,
  onDescriptionChange,
}: FirstIdeaProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Your first idea
        </h2>
        <p className="text-muted-foreground">
          Let's start with one idea you have right now. It doesn't need to be perfect.
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        {/* Idea Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            What's the working name of your idea?
          </label>
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="AI meal planner, personal finance tracker, etc."
            className="h-12"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            What category best fits this idea?
          </label>
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            In a few sentences, what does this idea do?
          </label>
          <p className="text-xs text-muted-foreground">
            Who is it for? What problem does it solve?
          </p>
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe your idea..."
            className="min-h-[100px] resize-none"
          />
        </div>
      </div>
    </motion.div>
  );
}