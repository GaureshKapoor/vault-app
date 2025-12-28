import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { MoreHorizontal, ChevronRight, Newspaper, Share, Plus, Archive, Loader2, ChevronDown, X, Trash2, CheckSquare, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, STATUS_OPTIONS, IdeaStatus as StatusBadgeStatus } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VaultLogo, VaultLogoWithText } from "@/components/icons/VaultLogo";
import { CATEGORIES_WITH_ALL } from "@/lib/categories";
import { PullToRefresh } from "@/components/PullToRefresh";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/checkbox";

type IdeaStatus = "idea" | "shortlisted" | "building" | "paused" | "shipped" | "archived";

interface Idea {
  id: string;
  title: string;
  description: string | null;
  main_idea: string | null;
  ai_score: number | null;
  status: IdeaStatus;
  category: string | null;
  is_template: boolean;
  sort_order: number | null;
  updated_at: string;
  created_at: string;
}

type SortOption = "updated_at" | "created_at" | "title" | "category" | "ai_score" | "status";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "updated_at", label: "Last Edited" },
  { value: "created_at", label: "Created" },
  { value: "title", label: "Name (A-Z)" },
  { value: "category", label: "Category" },
  { value: "ai_score", label: "AI Score" },
  { value: "status", label: "Status" },
];

const STATUS_ORDER: Record<IdeaStatus, number> = {
  building: 1,
  shortlisted: 2,
  idea: 3,
  paused: 4,
  shipped: 5,
  archived: 6,
};

function getScoreColor(score: number): string {
  if (score >= 7) return "text-green-600 bg-green-100";
  if (score >= 4) return "text-yellow-600 bg-yellow-100";
  return "text-red-600 bg-red-100";
}

