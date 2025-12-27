import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarClock, ChevronRight, Loader2, Sparkles, TrendingUp, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, STATUS_OPTIONS, IdeaStatus as StatusBadgeStatus } from "@/components/ui/status-badge";
import { StatusDonutChart, StatusBarChart, ProgressRing } from "@/components/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type IdeaStatus = "idea" | "shortlisted" | "building" | "paused" | "shipped" | "archived";
type VisibleStatus = Exclude<IdeaStatus, "archived">;

interface IdeaDetails {
  id: string;
  title: string;
  status: IdeaStatus;
  difficulty: number | null;
  priority: number | null;
  sprint_fit: number | null;
  ai_score: number | null;
  ai_reasoning: string | null;
  updated_at: string | null;
  created_at: string | null;
  check_clear_problem: boolean | null;
  check_simple_loop: boolean | null;
  check_deployable_mvp: boolean | null;
}

const statusOrder: VisibleStatus[] = ["idea", "shortlisted", "building", "shipped", "paused"];

// Filter button colors matching status badge colors
const filterButtonStyles: Record<VisibleStatus, { active: string; inactive: string }> = {
  idea: {
    active: "bg-purple-600 text-white dark:bg-purple-500",
    inactive: "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50",
  },
  shortlisted: {
    active: "bg-amber-500 text-white dark:bg-amber-500",
    inactive: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50",
  },
  building: {
    active: "bg-emerald-600 text-white dark:bg-emerald-500",
    inactive: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50",
  },
  shipped: {
    active: "bg-blue-600 text-white dark:bg-blue-500",
    inactive: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
  },
  paused: {
    active: "bg-slate-600 text-white dark:bg-slate-500",
    inactive: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-700/50",
  },
};
const statusLabels: Record<IdeaStatus, string> = {
  idea: "Idea",
  shortlisted: "Shortlisted",
  building: "Building",
  paused: "Paused",
  shipped: "Shipped",
  archived: "Archived",
};

const stageMeta: Record<VisibleStatus, { title: string; description: string; tip: string; ctaLabel?: string; ctaTo?: string }> = {
  building: {
    title: "In flight",
    description: "This is the only idea you're actively shipping. Celebrate momentum and keep shipping rituals tight.",
    tip: "Capture blockers daily so nothing lingers.",
    ctaLabel: "Review build plan",
    ctaTo: "/build",
  },
  shortlisted: {
    title: "Up next",
    description: "Shortlisted ideas are vetted and ready to grab the baton when focus frees up.",
    tip: "Gut check priorities weekly to keep this list sharp.",
    ctaLabel: "Evaluate in Home",
    ctaTo: "/home",
  },
  idea: {
    title: "Fresh sparks",
    description: "Raw ideas that still need structure before they earn a shortlist slot.",
    tip: "Use AI autofill to sketch the story in minutes.",
    ctaLabel: "Structure ideas",
    ctaTo: "/home",
  },
  paused: {
    title: "On the shelf",
    description: "Paused ideas have momentum but are temporarily waiting. Revisit them with intention.",
    tip: "Plan a date to resume or deliberately archive.",
    ctaLabel: "Plan a comeback",
    ctaTo: "/home",
  },
  shipped: {
    title: "Shipped wins",
    description: "Artifacts of progress. Revisit why they worked and reuse playbooks.",
    tip: "Document learnings so future you benefits.",
    ctaLabel: "Share update",
    ctaTo: "/home",
  },
};

const formatRelativeTime = (isoDate?: string | null) => {
  if (!isoDate) return "No activity yet";
  const target = new Date(isoDate).getTime();
  if (Number.isNaN(target)) return "No activity yet";
  const diffMs = Date.now() - target;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Touched today";
  if (diffDays === 1) return "Updated yesterday";
  return `Inactive for ${diffDays} days`;
};

