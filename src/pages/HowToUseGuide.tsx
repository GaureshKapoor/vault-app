import { ArrowRight, Sparkles, PenSquare, BarChart3, MessageSquare, ClipboardList } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const guideSections = [
  {
    id: 1,
    title: "Inbox → Capture",
    icon: PenSquare,
    blurb: "Dump raw sparks in seconds. Vault keeps them safe until you're ready to shape them.",
    bullets: [
      "Tap the lightning Inbox button to jot voice notes, links, or one-liners",
      "Use templates to nudge your thinking (pain, workflow, link drop)",
      "Convert any thought to a structured idea with the Create with AI action",
    ],
    link: "/inbox",
    linkLabel: "Open Inbox",
  },
  {
    id: 2,
    title: "Home → Structure",
    icon: ClipboardList,
    blurb: "Tell the story once. AI backfills the rest so every idea has problem, solution, and MVP defined.",
    bullets: [
      "Add a title and core problem, then trigger Autofill to draft the remaining fields",
      "Use cards to track idea status, category, and AI scores side-by-side",
      "Pin ready-to-build contenders to Shortlisted to prep your focus queue",
    ],
    link: "/home",
    linkLabel: "Go to Home",
  },
  {
    id: 3,
    title: "AI Desk → Evaluate",
    icon: MessageSquare,
    blurb: "Coach, editor, and sparring partner in one screen. Ask Vault AI what to build next or how to unblock.",
    bullets: [
      "Chat with context from your top ideas — the assistant references real content",
      "Run instant scoring to compare contenders on feasibility and impact",
      "Request critiques on copy, assumptions, or launch plans before committing",
    ],
    link: "/ai",
    linkLabel: "Launch AI desk",
  },
  {
    id: 4,
    title: "Progress → Focus",
    icon: BarChart3,
    blurb: "Single build slot keeps you honest. Watch every stage and unstick paused projects.",
    bullets: [
      "Hero card highlights your active build with evaluation badges",
      "Stage cards explain what to do next (Shortlisted, Paused, Shipped)",
      "Activity timeline surfaces notes, score changes, and lifecycle moves",
    ],
    link: "/progress2",
    linkLabel: "Review Progress",
  },
  {
    id: 5,
    title: "Profile → Rituals",
    icon: Sparkles,
    blurb: "Control theme, docs, subscriptions, and exports. This is home base for account hygiene.",
    bullets: [
      "Update name, avatar, and builder bio to personalize your vault",
      "Switch between light/dark, manage notifications, or upgrade plans",
      "Visit Docs anytime for Privacy, Terms, and this guide",
    ],
    link: "/profile",
    linkLabel: "Visit Profile",
  },
];

export default function HowToUseGuide() {
  const navigate = useNavigate();
  const location = useLocation();
  const origin = location.state?.from as string | undefined;

  const handleReturn = () => {
    if (origin === "profile") {
      navigate("/profile");
      return;
    }
    if (origin === "landing") {
      navigate("/", { state: { scrollTo: "footer" } });
      return;
    }
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <button
          onClick={handleReturn}
          className="flex items-center gap-2 text-muted-foreground/60 hover:text-foreground transition-all duration-300 group"
        >
          <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm font-medium opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            Back
          </span>
        </button>

        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <Sparkles className="w-4 h-4" /> How to Use Vault
          </div>
          <h1 className="text-3xl font-bold">From spark to shipped in five screens</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Follow the arrows. Each page in Vault plays a specific role so you never wonder where to click next.
            Share this guide with collaborators or reopen it from Profile → Docs anytime.
          </p>
        </div>

        <div className="relative bg-card border border-border rounded-3xl p-6 md:p-10 space-y-8">
          {guideSections.map((section, index) => (
            <div key={section.id} className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)] items-center">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Step {section.id.toString().padStart(2, "0")}
                  <span className="inline-flex items-center gap-1 text-primary text-[11px]">
                    <ArrowRight className="w-3 h-3" />
                    Flow
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 text-primary font-semibold">
                  <section.icon className="w-5 h-5" />
                  {section.title}
                </div>
                <p className="text-sm text-muted-foreground">{section.blurb}</p>
                <Link
                  to={section.link}
                  className="inline-flex items-center gap-1 text-primary text-sm font-medium"
                >
                  {section.linkLabel}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="bg-muted/30 border border-border rounded-2xl p-5 space-y-3">
                {section.bullets.map((bullet) => (
                  <div key={bullet} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>

              {index < guideSections.length - 1 && (
                <div className="hidden md:block md:col-span-2">
                  <div className="flex items-center gap-2 text-muted-foreground/60">
                    <div className="h-px flex-1 bg-border" />
                    <ArrowRight className="w-4 h-4" />
                    <div className="h-px flex-1 bg-border" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
