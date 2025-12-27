import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const STORAGE_KEY = "vault_chat_history";
const MAX_HISTORY_LENGTH = 50;

const initialMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm your AI thinking partner. I can help you refine ideas, explore problems, compare options, or think through your next build. What's on your mind?",
  timestamp: new Date(),
};

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const restored = parsed.map((m: ChatMessage) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(restored);
      } catch {
        // Invalid data, start fresh
        setMessages([initialMessage]);
      }
    }
  }, []);

  // Save chat history to localStorage when messages change
  useEffect(() => {
    if (messages.length > 1 || messages[0]?.id !== "welcome") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = useCallback(async (content: string, currentIdeaId?: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history for context (last 10 messages)
      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const { data, error: fnError } = await supabase.functions.invoke("ai-chat", {
        body: {
          message: content.trim(),
          conversationHistory,
          currentIdeaId,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        // Keep history manageable
        if (updated.length > MAX_HISTORY_LENGTH) {
          return updated.slice(-MAX_HISTORY_LENGTH);
        }
        return updated;
      });

    } catch (err) {
      let message = err instanceof Error ? err.message : "Failed to send message";

      if (message.includes("non-2xx") || message.includes("FunctionsHttpError")) {
        message = "AI service temporarily unavailable. Please try again.";
      }

      setError(message);
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: message,
      });

      // Remove the user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast]);

  const clearHistory = useCallback(() => {
    setMessages([initialMessage]);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Chat cleared",
      description: "Conversation history has been reset.",
    });
  }, [toast]);

  return {
    messages,
    sendMessage,
    clearHistory,
    isLoading,
    error,
  };
}