const getDaysSince = (isoDate?: string | null) => {
  if (!isoDate) return Infinity;
  const diffMs = Date.now() - new Date(isoDate).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const evaluationLabel = (value: number | null, label: string) => {
  if (value === null || value === undefined) return null;
  return `${label} ${value}/5`;
};

type FilterStatus = VisibleStatus | "all";

export default function Progress() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<IdeaDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("idea");

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

  const fetchIdeas = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("ideas")
        .select(
          "id, title, status, difficulty, priority, sprint_fit, ai_score, ai_reasoning, updated_at, created_at, check_clear_problem, check_simple_loop, check_deployable_mvp"
        )
        .neq("status", "archived")
        .eq("is_template", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIdeas((data as IdeaDetails[]) || []);
    } catch (error) {
      console.error("Error fetching ideas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }

      await fetchIdeas();
    };

    checkAuthAndFetch();
  }, [navigate]);

  const groupedIdeas = useMemo(() => {
    return statusOrder.reduce((acc, status) => {
      acc[status] = ideas.filter((idea) => idea.status === status);
      return acc;
    }, {} as Record<VisibleStatus, IdeaDetails[]>);
  }, [ideas]);

  const buildingIdea = groupedIdeas.building?.[0];
  const backlogCount = groupedIdeas.shortlisted?.length || 0;
  const ideaCount = ideas.length;
  const stuckIdeas = ideas.filter((idea) => idea.status !== "shipped" && getDaysSince(idea.updated_at) > 7);

  // Data for charts
  const statusCounts = useMemo(() => {
    return statusOrder.reduce((acc, status) => {
      acc[status] = groupedIdeas[status]?.length || 0;
      return acc;
    }, {} as Record<VisibleStatus, number>);
  }, [groupedIdeas]);

  // Calculate weekly activity percentage
  const weeklyActivityPercent = useMemo(() => {
    if (ideaCount === 0) return 0;
    const activeThisWeek = ideas.filter((idea) => getDaysSince(idea.updated_at) <= 7).length;
    return Math.round((activeThisWeek / ideaCount) * 100);
  }, [ideas, ideaCount]);

  // Filtered statuses to display in deep-dives
  const statusesToShow = selectedStatus === "all" ? statusOrder : [selectedStatus];

  const timelineEvents = useMemo(() => {
    return [...ideas]
      .sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
        const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5)
      .map((idea) => ({
        id: idea.id,
        title: idea.title,
        status: idea.status,
        timestamp: idea.updated_at || idea.created_at,
        summary:
          idea.ai_reasoning?.slice(0, 120) ||
          (idea.status === "shipped"
            ? "Marked as shipped — capture a retro while it's fresh."
            : "No AI notes yet. Ask the AI coach for a check-in."),
      }));
  }, [ideas]);

  if (isLoading) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Progress overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Keep one idea in focus, prep the next, and unstick anything idle.
          </p>
        </div>
      </header>

      <div className="px-4 py-6 space-y-8">
        {/* Hero summary */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Focus slot</p>
                <h2 className="text-lg font-semibold text-foreground">Only-one-building rule</h2>
              </div>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            {buildingIdea ? (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Currently building</p>
                <Link to={`/idea/${buildingIdea.id}`} className="block">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium text-foreground">{buildingIdea.title}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(buildingIdea.updated_at)}</p>
                  </div>
                </Link>
                <p className="text-xs text-muted-foreground mt-3">{stageMeta.building.tip}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {evaluationLabel(buildingIdea.difficulty, "Difficulty") && (
                    <Badge variant="outline">{evaluationLabel(buildingIdea.difficulty, "Difficulty")}</Badge>
                  )}
                  {evaluationLabel(buildingIdea.priority, "Priority") && (
                    <Badge variant="outline">{evaluationLabel(buildingIdea.priority, "Priority")}</Badge>
                  )}
                  {evaluationLabel(buildingIdea.sprint_fit, "Sprint fit") && (
                    <Badge variant="outline">{evaluationLabel(buildingIdea.sprint_fit, "Sprint fit")}</Badge>
                  )}
                  {buildingIdea.ai_score !== null && (
                    <Badge className="bg-primary/20 text-primary">AI score {buildingIdea.ai_score}/10</Badge>
                  )}
                </div>
                <div className="mt-4">
                  <Button asChild variant="secondary" className="w-full">
                    <Link to="/build">Check ritual</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  Nothing is in the build slot. Pick one shortlisted idea and commit to it so progress stays real.
                </p>
                <div className="mt-4">
                  <Button asChild className="w-full">
                    <Link to="/home">Choose next build</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Pipeline health</p>
                <h2 className="text-lg font-semibold text-foreground">{ideaCount} ideas in motion</h2>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            {/* Donut Chart */}
            <StatusDonutChart data={statusCounts} size="sm" className="mt-2" />
            <div className="mt-4 space-y-2">
              {statusOrder.map((status) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={statusLabels[status]} />
                  </div>
                  <span className="font-semibold text-foreground">{groupedIdeas[status]?.length || 0}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {backlogCount === 0
                ? "Your shortlist is empty. Curate two or three contenders so you're never starting from scratch."
                : `Shortlist ready: ${backlogCount} waiting in line.`}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Momentum watch</p>
                <h2 className="text-lg font-semibold text-foreground">{stuckIdeas.length} needs attention</h2>
              </div>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            {/* Weekly Activity Ring */}
            <div className="mt-4 flex items-center gap-4">
              <ProgressRing
                value={weeklyActivityPercent}
                label="Active this week"
                size="md"
                color={weeklyActivityPercent >= 70 ? "emerald" : weeklyActivityPercent >= 40 ? "amber" : "primary"}
              />
              <div className="flex-1">
                {stuckIdeas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Everything touched in the last week. Keep the cadence!
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {stuckIdeas.length} {stuckIdeas.length === 1 ? "idea" : "ideas"} idle for 7+ days.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {stuckIdeas.slice(0, 2).map((idea) => (
                <Link key={idea.id} to={`/idea/${idea.id}`} className="block">
                  <div className="p-3 rounded-xl border border-border/80 hover:border-primary/30 transition-colors">
                    <p className="text-sm font-medium text-foreground">{idea.title}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(idea.updated_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
            {stuckIdeas.length > 2 && (
              <p className="text-xs text-muted-foreground mt-2">+{stuckIdeas.length - 2} more waiting for a nudge.</p>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link to="/ai">Ask AI how to unblock</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Activity timeline */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Recent activity</p>
              <h2 className="text-lg font-semibold text-foreground">Lifecycle timeline</h2>
            </div>
            <CalendarClock className="w-5 h-5 text-primary" />
          </div>
          <div className="mt-4 space-y-4">
            {timelineEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">No lifecycle movement yet. Once ideas move stages, you'll see a story here.</p>
            )}
            {timelineEvents.map((event) => (
              <div key={event.id} className="flex flex-col gap-1 border-b border-border pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <span>
                          <StatusBadge status={statusLabels[event.status]} interactive />
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {STATUS_OPTIONS.map((option) => (
                          <DropdownMenuItem
                            key={option.value}
                            onClick={() => handleStatusChange(event.id, option.value.toLowerCase() as IdeaStatus)}
                            className={cn(
                              event.status === option.value.toLowerCase() && "bg-accent"
                            )}
                          >
                            <StatusBadge status={option.value} className="pointer-events-none" />
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Link to={`/idea/${event.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                      {event.title}
                    </Link>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(event.timestamp)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{event.summary}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Status Filter Row */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filter by stage</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <button
              onClick={() => setSelectedStatus("all")}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedStatus === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              All stages
            </button>
            {statusOrder.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedStatus === status
                    ? filterButtonStyles[status].active
                    : filterButtonStyles[status].inactive
                )}
              >
                {statusLabels[status]} ({groupedIdeas[status]?.length || 0})
              </button>
            ))}
          </div>
        </section>

        {/* Bar Chart - shown when "All" is selected */}
        {selectedStatus === "all" && ideaCount > 0 && (
          <section className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Distribution</p>
                <h2 className="text-lg font-semibold text-foreground">Ideas by stage</h2>
              </div>
            </div>
            <StatusBarChart data={statusCounts} orientation="horizontal" />
          </section>
        )}

        {/* Stage deep dives */}
        <section className="space-y-8">
          {statusesToShow.map((status) => {
            const ideasInStage = groupedIdeas[status];
            const meta = stageMeta[status];

            if (!meta) return null;

            return (
              <motion.section
                key={status}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={statusLabels[status]} />
                      <span className="text-sm text-muted-foreground">{ideasInStage?.length || 0} items</span>
                    </div>
                    <h2 className="text-lg font-semibold text-foreground mt-1">{meta.title}</h2>
                    <p className="text-sm text-muted-foreground">{meta.description}</p>
                  </div>
                  {meta.ctaLabel && meta.ctaTo && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={meta.ctaTo}>{meta.ctaLabel}</Link>
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-3">{meta.tip}</p>

                <div className="mt-4 space-y-3">
                  {ideaCount === 0 && status === "idea" && (
                    <div className="border border-dashed border-border rounded-xl p-4 text-center">
                      <p className="text-sm text-muted-foreground">Capture a thought in Inbox to see it show up here.</p>
                      <Button asChild size="sm" className="mt-3">
                        <Link to="/inbox">Go to Inbox</Link>
                      </Button>
                    </div>
                  )}

                  {(ideasInStage || []).map((idea) => (
                    <Link key={idea.id} to={`/idea/${idea.id}`} className="block group">
                      <div className="rounded-2xl border border-border p-4 hover:border-primary/40 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-foreground">{idea.title}</p>
                            <p className="text-xs text-muted-foreground">{formatRelativeTime(idea.updated_at)}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {evaluationLabel(idea.difficulty, "Difficulty") && (
                            <Badge variant="outline">{evaluationLabel(idea.difficulty, "Difficulty")}</Badge>
                          )}
                          {evaluationLabel(idea.priority, "Priority") && (
                            <Badge variant="outline">{evaluationLabel(idea.priority, "Priority")}</Badge>
                          )}
                          {evaluationLabel(idea.sprint_fit, "Sprint fit") && (
                            <Badge variant="outline">{evaluationLabel(idea.sprint_fit, "Sprint fit")}</Badge>
                          )}
                          {idea.ai_score !== null && (
                            <Badge className="bg-primary/15 text-primary">AI {idea.ai_score}/10</Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {idea.check_clear_problem && <span className="px-2 py-0.5 rounded-full bg-emerald-50/40 dark:bg-emerald-500/10">Problem clear</span>}
                          {idea.check_simple_loop && <span className="px-2 py-0.5 rounded-full bg-blue-50/40 dark:bg-blue-500/10">Loop simple</span>}
                          {idea.check_deployable_mvp && <span className="px-2 py-0.5 rounded-full bg-purple-50/40 dark:bg-purple-500/10">MVP ready</span>}
                        </div>
                        {idea.ai_reasoning && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                            “{idea.ai_reasoning}”
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}

                  {!ideasInStage?.length && ideaCount > 0 && (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                      Nothing in this stage yet. {meta.tip}
                    </div>
                  )}
                </div>
              </motion.section>
            );
          })}
        </section>
      </div>
    </div>
  );
}
