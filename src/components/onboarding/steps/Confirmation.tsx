import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmationProps {
  onComplete: () => void;
  isLoading: boolean;
}

export function Confirmation({ onComplete, isLoading }: ConfirmationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto"
      >
        <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
      </motion.div>

      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Your Vault is ready.
        </h2>
        <p className="text-muted-foreground">
          We've added your first idea. You can refine it anytime.
        </p>
      </div>

      <Button
        variant="hero"
        size="xl"
        onClick={onComplete}
        disabled={isLoading}
        className="min-w-[200px]"
      >
        {isLoading ? (
          "Setting up..."
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Enter Vault
          </>
        )}
      </Button>
    </motion.div>
  );
}