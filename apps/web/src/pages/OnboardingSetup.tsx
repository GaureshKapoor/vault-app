import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { VaultLogoWithText } from "@/components/icons/VaultLogo";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { WhoAreYou } from "@/components/onboarding/steps/WhoAreYou";
import { Experience } from "@/components/onboarding/steps/Experience";
import { Goals } from "@/components/onboarding/steps/Goals";
import { TimeCommitment } from "@/components/onboarding/steps/TimeCommitment";
import { Preferences } from "@/components/onboarding/steps/Preferences";
import { FirstIdea } from "@/components/onboarding/steps/FirstIdea";
import { Confirmation } from "@/components/onboarding/steps/Confirmation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TOTAL_STEPS = 7;

interface OnboardingData {
  displayName: string;
  userType: string;
  buildingExperience: string;
  toolsUsed: string[];
  otherTool: string;
  goals: string[];
  weeklyHours: string;
  theme: "light" | "dark";
  notifications: boolean;
  ideaName: string;
  ideaCategory: string;
  ideaDescription: string;
}

export default function OnboardingSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    displayName: "",
    userType: "",
    buildingExperience: "",
    toolsUsed: [],
    otherTool: "",
    goals: [],
    weeklyHours: "",
    theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
    notifications: true,
    ideaName: "",
    ideaCategory: "",
    ideaDescription: "",
  });

  // Check auth/subscription state on mount to avoid redirect loops
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/auth", { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, onboarding_completed_at")
        .eq("user_id", session.user.id)
        .single();

      if (!profile?.subscription_status || profile.subscription_status === "none") {
        navigate("/pricing", { replace: true });
        return;
      }

      if (profile?.onboarding_completed_at) {
        navigate("/home", { replace: true });
        return;
      }

      if (isMounted) {
        setAuthReady(true);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth", { replace: true });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Apply theme changes immediately
  useEffect(() => {
    if (data.theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("vault-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("vault-theme", "light");
    }
  }, [data.theme]);

  const updateData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!data.userType && data.displayName.trim().length > 0;
      case 1:
        return !!data.buildingExperience;
      case 2:
        return data.goals.length > 0;
      case 3:
        return !!data.weeklyHours;
      case 4:
        return true; // Preferences always valid
      case 5:
        return !!data.ideaName; // Category now optional, only name needed to create idea
      case 6:
        return true;
      default:
        return false;
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      // Go back to pricing on first step
      navigate("/pricing");
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async (skip: boolean = false) => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update profile with onboarding data
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: data.displayName || null,
          user_type: data.userType,
          building_experience: data.buildingExperience,
          tools_used: data.toolsUsed,
          goals: data.goals,
          weekly_hours: data.weeklyHours,
          notifications_enabled: data.notifications,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // If skipping or no idea name, just go to home
      if (skip || !data.ideaName) {
        toast({
          title: "Welcome to Vault!",
          description: "Your workspace is ready. Let's build something great.",
        });
        navigate("/home", { replace: true });
        return;
      }

      // Create the first idea and navigate to its detail page
      const { data: newIdea, error: ideaError } = await supabase
        .from("ideas")
        .insert({
          user_id: user.id,
          title: data.ideaName,
          description: data.ideaDescription || null,
          category: data.ideaCategory || null,
          core_problem: "To be defined",
          core_value_proposition: "To be defined",
          core_loop: "To be defined",
          status: "idea",
        })
        .select()
        .single();

      if (ideaError) throw ideaError;

      toast({
        title: "Welcome to Vault!",
        description: "Your first idea has been created.",
      });

      // Navigate to the new idea's detail page with fromOnboarding flag
      navigate(`/idea/${newIdea.id}?fromOnboarding=true`, { replace: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    handleComplete(true);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <WhoAreYou
            value={data.userType}
            onChange={(v) => updateData("userType", v)}
            name={data.displayName}
            onNameChange={(v) => updateData("displayName", v)}
          />
        );
      case 1:
        return (
          <Experience
            experience={data.buildingExperience}
            tools={data.toolsUsed}
            onExperienceChange={(v) => updateData("buildingExperience", v)}
            onToolsChange={(v) => updateData("toolsUsed", v)}
          />
        );
      case 2:
        return (
          <Goals
            value={data.goals}
            otherGoal={data.otherTool}
            onChange={(v) => updateData("goals", v)}
            onOtherGoalChange={(v) => updateData("otherTool", v)}
          />
        );
      case 3:
        return (
          <TimeCommitment
            value={data.weeklyHours}
            onChange={(v) => updateData("weeklyHours", v)}
          />
        );
      case 4:
        return (
          <Preferences
            theme={data.theme}
            notifications={data.notifications}
            onThemeChange={(v) => updateData("theme", v)}
            onNotificationsChange={(v) => updateData("notifications", v)}
          />
        );
      case 5:
        return (
          <FirstIdea
            name={data.ideaName}
            category={data.ideaCategory}
            description={data.ideaDescription}
            onNameChange={(v) => updateData("ideaName", v)}
            onCategoryChange={(v) => updateData("ideaCategory", v)}
            onDescriptionChange={(v) => updateData("ideaDescription", v)}
          />
        );
      case 6:
        return (
          <Confirmation onComplete={() => handleComplete(false)} isLoading={isLoading} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <VaultLogoWithText />
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      {currentStep < TOTAL_STEPS - 1 && (
        <footer className="p-4 pb-8 border-t border-border">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            {/* Skip button only on FirstIdea step (step 5) */}
            {currentStep === 5 && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isLoading}
                className="text-muted-foreground"
              >
                Skip
              </Button>
            )}
            
            <Button
              variant="hero"
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
