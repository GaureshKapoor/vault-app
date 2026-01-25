import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

const STORAGE_KEY = 'vault_generated_ideas';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper to ensure we have a valid session before making AI calls
async function ensureValidSession() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.warn('Invalid session detected:', error?.message);
    await supabase.auth.signOut();
    return false;
  }

  return true;
}

export function useIdeaGeneration() {
  const [ideas, setIdeas] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Track if component is mounted to avoid state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load ideas from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const restored = parsed.map((idea) => ({
            ...idea,
            generatedAt: new Date(idea.generatedAt),
            isAutofilling: false,
            isSaving: false,
          }));
          setIdeas(restored);
        } catch {
          setIdeas([]);
        }
      }
    });
  }, []);

  // Save ideas to AsyncStorage when they change
  useEffect(() => {
    if (ideas.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ideas)).catch(console.error);
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch(console.error);
    }
  }, [ideas]);

  const generateIdeas = useCallback(async (options = {}) => {
    const hasValidSession = await ensureValidSession();
    if (!hasValidSession) {
      Alert.alert('Session Expired', 'Please sign in again to use AI features.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const mode = options.gist ? 'guided' : 'quick';
      const count = options.count || (options.gist ? 1 : 3);

      const { data, error: fnError } = await supabase.functions.invoke('generate-idea', {
        body: {
          mode,
          category: options.category,
          difficulty: options.difficulty,
          gist: options.gist,
          count,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const newIdeas = data.ideas.map((idea) => ({
        id: generateUUID(),
        title: idea.title,
        category: idea.category,
        description: idea.description,
        difficulty: idea.difficulty,
        isExpanded: false,
        isAutofilling: false,
        isSaving: false,
        generatedAt: new Date(),
      }));

      // Only update state if still mounted
      if (!isMountedRef.current) return;

      setIdeas((prev) => [...newIdeas, ...prev]);

      Alert.alert(
        'Ideas Generated',
        `Generated ${newIdeas.length} idea${newIdeas.length > 1 ? 's' : ''}. Review and save the ones you like.`
      );
    } catch (err) {
      // Only show error if still mounted
      if (!isMountedRef.current) return;

      let message = err instanceof Error ? err.message : 'Failed to generate ideas';

      if (message.includes('non-2xx') || message.includes('FunctionsHttpError')) {
        message = 'AI service temporarily unavailable. Please try again.';
      }

      setError(message);
      Alert.alert('Generation Error', message);
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  }, []);

  const autofillIdea = useCallback(async (ideaId) => {
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea || idea.fullDetails) return;

    const hasValidSession = await ensureValidSession();
    if (!hasValidSession) {
      Alert.alert('Session Expired', 'Please sign in again to use AI features.');
      return;
    }

    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, isAutofilling: true } : i))
    );

    try {
      const { data, error: fnError } = await supabase.functions.invoke('autofill-idea', {
        body: {
          title: idea.title,
          category: idea.category,
          main_idea: idea.description,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setIdeas((prev) =>
        prev.map((i) =>
          i.id === ideaId
            ? { ...i, fullDetails: data, isExpanded: true, isAutofilling: false }
            : i
        )
      );

      Alert.alert('Details Filled', 'Full idea details have been generated.');
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Failed to autofill';

      if (message.includes('non-2xx') || message.includes('FunctionsHttpError')) {
        message = 'AI service temporarily unavailable. Please try again.';
      }

      setIdeas((prev) =>
        prev.map((i) => (i.id === ideaId ? { ...i, isAutofilling: false } : i))
      );

      Alert.alert('Autofill Error', message);
    }
  }, [ideas]);

  const quickSave = useCallback(async (ideaId) => {
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea || idea.savedId) return null;

    const hasValidSession = await ensureValidSession();
    if (!hasValidSession) {
      Alert.alert('Session Expired', 'Please sign in again.');
      return null;
    }

    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, isSaving: true } : i))
    );

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const ideaData = {
        user_id: user.id,
        title: idea.title,
        category: idea.category || null,
        description: idea.description,
        main_idea: idea.description,
        status: 'idea',
        core_problem: idea.fullDetails?.core_problem || idea.description,
        core_value_proposition: idea.fullDetails?.core_value_proposition || idea.description,
        core_loop: idea.fullDetails?.core_loop || null,
        mvp_shape: idea.fullDetails?.mvp_shape || null,
        target_user: idea.fullDetails?.target_user || null,
        difficulty: idea.fullDetails?.difficulty || idea.difficulty,
        priority: idea.fullDetails?.priority || null,
        sprint_fit: idea.fullDetails?.sprint_fit || null,
      };

      const { data, error: insertError } = await supabase
        .from('ideas')
        .insert(ideaData)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setIdeas((prev) =>
        prev.map((i) => (i.id === ideaId ? { ...i, savedId: data.id, isSaving: false } : i))
      );

      Alert.alert('Idea Saved!', 'Scoring your idea...');

      // Auto-score the saved idea in the background
      try {
        const { data: scoreData, error: scoreError } = await supabase.functions.invoke(
          'score-idea',
          {
            body: {
              title: idea.title,
              category: idea.category,
              description: idea.description,
              core_problem: idea.fullDetails?.core_problem || idea.description,
              core_value_proposition: idea.fullDetails?.core_value_proposition || idea.description,
              core_loop: idea.fullDetails?.core_loop || null,
              mvp_shape: idea.fullDetails?.mvp_shape || null,
              target_user: idea.fullDetails?.target_user || null,
            },
          }
        );

        if (!scoreError && scoreData && !scoreData.error) {
          // Update the saved idea with the score
          await supabase
            .from('ideas')
            .update({
              ai_score: scoreData.ai_score,
              ai_reasoning: scoreData.ai_reasoning,
              difficulty: scoreData.suggested_difficulty || idea.difficulty,
              priority: scoreData.suggested_priority,
              sprint_fit: scoreData.suggested_sprint_fit,
              check_clear_problem: true,
              check_simple_loop: !!idea.fullDetails?.core_loop,
              check_deployable_mvp: !!idea.fullDetails?.mvp_shape,
            })
            .eq('id', data.id);

          Alert.alert('Idea Scored!', `AI Score: ${scoreData.ai_score}/10`);
        }
      } catch (scoreErr) {
        console.warn('Auto-scoring failed:', scoreErr);
        // Don't fail the save if scoring fails
      }

      return data.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save idea';

      setIdeas((prev) =>
        prev.map((i) => (i.id === ideaId ? { ...i, isSaving: false } : i))
      );

      Alert.alert('Save Error', message);

      return null;
    }
  }, [ideas]);

  const removeIdea = useCallback((ideaId) => {
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
  }, []);

  const clearAllIdeas = useCallback(() => {
    setIdeas([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(console.error);
    Alert.alert('Cleared', 'All generated ideas have been removed.');
  }, []);

  const toggleExpand = useCallback((ideaId) => {
    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, isExpanded: !i.isExpanded } : i))
    );
  }, []);

  const updateIdea = useCallback((ideaId, updates) => {
    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, ...updates } : i))
    );
  }, []);

  return {
    ideas,
    isGenerating,
    error,
    generateIdeas,
    autofillIdea,
    quickSave,
    removeIdea,
    clearAllIdeas,
    toggleExpand,
    updateIdea,
  };
}
