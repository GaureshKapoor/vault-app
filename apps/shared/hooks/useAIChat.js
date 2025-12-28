import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

const STORAGE_KEY = 'vault-ios-ai-history';
const MAX_HISTORY = 50;

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hi! I am your calm, analytical Vault AI partner. Ask for prioritization, critiques, or blockers.',
  createdAt: new Date().toISOString(),
};

export function useAIChat() {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!value) return;
      try {
        const parsed = JSON.parse(value);
        setMessages(parsed);
      } catch (err) {
        console.warn('Failed to parse AI chat history', err);
      }
    });
  }, []);

  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome') return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages)).catch((err) =>
      console.warn('Failed to persist AI chat history', err)
    );
  }, [messages]);

  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim()) return;
      const newMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setIsLoading(true);
      setError(null);

      const conversationHistory = [...messages, newMessage]
        .slice(-10)
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const { data, error: fnError } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: newMessage.content,
          conversationHistory,
        },
      });

      if (fnError || data?.error) {
        setError(fnError?.message || data?.error || 'AI chat unavailable.');
        setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
        setIsLoading(false);
        return;
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        if (updated.length > MAX_HISTORY) {
          return updated.slice(-MAX_HISTORY);
        }
        return updated;
      });
      setIsLoading(false);
    },
    [messages]
  );

  const clearHistory = useCallback(() => {
    setMessages([welcomeMessage]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => null);
  }, []);

  return {
    messages,
    sendMessage,
    clearHistory,
    isLoading,
    error,
  };
}
