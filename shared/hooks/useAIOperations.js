import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useAIOperations() {
  const [loadingKey, setLoadingKey] = useState(null);
  const [error, setError] = useState(null);

  const callFunction = useCallback(async (key, payload) => {
    try {
      setLoadingKey(key);
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke(key, {
        body: payload,
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI operation failed');
      throw err;
    } finally {
      setLoadingKey(null);
    }
  }, []);

  const autofillIdea = useCallback(
    async (ideaPayload) => {
      const data = await callFunction('autofill-idea', ideaPayload);
      return data;
    },
    [callFunction]
  );

  const scoreIdea = useCallback(
    async (ideaPayload) => {
      const data = await callFunction('score-idea', ideaPayload);
      return data;
    },
    [callFunction]
  );

  return {
    autofillIdea,
    scoreIdea,
    isLoading: Boolean(loadingKey),
    loadingKey,
    error,
  };
}
