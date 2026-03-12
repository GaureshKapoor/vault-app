import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Loader2,
  Lightbulb,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAIChat } from "@/hooks/useAIChat";
import { useIdeaGeneration, GeneratedIdea } from "@/hooks/useIdeaGeneration";
import { ModeToggle, AIMode } from "@/components/ai/ModeToggle";
import { GeneratedIdeaCard } from "@/components/ai/GeneratedIdeaCard";
import { IdeaEditDialog } from "@/components/ai/IdeaEditDialog";
import { CATEGORY_OPTIONS } from "@/lib/categories";

const MODE_STORAGE_KEY = "vault_ai_mode";

export default function AI() {
  // Mode state
  const [mode, setMode] = useState<AIMode>(() => {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    return (saved === "generate" ? "generate" : "chat") as AIMode;
  });

  // Chat state (lifted up for header access and passed to ChatView)
  const chatState = useAIChat();

  // Persist mode changes and reset scroll on mode change
  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
    // Reset scroll position when switching modes
    window.scrollTo(0, 0);
  }, [mode]);

  return (
    <div className="flex-1 bg-background flex flex-col min-h-0">
      {/* Header - fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              {mode === "chat" ? (
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Lightbulb className="w-5 h-5 text-primary-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {mode === "chat" ? "AI Assistant" : "Idea Generator"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {mode === "chat" ? "Think fast, build later" : "Generate and save ideas"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === "chat" && chatState.messages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={chatState.clearHistory}
                className="text-muted-foreground hover:text-destructive"
                title="Clear chat history"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
        </div>
      </header>

      {/* Content - with top padding for fixed header (more on mobile) */}
      <div className="pt-[108px] md:pt-[76px] flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {mode === "chat" ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <ChatView chatState={chatState} />
            </motion.div>
          ) : (
            <motion.div
              key="generate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <GenerateView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChatView({ chatState }: { chatState: ReturnType<typeof useAIChat> }) {
  const { messages, sendMessage, isLoading } = chatState;
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  return (
    <>
      {/* Messages */}
      <div className="flex-1 px-4 py-4 pb-24 space-y-4 overflow-y-auto">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            className={cn(
              "flex gap-3",
              message.role === "user" && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                message.role === "assistant" ? "bg-primary/10" : "bg-muted"
              )}
            >
              {message.role === "assistant" ? (
                <Bot className="w-4 h-4 text-primary" />
              ) : (
                <User className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-1 max-w-[80%]">
              <div
                className={cn(
                  "rounded-2xl px-4 py-3",
                  message.role === "assistant"
                    ? "bg-card border border-border rounded-tl-md"
                    : "bg-primary text-primary-foreground rounded-tr-md"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
              <span
                className={cn(
                  "text-[10px] text-muted-foreground px-1",
                  message.role === "user" && "text-right"
                )}
              >
                {formatTime(message.timestamp)}
              </span>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border px-4 py-3 z-40">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your ideas..."
            className="flex-1 h-12"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 shrink-0"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </>
  );
}

function GenerateView() {
  const {
    ideas,
    isGenerating,
    generateIdeas,
    autofillIdea,
    quickSave,
    removeIdea,
    clearAllIdeas,
    toggleExpand,
    updateIdea,
  } = useIdeaGeneration();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [category, setCategory] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [gist, setGist] = useState("");
  const [editingIdea, setEditingIdea] = useState<GeneratedIdea | null>(null);

  // Reset scroll position when component mounts
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  const handleGenerate = async () => {
    const options: { category?: string; difficulty?: number; gist?: string } = {};
    if (category && category !== "any") options.category = category;
    if (difficulty && difficulty !== "any") options.difficulty = parseInt(difficulty);
    if (gist.trim()) options.gist = gist.trim();

    await generateIdeas(options);
    setGist("");
  };

  const handleQuickSave = async (id: string) => {
    await quickSave(id);
  };

  const handleEditSave = (id: string) => {
    const idea = ideas.find((i) => i.id === id);
    if (idea) {
      setEditingIdea(idea);
    }
  };

  const handleIdeaSaved = (ideaId: string, _savedDbId: string) => {
    removeIdea(ideaId);
    setEditingIdea(null);
  };

  const unsavedIdeas = ideas.filter((i) => !i.savedId);
  const savedIdeas = ideas.filter((i) => i.savedId);

  return (
    <>
      <div ref={scrollContainerRef} className="flex-1 px-4 py-4 pb-20 overflow-y-auto space-y-6">
        {/* Generation Controls */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Wand2 className="w-4 h-4" />
            Generate Ideas
          </div>

          {/* Quick filters - responsive: stack on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Any category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any category</SelectItem>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Any difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any difficulty</SelectItem>
                <SelectItem value="1">1 - Weekend</SelectItem>
                <SelectItem value="2">2 - Easy</SelectItem>
                <SelectItem value="3">3 - Moderate</SelectItem>
                <SelectItem value="4">4 - Challenging</SelectItem>
                <SelectItem value="5">5 - Complex</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto sm:ml-auto"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Random
            </Button>
          </div>

          {/* Gist input */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Or describe what you want to build:
            </p>
            <div className="flex gap-2">
              <Textarea
                value={gist}
                onChange={(e) => setGist(e.target.value)}
                placeholder="A tool that helps developers track their side projects..."
                className="min-h-[80px] flex-1"
              />
            </div>
            {gist.trim() && (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="secondary"
                className="w-full"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Lightbulb className="w-4 h-4 mr-2" />
                )}
                Generate from Description
              </Button>
            )}
          </div>
        </div>

        {/* Generated Ideas */}
        {ideas.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">
                Generated Ideas ({unsavedIdeas.length} unsaved
                {savedIdeas.length > 0 && `, ${savedIdeas.length} saved`})
              </h2>
              {unsavedIdeas.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllIdeas}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <AnimatePresence>
              {ideas.map((idea) => (
                <GeneratedIdeaCard
                  key={idea.id}
                  idea={idea}
                  onQuickSave={handleQuickSave}
                  onEditSave={handleEditSave}
                  onAutofill={autofillIdea}
                  onRemove={removeIdea}
                  onToggleExpand={toggleExpand}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty state */}
        {ideas.length === 0 && !isGenerating && (
          <div className="text-center py-12 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No ideas yet</p>
            <p className="text-sm">
              Generate random ideas or describe what you want to build
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <IdeaEditDialog
        open={!!editingIdea}
        onOpenChange={(open) => !open && setEditingIdea(null)}
        idea={editingIdea}
        onSaved={handleIdeaSaved}
      />
    </>
  );
}
