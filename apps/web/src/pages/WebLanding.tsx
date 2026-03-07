import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
  Target,
  Archive,
  Inbox,
  Lightbulb,
  Zap,
  CheckCircle,
  ChevronDown,
  Lock,
  Globe,
  Linkedin,
  Instagram,
  Youtube,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VaultLogoWithText } from "@/components/icons/VaultLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ============ DATA ============

interface ExampleIdea {
  template: string;
  highlights: { text: string; color: string }[];
}

const exampleTemplates: ExampleIdea[] = [
  {
    template: "{0} that {1}",
    highlights: [
      { text: "A mood tracker", color: "text-blue-400" },
      { text: "uses Spotify listening history", color: "text-green-400" },
    ],
  },
  {
    template: "{0} but it {1}",
    highlights: [
      { text: "Voice memo app", color: "text-orange-400" },
      { text: "auto-transcribes and tags ideas", color: "text-violet-400" },
    ],
  },
  {
    template: "{0} for {1}",
    highlights: [
      { text: "Notion style database", color: "text-rose-400" },
      { text: "tracking side projects and status", color: "text-teal-400" },
    ],
  },
];

const taglineWords = ["faster", "better", "effortless"];

const stats = [
  { value: "AI", label: "Powered", sublabel: "Smart Ideation" },
  { value: "100+", label: "Ideas", sublabel: "Organized" },
  { value: "50%", label: "Faster", sublabel: "Validation" },
];

const features = [
  {
    icon: Sparkles,
    title: "Idea AI Autofill",
    description: "Let AI structure your raw ideas into buildable concepts",
  },
  {
    icon: Target,
    title: "Idea Scoring",
    description: "Get instant AI feedback on viability and potential",
  },
  {
    icon: Archive,
    title: "Idea Vault",
    description: "Organize, categorize, and track all your ideas in one place",
  },
  {
    icon: Inbox,
    title: "Idea Inbox",
    description: "Capture raw thoughts anytime, convert to ideas later",
  },
];

const howItWorks = [
  {
    step: 1,
    icon: Lightbulb,
    title: "Capture",
    description: "Jot down your raw idea or brain dump",
  },
  {
    step: 2,
    icon: Sparkles,
    title: "Enhance",
    description: "AI fills in the blanks and scores viability",
  },
  {
    step: 3,
    icon: Zap,
    title: "Build",
    description: "Move to action with structured plans",
  },
];

const testimonials = [
  {
    quote: "This is exactly the tool I wish I had when I was drowning in half-baked ideas. The AI scoring alone would save months of chasing the wrong thing.",
    author: "Startup Leader",
    role: "Series A Founder",
    avatar: "SL",
  },
  {
    quote: "I lose ideas in random notes apps all the time. Something like Vault that actually structures and scores them? That's a game changer.",
    author: "Product Lead",
    role: "Series B Product",
    avatar: "PL",
  },
  {
    quote: "The idea inbox concept is genius. Capture raw thoughts at 2am and wake up to structured, scored ideas — I'd use this every day.",
    author: "Design Director",
    role: "Tech Startup",
    avatar: "DD",
  },
];

const faqs = [
  {
    question: "Is it really free?",
    answer: "Yes! Vault offers a generous free tier with AI-powered features. Premium features are available for power users.",
  },
  {
    question: "How does the AI scoring work?",
    answer: "Our AI analyzes your idea across multiple dimensions like market fit, technical feasibility, and uniqueness to give you an actionable score.",
  },
  {
    question: "Can I export my ideas?",
    answer: "Absolutely. Export your ideas to various formats or integrate with your favorite tools.",
  },
  {
    question: "Is my data private?",
    answer: "100%. Your ideas are encrypted and never shared. We take your intellectual property seriously.",
  },
];

// ============ COMPONENTS ============

