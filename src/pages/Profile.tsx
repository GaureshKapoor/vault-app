import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Briefcase, Target, Clock, Settings, LogOut, Trash2, Sun, Moon, Pencil, X, Check, IdCard, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Cute avatar options - emojis and fun icons
const AVATAR_OPTIONS = [
  { id: "rocket", emoji: "🚀", label: "Rocket" },
  { id: "sparkles", emoji: "✨", label: "Sparkles" },
  { id: "lightning", emoji: "⚡", label: "Lightning" },
  { id: "fire", emoji: "🔥", label: "Fire" },
  { id: "star", emoji: "⭐", label: "Star" },
  { id: "rainbow", emoji: "🌈", label: "Rainbow" },
  { id: "unicorn", emoji: "🦄", label: "Unicorn" },
  { id: "alien", emoji: "👽", label: "Alien" },
  { id: "robot", emoji: "🤖", label: "Robot" },
  { id: "astronaut", emoji: "🧑‍🚀", label: "Astronaut" },
  { id: "ninja", emoji: "🥷", label: "Ninja" },
  { id: "wizard", emoji: "🧙", label: "Wizard" },
  { id: "cat", emoji: "🐱", label: "Cat" },
  { id: "dog", emoji: "🐶", label: "Dog" },
  { id: "fox", emoji: "🦊", label: "Fox" },
  { id: "panda", emoji: "🐼", label: "Panda" },
  { id: "penguin", emoji: "🐧", label: "Penguin" },
  { id: "owl", emoji: "🦉", label: "Owl" },
  { id: "butterfly", emoji: "🦋", label: "Butterfly" },
  { id: "dragon", emoji: "🐉", label: "Dragon" },
];

const DEFAULT_AVATAR = "rocket";

// Options for select fields
const USER_TYPE_OPTIONS = [
  { id: "student", label: "Student / Learning" },
  { id: "solo_builder", label: "Solo builder" },
  { id: "founder", label: "Founder / Indie hacker" },
  { id: "creator", label: "Creator / Writer / Designer" },
  { id: "explorer", label: "Explorer" },
];

const EXPERIENCE_OPTIONS = [
  { id: "beginner", label: "Just getting started" },
  { id: "some", label: "Some experience" },
  { id: "experienced", label: "Very experienced" },
];

const WEEKLY_HOURS_OPTIONS = [
  { id: "less_2", label: "Less than 2 hours/week" },
  { id: "2_5", label: "2-5 hours/week" },
  { id: "5_10", label: "5-10 hours/week" },
  { id: "10_20", label: "10-20 hours/week" },
  { id: "all_in", label: "All in" },
];

const GOAL_OPTIONS = [
  { id: "learn", label: "Learn how to build" },
  { id: "decide", label: "Decide what to work on" },
  { id: "ship", label: "Ship MVPs faster" },
  { id: "organize", label: "Organize ideas" },
  { id: "explore", label: "Explore startup ideas" },
  { id: "action", label: "Turn thoughts into action" },
];

interface ProfileData {
  display_name: string | null;
  email: string | null;
  user_type: string | null;
  building_experience: string | null;
  goals: string[] | null;
  weekly_hours: string | null;
  notifications_enabled: boolean | null;
  avatar_url: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
}