export default function Home() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showArchived, setShowArchived] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("updated_at");

  const fetchIdeas = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ideas")
        .select("id, title, description, main_idea, ai_score, status, category, is_template, sort_order, updated_at, created_at")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      setIdeas(data || []);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      toast({
        variant: "destructive",
        title: "Error loading ideas",
        description: "Please try refreshing the page.",
      });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [toast]);

  // Handler for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await fetchIdeas(false);
  }, [fetchIdeas]);

  // Check auth and fetch ideas
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }

      fetchIdeas();
    };

    checkAuthAndFetch();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate("/auth", { replace: true });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchIdeas, navigate]);

  // Sort function
  const sortIdeas = (ideasToSort: Idea[]): Idea[] => {
    return [...ideasToSort].sort((a, b) => {
      // Templates always go to the bottom, sorted by sort_order (1, 2, 3)
      if (a.is_template !== b.is_template) {
        return a.is_template ? 1 : -1;
      }
      if (a.is_template && b.is_template) {
        return (a.sort_order || 999) - (b.sort_order || 999);
      }

      // Sort non-templates by selected sort option
      switch (sortBy) {
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "category":
          return (a.category || "zzz").localeCompare(b.category || "zzz");
        case "ai_score":
          return (b.ai_score ?? -1) - (a.ai_score ?? -1); // Higher scores first
        case "status":
          return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "updated_at":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  };

  // Filter and sort ideas
  const filteredIdeas = sortIdeas(ideas.filter((idea) => {
    // Filter by archived status
    if (!showArchived && idea.status === "archived") return false;
    if (showArchived && idea.status !== "archived") return false;
    
    // Filter by category
    if (selectedCategory !== "All" && idea.category !== selectedCategory) return false;
    
    return true;
  }));

  // Format status for display
  const formatStatus = (status: IdeaStatus): StatusBadgeStatus => {
    return (status.charAt(0).toUpperCase() + status.slice(1)) as StatusBadgeStatus;
  };

  // Update idea status
  const handleStatusChange = async (ideaId: string, newStatus: IdeaStatus) => {
    try {
      const { error } = await supabase
        .from("ideas")
        .update({ status: newStatus })
        .eq("id", ideaId);

      if (error) throw error;

      setIdeas(prev => prev.map(idea => 
        idea.id === ideaId ? { ...idea, status: newStatus } : idea
      ));

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

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = async () => {
    if (selectedIds.size === 0) return;

    const newStatus = showArchived ? "idea" : "archived";
    const actionWord = showArchived ? "restored" : "archived";

    try {
      const { error } = await supabase
        .from("ideas")
        .update({ status: newStatus })
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: `${selectedIds.size} idea${selectedIds.size > 1 ? "s" : ""} ${actionWord}`,
        description: showArchived 
          ? "Ideas are now back in your active list." 
          : "You can find them in the Archived section.",
      });

      setIsSelectMode(false);
      setSelectedIds(new Set());
      fetchIdeas();
    } catch (error) {
      console.error(`Error ${actionWord} ideas:`, error);
      toast({
        variant: "destructive",
        title: `Error ${actionWord} ideas`,
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

  const buildShareSummary = () => {
    const dateLabel = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const filters: string[] = [];
    filters.push(showArchived ? "View: Archived" : "View: Active");
    if (selectedCategory !== "All") {
      filters.push(`Category: ${selectedCategory}`);
    }

    const header = [
      `Vault Ideas — ${dateLabel}`,
      filters.length ? filters.join(" • ") : undefined,
    ]
      .filter(Boolean)
      .join("\n");

    const items = filteredIdeas
      .map((idea, index) => {
        const statusLabel = formatStatus(idea.status);
        const aiScore = idea.ai_score ? `${idea.ai_score}` : "N/A";
        const category = idea.category ?? "Uncategorized";
        const updated = new Date(idea.updated_at).toLocaleDateString();
        const details = [
          `${index + 1}. ${idea.title ?? "Untitled idea"}`,
          `   • Category: ${category}`,
          `   • Status: ${statusLabel} | AI Score: ${aiScore}`,
          `   • Last Edited: ${updated}`,
        ];

        if (idea.description) {
          details.push(`   • Notes: ${idea.description}`);
        }

        return details.join("\n");
      })
      .join("\n\n");

    return `${header}\n\n${items}`;
  };

  const buildCsvContent = () => {
    const headers = ["Title", "Status", "Category", "AI Score", "Last Edited"];
    const escapeCell = (value: string | number | null) => {
      const safeValue = value ?? "";
      return `"${String(safeValue).replace(/"/g, '""')}"`;
    };

    const rows = filteredIdeas.map((idea) => [
      escapeCell(idea.title ?? ""),
      escapeCell(formatStatus(idea.status)),
      escapeCell(idea.category ?? "Uncategorized"),
      escapeCell(idea.ai_score ?? "N/A"),
      escapeCell(new Date(idea.updated_at).toLocaleDateString()),
    ]);

    return [headers.map((header) => `"${header}"`).join(","), ...rows.map((row) => row.join(","))].join("\n");
  };

  const handleShareIdeas = async () => {
    if (!filteredIdeas.length) {
      toast({
        title: "Nothing to export",
        description: "Try changing filters or add an idea first.",
      });
      return;
    }

    setIsExporting(true);

    const shareSummary = buildShareSummary();
    const canUseWebShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

    if (canUseWebShare) {
      try {
        await navigator.share({
          text: shareSummary,
        });
        toast({
          title: "Shared",
          description: "Idea list sent via the native share sheet.",
        });
        setIsExporting(false);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setIsExporting(false);
          return;
        }
        console.warn("Web Share API failed, falling back to CSV export", error);
      }
    }

    try {
      const csv = buildCsvContent();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vault-ideas-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export ready",
        description: "Downloaded CSV with your current list.",
      });
    } catch (error) {
      console.error("Error exporting ideas:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Couldn't export ideas. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-background min-h-0">
      {/* Header - fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="w-20 flex justify-start">
            <Link to="/feed" className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors">
              <Newspaper className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
          <div className="flex flex-col items-center">
            <VaultLogoWithText className="scale-100" />
            <h1 className="text-base font-bold text-foreground tracking-tight uppercase mt-1">
              {showArchived ? "Archived" : "My Ideas"}
            </h1>
          </div>
          <div className="w-20 flex justify-end items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShareIdeas}
              disabled={isExporting}
              aria-label="Export or share idea list"
            >
              {isExporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Share className="w-5 h-5" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={toggleSelectMode}>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  {isSelectMode ? "Cancel Selection" : "Select Ideas"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowArchived(!showArchived)}>
                  <Archive className="w-4 h-4 mr-2" />
                  {showArchived ? "Show Active Ideas" : "Show Archived"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Category and Sort Row */}
        <div className="px-4 pb-3 flex items-center justify-between">
          {/* Category Dropdown */}
          <Drawer>
            <DrawerTrigger asChild>
              <button className="flex items-center gap-2 group">
                <span className="text-2xl font-bold text-foreground tracking-tight">
                  {selectedCategory}
                </span>
                <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </DrawerTrigger>
            <DrawerContent className="bg-background">
              <DrawerHeader className="flex items-center justify-between px-4 pb-2">
                <DrawerTitle className="text-lg font-semibold">Choose a category</DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="w-5 h-5" />
                  </Button>
                </DrawerClose>
              </DrawerHeader>
              <div className="px-4 pb-6">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES_WITH_ALL.map((category) => {
                    const Icon = category.icon;
                    return (
                      <DrawerClose key={category.id} asChild>
                        <button
                          onClick={() => setSelectedCategory(category.id)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border",
                            selectedCategory === category.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-foreground border-border hover:border-primary/50"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {category.label}
                        </button>
                      </DrawerClose>
                    );
                  })}
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <ArrowUpDown className="w-4 h-4" />
                <span className="text-xs">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={cn(sortBy === option.value && "bg-accent")}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content - with top padding for fixed header */}
      <div className="pt-[136px]">
        {/* Select Mode Action Bar */}
        {isSelectMode && (
          <div className="fixed top-[136px] left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <Button
            variant={showArchived ? "default" : "destructive"}
            size="sm"
            onClick={handleBulkAction}
            disabled={selectedIds.size === 0}
            className="gap-2"
          >
            {showArchived ? (
              <>
                <Archive className="w-4 h-4" />
                Restore Selected
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Archive Selected
              </>
            )}
          </Button>
        </div>
      )}

      {/* Ideas List with Pull-to-Refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className={cn("px-4 py-4 space-y-3", isSelectMode && "pt-[68px]")}>
          {/* Add New Idea Card */}
          {!isSelectMode && (
            <button
              onClick={() => navigate("/idea/new")}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <span className="text-muted-foreground group-hover:text-foreground font-medium transition-colors">Add new idea</span>
            </button>
          )}

          {filteredIdeas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {showArchived 
                ? "No archived ideas yet" 
                : selectedCategory !== "All" 
                  ? `No ideas in ${selectedCategory} category`
                  : "No ideas yet. Start building your vault!"
              }
            </p>
            {!showArchived && (
              <Button variant="outline" onClick={() => navigate("/idea/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Idea
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredIdeas.map((idea, index) => {
              // Generate display title with "Default #X:" prefix for templates
              const displayTitle = idea.is_template && idea.sort_order 
                ? `Default #${idea.sort_order}: ${idea.title}`
                : idea.title || `${idea.category || "Other"} App #${index + 1}`;
              const isSelected = selectedIds.has(idea.id);
              
              const cardContent = (
                <div className={cn(
                  "bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-colors group",
                  idea.status === "archived" && "opacity-60",
                  isSelectMode && isSelected && "border-primary bg-primary/5",
                  idea.is_template && "border-dashed"
                )}>
                  <div className="flex items-start justify-between gap-3">
                    {isSelectMode && (
                      <div className="flex items-center pt-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(idea.id)}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {displayTitle}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {idea.main_idea || idea.description || "No description"}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {!isSelectMode && idea.status !== "archived" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                              <span>
                                <StatusBadge 
                                  status={formatStatus(idea.status)} 
                                  interactive 
                                />
                              </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                              {STATUS_OPTIONS.map((option) => (
                                <DropdownMenuItem
                                  key={option.value}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleStatusChange(idea.id, option.value.toLowerCase() as IdeaStatus);
                                  }}
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
                        {idea.category && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                            {idea.category}
                          </span>
                        )}
                        {idea.ai_score !== null && (
                          <span className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full",
                            getScoreColor(idea.ai_score)
                          )}>
                            AI: {idea.ai_score.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!isSelectMode && (
                      <div className="flex items-center shrink-0">
                        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
                </div>
              );
              
              return (
                <div key={idea.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                  {isSelectMode ? (
                    <button 
                      onClick={() => toggleSelection(idea.id)}
                      className="w-full text-left"
                    >
                      {cardContent}
                    </button>
                  ) : (
                    <Link to={`/idea/${idea.id}`}>
                      {cardContent}
                    </Link>
                  )}
                </div>
              );
            })}
          </AnimatePresence>
        )}
        </div>
      </PullToRefresh>
      </div>
    </div>
  );
}
