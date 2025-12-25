import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  isAI: boolean;
}

const initialMessages: Message[] = [
  {
    id: "1",
    isAI: true,
    text: "Hi! I'm your AI thinking partner. I can help you refine ideas, explore problems, or think through your next build. What's on your mind?",
  },
];

export default function AI() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      isAI: false,
    };

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: "Thanks for sharing that! AI intelligence will be layered in soon. For now, I'm here to help you organize your thinking. Try describing your idea in more detail.",
      isAI: true,
    };

    setMessages([...messages, userMessage, aiResponse]);
    setInput("");
  };

  return (
    <div className="flex-1 bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Assistant</h1>
            <p className="text-xs text-muted-foreground">Think fast, build later</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={cn(
              "flex gap-3",
              !message.isAI && "flex-row-reverse"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              message.isAI ? "bg-primary/10" : "bg-muted"
            )}>
              {message.isAI ? (
                <Bot className="w-4 h-4 text-primary" />
              ) : (
                <User className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-3",
              message.isAI 
                ? "bg-card border border-border rounded-tl-md" 
                : "bg-primary text-primary-foreground rounded-tr-md"
            )}>
              <p className="text-sm leading-relaxed">{message.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="sticky bottom-16 bg-background border-t border-border px-4 py-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your ideas..."
            className="flex-1 h-12"
          />
          <Button type="submit" size="icon" className="h-12 w-12 shrink-0">
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