interface EditedData {
  display_name: string;
  user_type: string;
  building_experience: string;
  goals: string[];
  weekly_hours: string;
  avatar_url: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: null,
    email: null,
    user_type: null,
    building_experience: null,
    goals: null,
    weekly_hours: null,
    notifications_enabled: true,
    avatar_url: null,
    subscription_tier: null,
    subscription_status: null,
    trial_ends_at: null,
  });
  const [editedData, setEditedData] = useState<EditedData>({
    display_name: "",
    user_type: "",
    building_experience: "",
    goals: [],
    weekly_hours: "",
    avatar_url: DEFAULT_AVATAR,
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("vault-theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("vault-theme", "dark");
    }

    fetchProfile();

    // Listen for auth changes (e.g., sign out in another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email, user_type, building_experience, goals, weekly_hours, notifications_enabled, avatar_url, subscription_tier, subscription_status, trial_ends_at")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setProfile({
        display_name: data.display_name,
        email: data.email || user.email || null,
        user_type: data.user_type,
        building_experience: data.building_experience,
        goals: data.goals,
        weekly_hours: data.weekly_hours,
        notifications_enabled: data.notifications_enabled ?? true,
        avatar_url: data.avatar_url,
        subscription_tier: data.subscription_tier,
        subscription_status: data.subscription_status,
        trial_ends_at: data.trial_ends_at,
      });
      setEditedData({
        display_name: data.display_name || "",
        user_type: data.user_type || "",
        building_experience: data.building_experience || "",
        goals: data.goals || [],
        weekly_hours: data.weekly_hours || "",
        avatar_url: data.avatar_url || DEFAULT_AVATAR,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("vault-theme", newTheme ? "dark" : "light");
  };

  const handleStartEditing = () => {
    setEditedData({
      display_name: profile.display_name || "",
      user_type: profile.user_type || "",
      building_experience: profile.building_experience || "",
      goals: profile.goals || [],
      weekly_hours: profile.weekly_hours || "",
      avatar_url: profile.avatar_url || DEFAULT_AVATAR,
    });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditedData({
      display_name: profile.display_name || "",
      user_type: profile.user_type || "",
      building_experience: profile.building_experience || "",
      goals: profile.goals || [],
      weekly_hours: profile.weekly_hours || "",
      avatar_url: profile.avatar_url || DEFAULT_AVATAR,
    });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: editedData.display_name || null,
          user_type: editedData.user_type || null,
          building_experience: editedData.building_experience || null,
          goals: editedData.goals.length > 0 ? editedData.goals : null,
          weekly_hours: editedData.weekly_hours || null,
          avatar_url: editedData.avatar_url || DEFAULT_AVATAR,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => ({
        ...prev,
        display_name: editedData.display_name || null,
        user_type: editedData.user_type || null,
        building_experience: editedData.building_experience || null,
        goals: editedData.goals.length > 0 ? editedData.goals : null,
        weekly_hours: editedData.weekly_hours || null,
        avatar_url: editedData.avatar_url || DEFAULT_AVATAR,
      }));
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ notifications_enabled: enabled })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, notifications_enabled: enabled }));
    } catch (error) {
      console.error("Error updating notifications:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    try {
      // Get current session to pass auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No active session");
      }

      console.log("Calling delete-user with token:", session.access_token.substring(0, 20) + "...");

      // Call edge function directly with fetch for better control
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`;
      console.log("Function URL:", functionUrl);

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Delete user response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      // Sign out after successful deletion
      await supabase.auth.signOut();

      toast({
        title: "Account deleted",
        description: "Your account has been permanently removed.",
      });
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: "Please contact support.",
      });
    }
  };

  const handleSelectAvatar = async (avatarId: string) => {
    // If in edit mode, just update editedData
    if (isEditing) {
      setEditedData((prev) => ({ ...prev, avatar_url: avatarId }));
      setShowAvatarPicker(false);
      return;
    }

    // If not in edit mode, save directly to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarId })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, avatar_url: avatarId }));
      setShowAvatarPicker(false);
      toast({
        title: "Avatar updated",
        description: "Looking good!",
      });
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast({
        variant: "destructive",
        title: "Failed to update avatar",
        description: "Please try again.",
      });
    }
  };

  const handleToggleGoal = (goalId: string) => {
    setEditedData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter((g) => g !== goalId)
        : [...prev.goals, goalId],
    }));
  };

  const getAvatarEmoji = (avatarId: string | null) => {
    const avatar = AVATAR_OPTIONS.find((a) => a.id === avatarId);
    return avatar?.emoji || AVATAR_OPTIONS.find((a) => a.id === DEFAULT_AVATAR)?.emoji || "🚀";
  };

  const formatUserType = (type: string | null) => {
    if (!type) return "Not set";
    const option = USER_TYPE_OPTIONS.find((o) => o.id === type);
    return option?.label || type;
  };

  const formatExperience = (exp: string | null) => {
    if (!exp) return "Not set";
    const option = EXPERIENCE_OPTIONS.find((o) => o.id === exp);
    return option?.label || exp;
  };

  const formatWeeklyHours = (hours: string | null) => {
    if (!hours) return "Not set";
    const option = WEEKLY_HOURS_OPTIONS.find((o) => o.id === hours);
    return option?.label || hours;
  };

  const formatGoals = (goals: string[] | null) => {
    if (!goals || goals.length === 0) return "Not set";
    const formatted = goals.map((g) => {
      const option = GOAL_OPTIONS.find((o) => o.id === g);
      return option?.label || g;
    });
    if (formatted.length <= 2) {
      return formatted.join(", ");
    }
    return formatted.slice(0, 2).join(", ") + ` +${formatted.length - 2} more`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartEditing}
              className="gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEditing}
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Avatar & Name */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center text-4xl transition-all cursor-pointer hover:scale-105 hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background"
          >
            {getAvatarEmoji(isEditing ? editedData.avatar_url : profile.avatar_url)}
          </button>
          <div className="flex-1">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                {(isEditing ? editedData.display_name : profile.display_name) || "Builder"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {formatUserType(profile.user_type)}
              </p>
              {isEditing ? (
                <p className="text-xs text-muted-foreground">Update your name below</p>
              ) : (
                <p className="text-xs text-muted-foreground">Tap avatar to change</p>
              )}
            </div>
          </div>
        </motion.section>

        {/* Account Info */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Account</h3>
          <div className="space-y-2">
            {/* Display Name */}
            {isEditing ? (
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IdCard className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <span className="text-xs text-muted-foreground">Display name</span>
                  <Input
                    value={editedData.display_name}
                    onChange={(e) => setEditedData((prev) => ({ ...prev, display_name: e.target.value }))}
                    placeholder="What should we call you?"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IdCard className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">Name</span>
                  <p className="font-medium text-foreground truncate">{profile.display_name || "Not set"}</p>
                </div>
              </div>
            )}

            {/* Email - not editable */}
            <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground">Email</span>
                <p className="font-medium text-foreground truncate">{profile.email || "Not set"}</p>
              </div>
            </div>

            {/* User Type */}
            {isEditing ? (
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">I am a...</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {USER_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setEditedData((prev) => ({ ...prev, user_type: option.id }))}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        editedData.user_type === option.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">I am a...</span>
                  <p className="font-medium text-foreground truncate">{formatUserType(profile.user_type)}</p>
                </div>
              </div>
            )}

            {/* Experience */}
            {isEditing ? (
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Experience</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setEditedData((prev) => ({ ...prev, building_experience: option.id }))}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        editedData.building_experience === option.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">Experience</span>
                  <p className="font-medium text-foreground truncate">{formatExperience(profile.building_experience)}</p>
                </div>
              </div>
            )}

            {/* Goals */}
            {isEditing ? (
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Goals (select multiple)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleToggleGoal(option.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        editedData.goals.includes(option.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">Goals</span>
                  <p className="font-medium text-foreground truncate">{formatGoals(profile.goals)}</p>
                </div>
              </div>
            )}

            {/* Weekly Hours */}
            {isEditing ? (
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Weekly Commitment</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {WEEKLY_HOURS_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setEditedData((prev) => ({ ...prev, weekly_hours: option.id }))}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        editedData.weekly_hours === option.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">Weekly Commitment</span>
                  <p className="font-medium text-foreground truncate">{formatWeeklyHours(profile.weekly_hours)}</p>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* Subscription */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Subscription</h3>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                {profile.subscription_tier === "pro" ? (
                  <Sparkles className="w-5 h-5 text-primary" />
                ) : (
                  <CreditCard className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground capitalize">
                  {profile.subscription_tier || "Free"} Plan
                </span>
                <p className="text-xs text-muted-foreground">
                  {profile.subscription_status === "trial" && profile.trial_ends_at
                    ? `Trial ends ${new Date(profile.trial_ends_at).toLocaleDateString()}`
                    : profile.subscription_status === "active"
                    ? "Active subscription"
                    : "Free tier"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/pricing")}
              >
                {profile.subscription_tier === "pro" ? "Manage" : "Upgrade"}
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Settings */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Preferences</h3>
          <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
            {/* Theme Toggle */}
            <div className="px-4 py-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                {isDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">Dark Mode</span>
                <p className="text-xs text-muted-foreground">{isDarkMode ? "Dark theme" : "Light theme"}</p>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
            </div>

            {/* Notifications */}
            <div className="px-4 py-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">Notifications</span>
                <p className="text-xs text-muted-foreground">{profile.notifications_enabled ? "Enabled" : "Disabled"}</p>
              </div>
              <Switch
                checked={profile.notifications_enabled ?? true}
                onCheckedChange={handleToggleNotifications}
              />
            </div>
          </div>
        </motion.section>

        {/* Actions */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all your ideas. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.section>
      </div>

      {/* Avatar Picker Dialog */}
      <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose your avatar</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-3 py-4">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => handleSelectAvatar(avatar.id)}
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 ${
                  (isEditing ? editedData.avatar_url : profile.avatar_url) === avatar.id
                    ? "bg-primary/20 ring-2 ring-primary"
                    : "bg-muted hover:bg-muted/80"
                }`}
                title={avatar.label}
              >
                {avatar.emoji}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
