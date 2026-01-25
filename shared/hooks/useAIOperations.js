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

  const suggestName = useCallback(
    async (ideaPayload) => {
      const data = await callFunction('suggest-name', ideaPayload);
      return data?.suggestions || [];
    },
    [callFunction]
  );

  const draftPitch = useCallback(
    async (ideaPayload) => {
      const data = await callFunction('draft-pitch', ideaPayload);
      return data?.suggestions || [];
    },
    [callFunction]
  );

  return {
    autofillIdea,
    scoreIdea,
    suggestName,
    draftPitch,
    isLoading: Boolean(loadingKey),
    isSuggestingName: loadingKey === 'suggest-name',
    isDraftingPitch: loadingKey === 'draft-pitch',
    isScoring: loadingKey === 'score-idea',
    isAutofilling: loadingKey === 'autofill-idea',
    loadingKey,
    error,
  };
}