function TemplateCard({ idea }: { idea: ExampleIdea }) {
  const parts = idea.template.split(/\{(\d+)\}/);
  
  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg text-center">
      <p className="text-lg md:text-xl lg:text-2xl font-medium leading-relaxed text-foreground">
        {parts.map((part, i) => {
          const highlightIndex = parseInt(part);
          if (!isNaN(highlightIndex) && idea.highlights[highlightIndex]) {
            const highlight = idea.highlights[highlightIndex];
            return (
              <span
                key={i}
                className={`${highlight.color} underline decoration-2 underline-offset-4`}
              >
                {highlight.text}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    </div>
  );
}

function AnimatedTagline() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % taglineWords.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-14 md:h-18 lg:h-20 flex items-center justify-center mt-2 overflow-visible">
      <span
        key={taglineWords[currentWordIndex]}
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary italic animate-fade-in pr-2"
      >
        {taglineWords[currentWordIndex]}
      </span>
    </div>
  );
}


function PricingSection({ navigate }: { navigate: (path: string) => void }) {
  const [activePlan, setActivePlan] = useState<'free' | 'pro'>('pro');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Detect which card is visible when scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const freeCard = document.getElementById('pricing-free');
      const proCard = document.getElementById('pricing-pro');
      if (!freeCard || !proCard) return;

      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      const freeRect = freeCard.getBoundingClientRect();
      const proRect = proCard.getBoundingClientRect();

      const freeCenter = freeRect.left + freeRect.width / 2;
      const proCenter = proRect.left + proRect.width / 2;

      const distToFree = Math.abs(containerCenter - freeCenter);
      const distToPro = Math.abs(containerCenter - proCenter);

      setActivePlan(distToFree < distToPro ? 'free' : 'pro');
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePlanChange = (plan: 'free' | 'pro') => {
    setActivePlan(plan);
    const card = document.getElementById(`pricing-${plan}`);
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden flex justify-center mb-4">
        <div className="inline-flex bg-muted rounded-full p-1">
          <button
            onClick={() => handlePlanChange('pro')}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
              activePlan === 'pro'
                ? 'text-foreground bg-card shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pro
          </button>
          <button
            onClick={() => handlePlanChange('free')}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
              activePlan === 'free'
                ? 'text-foreground bg-card shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Free
          </button>
        </div>
      </div>

      {/* Cards - horizontal scroll on mobile, Pro first */}
      <div
        ref={scrollContainerRef}
        className="flex md:grid md:grid-cols-2 gap-4 max-w-3xl mx-auto overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 -mx-6 px-6 md:mx-auto md:px-0 pt-4"
      >
        {/* Pro Plan - First/Left */}
        <motion.div
          id="pricing-pro"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: "tween", duration: 0.4, ease: "easeOut" }}
          viewport={{ once: true }}
          className="p-5 pt-6 rounded-xl bg-primary text-primary-foreground border border-primary relative flex-shrink-0 w-[calc(100vw-3rem)] max-w-[320px] md:w-auto md:max-w-none snap-center flex flex-col will-change-transform"
        >
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
            <span className="bg-foreground text-background text-xs font-bold px-2.5 py-0.5 rounded-full">
              POPULAR
            </span>
          </div>
          <div className="mb-5">
            <h3 className="text-lg font-bold mb-1">Pro</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">$9</span>
              <span className="text-primary-foreground/70 text-sm">/month</span>
            </div>
            <p className="text-primary-foreground/70 mt-1 text-xs">
              For serious builders
            </p>
          </div>
          <ul className="space-y-2 mb-5 flex-1">
            {["Unlimited ideas", "Advanced AI refinement", "Scoring & insights", "Export ideas", "Priority support"].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-xs text-primary-foreground/90">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <Button variant="secondary" size="sm" className="w-full mt-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90" onClick={() => navigate("/auth?mode=signup")}>
            Start Pro Trial
          </Button>
        </motion.div>

        {/* Free Plan - Second/Right */}
        <motion.div
          id="pricing-free"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: "tween", duration: 0.4, delay: 0.05, ease: "easeOut" }}
          viewport={{ once: true }}
          className="p-5 rounded-xl bg-card border border-border flex-shrink-0 w-[calc(100vw-3rem)] max-w-[320px] md:w-auto md:max-w-none snap-center flex flex-col will-change-transform"
        >
          <div className="mb-5">
            <h3 className="text-lg font-bold text-foreground mb-1">Free</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">$0</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Perfect for getting started
            </p>
          </div>
          <ul className="space-y-2 mb-5 flex-1">
            {["Up to 10 ideas", "Basic AI refinement", "Basic templates"].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="w-full mt-auto" onClick={() => navigate("/auth?mode=signup")}>
            Get Started
          </Button>
        </motion.div>
      </div>
    </>
  );
}

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ type: "tween", duration: 0.4, ease: "easeOut" }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

