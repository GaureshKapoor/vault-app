import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VaultLogoWithText } from "@/components/icons/VaultLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type PlanType = "free" | "pro";

interface Feature {
  name: string;
  free: string | boolean;
  pro: string | boolean;
}

const features: Feature[] = [
  { name: "Ideas stored", free: "10", pro: "Unlimited" },
  { name: "AI refinement", free: "Basic", pro: "Advanced" },
  { name: "Scoring & insights", free: false, pro: true },
  { name: "Export ideas", free: false, pro: true },
  { name: "Priority support", free: false, pro: true },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("pro");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Update profile with subscription info
      // Free users get "active" status, Pro users get "trial" (until Stripe is set up)
      const updateData: Record<string, unknown> = {
        subscription_tier: selectedPlan,
        subscription_status: selectedPlan === "pro" ? "trial" : "active",
      };

      // Add trial end date for pro plan
      if (selectedPlan === "pro") {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);
        updateData.trial_ends_at = trialEnd.toISOString();
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;

      navigate("/onboarding/setup");
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <VaultLogoWithText />
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="pt-28 md:pt-32 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Choose your plan
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Start free or unlock the full Vault experience
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Free Plan */}
            <button
              onClick={() => setSelectedPlan("free")}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedPlan === "free"
                  ? "border-primary bg-accent/50"
                  : "border-border hover:border-primary/30 bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-foreground">Free</h2>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedPlan === "free"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {selectedPlan === "free" && (
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  )}
                </div>
              </div>
              <p className="text-xl font-bold text-foreground mb-1">
                $0<span className="text-xs font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-muted-foreground text-xs">
                For casual explorers
              </p>
            </button>

            {/* Pro Plan */}
            <button
              onClick={() => setSelectedPlan("pro")}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedPlan === "pro"
                  ? "border-primary bg-accent/50"
                  : "border-border hover:border-primary/30 bg-card"
              }`}
            >
              {/* Trial Badge */}
              <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full gradient-hero text-primary-foreground text-[10px] font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                7-day trial
              </div>
              
              <div className="flex items-center justify-between mb-2 mt-1">
                <h2 className="text-base font-bold text-foreground">Pro</h2>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedPlan === "pro"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {selectedPlan === "pro" && (
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  )}
                </div>
              </div>
              <p className="text-xl font-bold text-foreground mb-1">
                $9<span className="text-xs font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-muted-foreground text-xs">
                For serious builders
              </p>
            </button>
          </div>

          {/* Feature Comparison */}
          <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
            <div className="grid grid-cols-3 gap-2 px-3 py-2 bg-muted/50 border-b border-border">
              <div className="text-xs font-semibold text-foreground">Feature</div>
              <div className="text-xs font-semibold text-center text-foreground">Free</div>
              <div className="text-xs font-semibold text-center text-foreground">Pro</div>
            </div>
            {features.map((feature, index) => (
              <div
                key={feature.name}
                className={`grid grid-cols-3 gap-2 px-3 py-2.5 ${
                  index < features.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="text-xs text-foreground">{feature.name}</div>
                <div className="text-xs text-center">
                  {typeof feature.free === "boolean" ? (
                    feature.free ? (
                      <Check className="w-3.5 h-3.5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-muted-foreground mx-auto" />
                    )
                  ) : (
                    <span className="text-muted-foreground">{feature.free}</span>
                  )}
                </div>
                <div className="text-xs text-center">
                  {typeof feature.pro === "boolean" ? (
                    feature.pro ? (
                      <Check className="w-3.5 h-3.5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-muted-foreground mx-auto" />
                    )
                  ) : (
                    <span className="text-primary font-medium">{feature.pro}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              variant="hero"
              size="lg"
              onClick={handleContinue}
              disabled={isLoading}
              className="w-full max-w-xs"
            >
              {isLoading ? "Loading..." : "Continue"}
            </Button>
            {selectedPlan === "pro" && (
              <p className="text-xs text-muted-foreground mt-3">
                No credit card required. Cancel anytime.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}