function Header({ scrolled }: { scrolled: boolean }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Idea Bank", href: "#idea-bank" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="cursor-pointer"
          >
            <VaultLogoWithText />
          </button>
        </div>

        {/* Desktop Nav - absolute center on lg+, normal flow on md */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium whitespace-nowrap"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth?mode=login")}
            >
              Log in
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Create account
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center mr-1">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors border border-primary/20">
                  <Menu className="h-5 w-5 text-primary" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                hideDefaultClose
                className="h-[100dvh] rounded-t-3xl bg-background/95 backdrop-blur-xl border-t-2 border-primary/20 p-0"
              >
                {/* Decorative glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-primary/10 blur-[60px] rounded-full pointer-events-none" />

                <div className="relative">
                  {/* Handle bar indicator */}
                  <div className="flex justify-center pt-3 pb-4">
                    <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                  </div>

                  {/* Header with logo and close */}
                  <div className="flex items-center justify-between px-6 mb-4">
                    <VaultLogoWithText />
                    <SheetClose asChild>
                      <button
                        className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                        aria-label="Close menu"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </SheetClose>
                  </div>

                  {/* Section label */}
                  <div className="px-6 mb-3">
                    <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Navigate
                    </span>
                  </div>

                  {/* Nav links with staggered animation */}
                  <nav className="px-6 space-y-1 mb-6">
                    {navLinks.map((link, index) => (
                      <motion.button
                        key={link.href}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          delay: 0.05 + index * 0.03,
                          duration: 0.2
                        }}
                        onClick={() => scrollToSection(link.href)}
                        className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-foreground font-semibold text-lg hover:bg-primary/5 hover:text-primary active:scale-[0.98] transition-all group"
                      >
                        <span>{link.label}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </motion.button>
                    ))}
                  </nav>

                  {/* CTA section */}
                  <div className="px-6 space-y-3 pb-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15, duration: 0.2 }}
                    >
                      <Button
                        className="w-full h-12 text-base font-semibold"
                        variant="default"
                        onClick={() => {
                          navigate("/auth?mode=signup");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Get Started Free
                      </Button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.18, duration: 0.2 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-12 text-base font-semibold border-border/50"
                        onClick={() => {
                          navigate("/auth?mode=login");
                          setMobileMenuOpen(false);
                        }}
                      >
                        Log in
                      </Button>
                    </motion.div>
                  </div>

                  {/* Footer links */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.25 }}
                    className="px-6 pb-24 pt-4 border-t border-border/50 flex items-center justify-center gap-6 text-sm text-muted-foreground"
                  >
                    <Link
                      to="/privacy"
                      className="hover:text-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Privacy
                    </Link>
                    <span className="text-border">|</span>
                    <Link
                      to="/terms"
                      className="hover:text-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Terms
                    </Link>
                  </motion.div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

// ============ MAIN PAGE ============

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const swipeThreshold = 80;

  const cardVariants = {
    enter: (dir: number) => ({ x: dir * 80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -80, opacity: 0 }),
  };

  const paginate = (newDirection: number) => {
    setIsAutoPlaying(false);
    setDirection(newDirection);
    setCurrentIndex(
      (prev) => (prev + newDirection + exampleTemplates.length) % exampleTemplates.length
    );
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % exampleTemplates.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (location.state?.scrollTo === "footer") {
      setTimeout(() => {
        document.querySelector("footer")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handlePrev = () => paginate(-1);
  const handleNext = () => paginate(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted dark:gradient-dark-hero">
      <Header scrolled={scrolled} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col pt-16 overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-20 dark:opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.3) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>

        {/* Decorative glow - reduced blur for performance */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 dark:bg-primary/20 blur-[80px] rounded-full" />
        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-primary/5 dark:bg-primary/10 blur-[60px] rounded-full" />

        <div className="relative z-10 flex flex-col flex-1">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "tween", duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="px-6 mt-4 md:mt-6 text-center will-change-transform"
          >
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-medium">
              🚀 Now in Beta
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-1 tracking-tight">
              All Your <span className="text-primary">Ideas</span>, One Place
            </h1>
            <AnimatedTagline />
            
            <p className="text-lg md:text-xl text-muted-foreground mt-4 tracking-wide font-semibold">
              Less chaos. More building.
            </p>
            
            <p className="text-base md:text-lg text-muted-foreground/80 mt-6 max-w-lg mx-auto leading-relaxed">
              Capture ideas as they come, use AI to create, refine and evaluate them, and move from half-baked thoughts to execution-ready plans at rapid pace.
            </p>
            
            <p className="text-muted-foreground text-base md:text-lg mt-6 max-w-md mx-auto italic">
              Vibe-<span className="text-primary font-semibold not-italic">ideate</span>
              <Sparkles className="inline w-4 h-4 text-primary ml-1" />
              {" "}in the world of vibe-coding
            </p>
          </motion.div>

          {/* Idea Cards */}
          <main className="flex-1 flex flex-col justify-center px-6 py-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "tween", duration: 0.4, delay: 0.2, ease: "easeOut" }}
              className="max-w-2xl lg:max-w-4xl mx-auto w-full will-change-transform"
            >
              <div className="min-h-[120px] md:min-h-[140px] flex items-center">
                <div className="w-full">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                      key={currentIndex}
                      custom={direction}
                      variants={cardVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.1}
                      onDragStart={() => setIsAutoPlaying(false)}
                      onDragEnd={(_, info) => {
                        if (info.offset.x > swipeThreshold) paginate(-1);
                        if (info.offset.x < -swipeThreshold) paginate(1);
                      }}
                      className="will-change-transform touch-pan-y"
                    >
                      <TemplateCard idea={exampleTemplates[currentIndex]} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4 mt-0.5 md:-mt-1">
                <button
                  onClick={handlePrev}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Previous idea"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <span className="text-sm text-muted-foreground">
                  Swipe through sample ideas - created with AI
                </span>
                
                <button
                  onClick={handleNext}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Next idea"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Dots indicator */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {exampleTemplates.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? "bg-primary w-6"
                        : "bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50"
                    }`}
                    aria-label={`Go to template ${index + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </main>

          {/* Hero CTA */}
          <div className="px-6 pb-8 pt-3 md:pt-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "tween", duration: 0.4, delay: 0.3, ease: "easeOut" }}
              className="max-w-xs md:max-w-sm mx-auto will-change-transform"
            >
              <Button
                onClick={() => navigate("/auth?mode=signup")}
                variant="hero"
                size="default"
                className="w-full md:h-12 md:px-8 md:text-lg"
              >
                Get Started Free
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 md:py-12 px-6 bg-muted/50">
        <AnimatedSection>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-3 md:gap-6">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="text-center p-3 md:p-5 rounded-xl bg-card border border-border"
                >
                  <div className="text-2xl md:text-4xl font-bold text-primary mb-0.5">
                    {stat.value}
                  </div>
                  <div className="text-sm md:text-base font-semibold text-foreground">
                    {stat.label}
                  </div>
                  <div className="text-xs text-muted-foreground hidden md:block">
                    {stat.sublabel}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>


      {/* Features Section (Idea Bank continuation) */}
      <section id="features" className="py-8 md:py-12 px-6 bg-muted/50">
        <AnimatedSection>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6 md:mb-10">
              <p className="text-muted-foreground text-base max-w-2xl mx-auto">
                Everything you need to capture, refine, and build your ideas
              </p>
            </div>

            {/* Horizontal scroll on mobile */}
            <div className="flex md:grid md:grid-cols-2 gap-4 overflow-x-auto pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 snap-x snap-mandatory">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ type: "tween", duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
                  viewport={{ once: true }}
                  className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors flex-shrink-0 w-[260px] md:w-auto snap-center will-change-transform"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* How It Works Section - Unique horizontal flow */}
      <section id="how-it-works" className="py-12 md:py-16 px-6 relative overflow-hidden">
        {/* Decorative diagonal lines */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 50px, hsl(var(--border)) 50px, hsl(var(--border)) 51px)`
          }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="mb-10">
              <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-3">
                Simple as 1-2-3
              </span>
              <h2 className="text-xl md:text-4xl font-bold text-foreground max-w-lg">
                How it works
              </h2>
            </div>
          </AnimatedSection>

          {/* Horizontal Steps - Desktop */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-10 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/50 to-border" />
              
              <div className="grid grid-cols-3 gap-6">
                {howItWorks.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ type: "tween", duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className="relative will-change-transform"
                  >
                    {/* Step number circle */}
                    <div className="w-20 h-20 mx-auto mb-4 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-xl">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-1 text-center">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm text-center">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Vertical Steps - Mobile */}
          <div className="md:hidden space-y-8">
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ type: "tween", duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
                viewport={{ once: true }}
                className="flex gap-4 items-start will-change-transform"
              >
                <div className="w-14 h-14 flex-shrink-0 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Why Builders Love Vault Section - Testimonials */}
      <section className="py-12 md:py-20 px-6 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
                Why builders <span className="text-primary">(and everyone)</span> love Vault
              </h2>
              <p className="text-muted-foreground text-base max-w-xl mx-auto">
                See why builders are excited about Vault
              </p>
            </div>
          </AnimatedSection>

          {/* Testimonials - Horizontal scroll on mobile */}
          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-12 overflow-x-auto pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 snap-x snap-mandatory">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ type: "tween", duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
                viewport={{ once: true }}
                className={`p-5 rounded-xl border flex-shrink-0 w-[280px] md:w-auto snap-center will-change-transform ${
                  i === 1 
                    ? "bg-primary text-primary-foreground border-primary md:-translate-y-4" 
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 1 ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className={`font-semibold text-sm ${i === 1 ? "text-primary-foreground" : "text-foreground"}`}>
                      {testimonial.author}
                    </div>
                    <div className={`text-xs ${i === 1 ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                <p className={`text-sm leading-relaxed ${i === 1 ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                  "{testimonial.quote}"
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pt-0 pb-4 md:pt-0 md:pb-8 px-6">
        <AnimatedSection>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                Simple Pricing
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Start free, upgrade when ready
              </h2>
              <p className="text-muted-foreground text-base max-w-xl mx-auto">
                Everything you need to capture and build your best ideas
              </p>
            </div>

            <PricingSection navigate={navigate} />
          </div>
        </AnimatedSection>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-8 md:py-12 px-6 bg-muted/50">
        <AnimatedSection>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Frequently asked questions
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-card border border-border rounded-lg px-4 data-[state=open]:border-primary/50"
                >
                  <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline py-3 text-sm">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-3 text-sm">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </AnimatedSection>
      </section>

      {/* Final CTA Section */}
      <section className="py-10 md:py-16 px-6 relative overflow-hidden">
        {/* Background glow - reduced blur for performance */}
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[70px] rounded-full" />
        </div>

        <AnimatedSection>
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Start building your Idea Vault
            </h2>
            <p className="text-muted-foreground text-base mb-6 max-w-lg mx-auto">
              Join thousands of builders who traded chaos for clarity.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Button
                onClick={() => navigate("/auth?mode=signup")}
                variant="hero"
                size="default"
                className="md:h-14 md:px-10 md:text-lg"
              >
                Get Started Free
              </Button>
              <Button
                onClick={() => navigate("/auth?mode=login")}
                variant="outline"
                size="default"
                className="md:h-14 md:px-10 md:text-lg"
              >
                Log In
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-nowrap justify-center gap-2 md:gap-6 text-[10px] md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1 md:gap-2">
                <CheckCircle className="w-2.5 h-2.5 md:w-4 md:h-4 text-primary flex-shrink-0" />
                <span className="whitespace-nowrap">Free forever</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Sparkles className="w-2.5 h-2.5 md:w-4 md:h-4 text-primary flex-shrink-0" />
                <span className="whitespace-nowrap">AI-powered</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Lock className="w-2.5 h-2.5 md:w-4 md:h-4 text-primary flex-shrink-0" />
                <span className="whitespace-nowrap">Private & secure</span>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Personal Story Section */}
          <div className="text-center mb-10 pb-10 border-b border-border">
            <p className="text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed">
              Built by a product-guy through and through, who knows the hardest part comes before the build.
            </p>
            <p className="text-foreground font-medium mb-6">
              Follow the journey on social media!
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="https://www.linkedin.com/in/gaureshkapoor/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/gauresh_kapoor/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@gaureshkapoor106"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="cursor-pointer">
                <VaultLogoWithText />
              </button>
              <span className="hidden md:inline-flex items-center gap-1.5 bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full border border-primary/20">
                <Sparkles className="w-3 h-3" />
                Vibe-ideate with us
              </span>
            </div>

            <div className="flex items-center gap-4 md:gap-6 text-sm text-muted-foreground">
              <button
                onClick={() => {
                  const el = document.querySelector("#pricing");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="hover:text-foreground transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  const el = document.querySelector("#faq");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="hover:text-foreground transition-colors"
              >
                FAQ
              </button>
              <Link to="/privacy" state={{ from: "landing" }} className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/terms" state={{ from: "landing" }} className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-2 mt-4">
            <span className="md:hidden inline-flex items-center gap-1.5 bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full border border-primary/20">
              <Sparkles className="w-3 h-3" />
              Vibe-ideate with us
            </span>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Vault. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
