import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Edit2,
  Check,
  X,
  Rocket,
  Target,
  Lightbulb,
  Layers,
  Share as ShareIcon,
  Save,
  Sparkles,
  Trash2,
  Lock,
  Unlock,
  RotateCcw,
  Zap,
  Wand2,
} from 'lucide-react-native';
import { supabase } from '../../shared/lib/supabase';
import { colors, spacing, borderRadius } from '../../shared/theme';
import { useAIOperations } from '../../shared/hooks/useAIOperations';
import { StatusBadge, STATUS_OPTIONS } from '../components/StatusBadge';
import { ThinkingCard } from '../components/ThinkingCard';
import { CATEGORIES } from '../components/CategoryPicker';

const DIFFICULTY_LABELS = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];

export default function IdeaDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const ideaId = route.params?.ideaId;

  const {
    autofillIdea,
    scoreIdea,
    suggestName,
    draftPitch,
    isLoading: isAILoading,
    isSuggestingName,
    isDraftingPitch,
    isScoring,
    isAutofilling,
  } = useAIOperations();

  const [idea, setIdea] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState({});

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAutofillModal, setShowAutofillModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);

  // AI results
  const [autofillSuggestions, setAutofillSuggestions] = useState(null);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [pitchSuggestions, setPitchSuggestions] = useState([]);

  useEffect(() => {
    if (ideaId) {
      fetchIdea();
      fetchNotes();
    }
  }, [ideaId]);

  const fetchIdea = async () => {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .single();

      if (error) throw error;
      setIdea(data);
    } catch (error) {
      console.error('Error fetching idea:', error);
      Alert.alert('Error', 'Could not load this idea.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('idea_notes')
        .select('id, content, created_at')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleFieldUpdate = (field, value) => {
    setPendingUpdates((prev) => ({ ...prev, [field]: value }));
  };

  const saveChanges = async () => {
    if (Object.keys(pendingUpdates).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const updatesToApply = idea?.is_template
        ? { ...pendingUpdates, is_template: false, sort_order: null }
        : pendingUpdates;

      const { error } = await supabase
        .from('ideas')
        .update(updatesToApply)
        .eq('id', ideaId);

      if (error) throw error;

      setIdea((prev) => (prev ? { ...prev, ...updatesToApply } : prev));
      setPendingUpdates({});
      setIsEditing(false);

      Alert.alert('Success', idea?.is_template ? "It's yours now!" : 'Changes saved');
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'Could not save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('idea_notes')
        .insert({
          idea_id: ideaId,
          user_id: user.id,
          content: newNote.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setNotes((prev) => [data, ...prev]);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Could not add note.');
    }
  };

  const handleCheckToggle = async (checkField) => {
    if (!idea) return;

    const newValue = !idea[checkField];

    try {
      const { error } = await supabase
        .from('ideas')
        .update({ [checkField]: newValue })
        .eq('id', ideaId);

      if (error) throw error;

      setIdea((prev) => (prev ? { ...prev, [checkField]: newValue } : prev));
    } catch (error) {
      console.error('Error updating check:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!idea) return;

    try {
      if (newStatus === 'building' && idea.status !== 'building') {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: buildingIdeas } = await supabase
            .from('ideas')
            .select('id, title')
            .eq('user_id', user.id)
            .eq('status', 'building')
            .neq('id', idea.id);

          if (buildingIdeas && buildingIdeas.length > 0) {
            Alert.alert(
              'One idea at a time',
              `You can only have one idea in "Building" status. "${buildingIdeas[0].title}" is currently being built.`
            );
            setShowStatusModal(false);
            return;
          }
        }
      }

      const { error } = await supabase.from('ideas').update({ status: newStatus }).eq('id', ideaId);

      if (error) throw error;

      setIdea((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Could not update status.');
    }
  };

  const handleArchive = async () => {
    Alert.alert('Archive Idea', 'This idea will be moved to archived. You can restore it later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('ideas').update({ status: 'archived' }).eq('id', ideaId);
            if (error) throw error;
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Could not archive idea.');
          }
        },
      },
    ]);
  };

  const handleRestore = async () => {
    try {
      const { error } = await supabase.from('ideas').update({ status: 'idea' }).eq('id', ideaId);
      if (error) throw error;
      setIdea((prev) => (prev ? { ...prev, status: 'idea' } : prev));
      Alert.alert('Restored', 'Idea is back in your active list.');
    } catch (error) {
      Alert.alert('Error', 'Could not restore idea.');
    }
  };

  const handleMakeItYours = async () => {
    try {
      const { error } = await supabase.from('ideas').update({ is_template: false }).eq('id', ideaId);
      if (error) throw error;
      setIdea((prev) => (prev ? { ...prev, is_template: false } : prev));
      Alert.alert('Success', "It's yours now! You can edit and customize this idea.");
    } catch (error) {
      Alert.alert('Error', 'Could not update idea.');
    }
  };

  const handleAutofill = async () => {
    if (!idea) return;

    try {
      const result = await autofillIdea({
        title: idea.title,
        category: idea.category || undefined,
        main_idea: idea.main_idea || idea.description || undefined,
      });

      if (result) {
        setAutofillSuggestions(result);
        setShowAutofillModal(true);
      }
    } catch (error) {
      Alert.alert('Error', 'AI autofill failed.');
    }
  };

  const handleApplyAutofill = async (selectedFields) => {
    if (!idea) return;

    try {
      const updates = idea.is_template
        ? { ...selectedFields, is_template: false, sort_order: null }
        : selectedFields;

      const { error } = await supabase.from('ideas').update(updates).eq('id', idea.id);

      if (error) throw error;

      setIdea((prev) => (prev ? { ...prev, ...updates } : prev));
      setShowAutofillModal(false);
      Alert.alert('Success', `Applied ${Object.keys(selectedFields).length} AI suggestions.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to apply suggestions.');
    }
  };

  const handleScore = async () => {
    if (!idea) return;

    try {
      const result = await scoreIdea({
        title: idea.title,
        description: idea.description || undefined,
        category: idea.category || undefined,
        core_problem: idea.core_problem,
        core_value_proposition: idea.core_value_proposition,
        core_loop: idea.core_loop || undefined,
        mvp_shape: idea.mvp_shape || undefined,
        target_user: idea.target_user || undefined,
      });

      if (result) {
        const scoreUpdates = {
          ai_score: result.ai_score,
          ai_reasoning: result.ai_reasoning,
          difficulty: result.suggested_difficulty,
          priority: result.suggested_priority,
          sprint_fit: result.suggested_sprint_fit,
        };

        const updates = idea.is_template
          ? { ...scoreUpdates, is_template: false, sort_order: null }
          : scoreUpdates;

        const { error } = await supabase.from('ideas').update(updates).eq('id', idea.id);

        if (error) throw error;

        setIdea((prev) => (prev ? { ...prev, ...updates } : prev));
        Alert.alert('Scored!', `AI Score: ${result.ai_score}/10`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to score idea.');
    }
  };

  const handleSuggestName = async () => {
    if (!idea) return;

    try {
      const result = await suggestName({
        main_idea: idea.main_idea || idea.description || undefined,
        description: idea.description || undefined,
        category: idea.category || undefined,
        core_problem: idea.core_problem || undefined,
      });

      if (result && result.length > 0) {
        setNameSuggestions(result);
        setShowNameModal(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get name suggestions.');
    }
  };

  const handleSelectName = async (name) => {
    setShowNameModal(false);

    try {
      const updates = idea?.is_template
        ? { title: name, is_template: false, sort_order: null }
        : { title: name };

      const { error } = await supabase.from('ideas').update(updates).eq('id', ideaId);

      if (error) throw error;

      setIdea((prev) => (prev ? { ...prev, ...updates } : prev));
    } catch (error) {
      Alert.alert('Error', 'Could not update name.');
    }
  };

  const handleDraftPitch = async () => {
    if (!idea) return;

    try {
      const result = await draftPitch({
        title: idea.title,
        category: idea.category || undefined,
        description: idea.main_idea || idea.description || undefined,
        core_problem: idea.core_problem || undefined,
        core_value_proposition: idea.core_value_proposition || undefined,
      });

      if (result && result.length > 0) {
        setPitchSuggestions(result);
        setShowPitchModal(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to draft pitch.');
    }
  };

  const handleSelectPitch = async (pitch) => {
    setShowPitchModal(false);

    try {
      const updates = idea?.is_template
        ? { main_idea: pitch, is_template: false, sort_order: null }
        : { main_idea: pitch };

      const { error } = await supabase.from('ideas').update(updates).eq('id', ideaId);

      if (error) throw error;

      setIdea((prev) => (prev ? { ...prev, ...updates } : prev));
    } catch (error) {
      Alert.alert('Error', 'Could not update pitch.');
    }
  };

  const handleShare = async () => {
    if (!idea) return;

    const summary = [
      `Vault Idea — ${idea.title || 'Untitled'}`,
      '',
      `${idea.category || 'Uncategorized'} | Status: ${idea.status} | AI Score: ${idea.ai_score ?? 'N/A'}`,
      '',
      idea.main_idea ? `Summary: ${idea.main_idea}` : null,
      '',
      'Core Thinking:',
      `• Problem: ${idea.core_problem || 'Not defined'}`,
      `• Value Prop: ${idea.core_value_proposition || 'Not defined'}`,
      `• Core Loop: ${idea.core_loop || 'Not defined'}`,
      `• MVP Shape: ${idea.mvp_shape || 'Not defined'}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Share.share({ message: summary });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!idea) return null;

  const isTemplate = idea.is_template;
  const canEdit = !isTemplate;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} style={{ padding: spacing.sm, marginLeft: -spacing.sm }}>
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Pressable onPress={handleShare} style={{ padding: spacing.sm }}>
            <ShareIcon size={20} color={colors.mutedForeground} />
          </Pressable>

          {idea.status !== 'archived' && (
            <Pressable onPress={handleArchive} style={{ padding: spacing.sm }}>
              <Trash2 size={20} color={colors.mutedForeground} />
            </Pressable>
          )}

          {idea.status === 'archived' && (
            <Pressable
              onPress={handleRestore}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: borderRadius.sm,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <RotateCcw size={16} color={colors.foreground} />
              <Text style={{ color: colors.foreground, fontWeight: '500' }}>Restore</Text>
            </Pressable>
          )}

          {canEdit &&
            (isEditing ? (
              <Pressable
                onPress={saveChanges}
                disabled={isSaving}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: borderRadius.sm,
                  backgroundColor: colors.primary,
                }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Save size={16} color={colors.primaryForeground} />
                )}
                <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Save</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setIsEditing(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                }}
              >
                <Edit2 size={16} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, fontWeight: '500' }}>Edit</Text>
              </Pressable>
            ))}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.lg, paddingBottom: 100 }}>
          {/* Template Banner */}
          {isTemplate && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.muted,
                borderRadius: borderRadius.md,
                padding: spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Lock size={16} color={colors.mutedForeground} />
                <Text style={{ fontSize: 13, color: colors.mutedForeground, flex: 1 }}>
                  Template idea. Make it yours to edit.
                </Text>
              </View>
              <Pressable
                onPress={handleMakeItYours}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: borderRadius.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Unlock size={14} color={colors.foreground} />
                <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: '500' }}>Make yours</Text>
              </Pressable>
            </View>
          )}

          {/* Identity Section */}
          <View style={{ gap: 12 }}>
            {/* Title Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isEditing ? (
                <TextInput
                  defaultValue={idea.title}
                  onChangeText={(text) => handleFieldUpdate('title', text)}
                  style={{
                    flex: 1,
                    fontSize: 24,
                    fontWeight: '700',
                    color: colors.foreground,
                    borderBottomWidth: 2,
                    borderBottomColor: colors.primary,
                    paddingBottom: 4,
                  }}
                  placeholder="Project name"
                  placeholderTextColor={colors.mutedForeground}
                />
              ) : (
                <Text style={{ flex: 1, fontSize: 24, fontWeight: '700', color: colors.foreground }}>
                  {idea.title}
                </Text>
              )}
              <Pressable onPress={handleSuggestName} disabled={isSuggestingName} style={{ padding: 8 }}>
                {isSuggestingName ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Wand2 size={20} color={colors.primary} />
                )}
              </Pressable>
            </View>

            {/* Category */}
            {isEditing ? (
              <Pressable
                onPress={() => setShowCategoryModal(true)}
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: borderRadius.full,
                  backgroundColor: `${colors.primary}15`,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
                  {idea.category || 'Select category'}
                </Text>
              </Pressable>
            ) : (
              idea.category && (
                <View
                  style={{
                    alignSelf: 'flex-start',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: borderRadius.full,
                    backgroundColor: `${colors.primary}15`,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>{idea.category}</Text>
                </View>
              )
            )}

            {/* Main Idea / Pitch */}
            <View
              style={{
                backgroundColor: colors.primarySoft,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: `${colors.primary}20`,
                padding: spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  {isEditing ? (
                    <TextInput
                      defaultValue={idea.main_idea || idea.description || ''}
                      onChangeText={(text) => handleFieldUpdate('main_idea', text)}
                      multiline
                      style={{
                        color: colors.foreground,
                        fontSize: 15,
                        lineHeight: 22,
                        minHeight: 60,
                      }}
                      placeholder="Main idea sentence..."
                      placeholderTextColor={colors.mutedForeground}
                    />
                  ) : (
                    <Text style={{ color: colors.foreground, fontSize: 15, lineHeight: 22 }}>
                      {idea.main_idea || idea.description || 'No description provided'}
                    </Text>
                  )}
                </View>
                <Pressable onPress={handleDraftPitch} disabled={isDraftingPitch} style={{ padding: 4 }}>
                  {isDraftingPitch ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Sparkles size={18} color={colors.primary} />
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          {/* Status & Details Section */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground, letterSpacing: 1 }}>
              STATUS & DETAILS
            </Text>

            {/* AI Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={handleScore}
                disabled={isScoring}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: borderRadius.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: pressed ? colors.card : 'transparent',
                })}
              >
                {isScoring ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Zap size={16} color={colors.primary} />
                )}
                <Text style={{ color: colors.foreground, fontWeight: '500' }}>
                  {isScoring ? 'Scoring...' : idea.ai_score !== null ? 'Re-score' : 'Score'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleAutofill}
                disabled={isAutofilling}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: borderRadius.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: pressed ? colors.card : 'transparent',
                })}
              >
                {isAutofilling ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Sparkles size={16} color={colors.primary} />
                )}
                <Text style={{ color: colors.foreground, fontWeight: '500' }}>
                  {isAutofilling ? '...' : 'Autofill'}
                </Text>
              </Pressable>
            </View>

            {/* AI Score Display */}
            <View
              style={{
                backgroundColor: `${colors.primary}10`,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: `${colors.primary}30`,
                padding: spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, letterSpacing: 1 }}>AI SCORE</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                    <Text style={{ fontSize: 32, fontWeight: '700', color: colors.primary }}>
                      {idea.ai_score !== null ? idea.ai_score.toFixed(1) : '—'}
                    </Text>
                    <Text style={{ fontSize: 16, color: colors.mutedForeground }}>/10</Text>
                  </View>
                </View>
                {idea.ai_score !== null && (
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: borderRadius.full,
                      backgroundColor:
                        idea.ai_score >= 7
                          ? 'rgba(34, 197, 94, 0.2)'
                          : idea.ai_score >= 5
                          ? 'rgba(234, 179, 8, 0.2)'
                          : 'rgba(113, 113, 122, 0.2)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color:
                          idea.ai_score >= 7 ? '#4ade80' : idea.ai_score >= 5 ? '#fbbf24' : colors.mutedForeground,
                      }}
                    >
                      {idea.ai_score >= 7 ? 'Strong' : idea.ai_score >= 5 ? 'Moderate' : 'Needs Work'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* AI Reasoning */}
            {idea.ai_reasoning && (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.md,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.mutedForeground, letterSpacing: 1, marginBottom: 8 }}>
                  AI REASONING
                </Text>
                <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>{idea.ai_reasoning}</Text>
              </View>
            )}

            {/* Stats Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {/* Status */}
              <View
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: colors.card,
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.sm,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 6 }}>Status</Text>
                {idea.status !== 'archived' ? (
                  <Pressable onPress={() => setShowStatusModal(true)}>
                    <StatusBadge status={idea.status} interactive />
                  </Pressable>
                ) : (
                  <StatusBadge status={idea.status} />
                )}
              </View>

              {/* Sprint Fit */}
              <View
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: colors.card,
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.sm,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 6 }}>Sprint Fit</Text>
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.foreground }}>
                  {idea.sprint_fit ? `${idea.sprint_fit}/5` : '—'}
                </Text>
              </View>

              {/* Difficulty */}
              <View
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: colors.card,
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.sm,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 6 }}>Difficulty</Text>
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.foreground }}>
                  {idea.difficulty ? DIFFICULTY_LABELS[idea.difficulty] : '—'}
                </Text>
              </View>

              {/* Priority */}
              <View
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: colors.card,
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.sm,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 6 }}>Priority</Text>
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.foreground }}>
                  {idea.priority ? `${idea.priority}/5` : '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* Core Thinking Section */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground, letterSpacing: 1 }}>
              CORE THINKING
            </Text>

            <ThinkingCard
              icon={Target}
              title="Core Problem"
              content={idea.core_problem}
              isEditing={isEditing}
              field="core_problem"
              onUpdate={handleFieldUpdate}
            />
            <ThinkingCard
              icon={Lightbulb}
              title="Core Product → Value Prop"
              content={idea.core_value_proposition}
              isEditing={isEditing}
              field="core_value_proposition"
              onUpdate={handleFieldUpdate}
            />
            <ThinkingCard
              icon={Layers}
              title="Core Loop"
              content={idea.core_loop || ''}
              isEditing={isEditing}
              field="core_loop"
              onUpdate={handleFieldUpdate}
            />
            <ThinkingCard
              icon={Rocket}
              title="MVP Shape"
              content={idea.mvp_shape || ''}
              isEditing={isEditing}
              field="mvp_shape"
              onUpdate={handleFieldUpdate}
            />
          </View>

          {/* Readiness Checks */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground, letterSpacing: 1 }}>
              READINESS CHECK
            </Text>

            {[
              { label: 'One clear consumer problem', field: 'check_clear_problem', checked: idea.check_clear_problem },
              { label: 'One simple core loop', field: 'check_simple_loop', checked: idea.check_simple_loop },
              { label: 'One deployable MVP shape', field: 'check_deployable_mvp', checked: idea.check_deployable_mvp },
            ].map((check, index) => (
              <Pressable
                key={index}
                onPress={() => handleCheckToggle(check.field)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: colors.card,
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.sm,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: check.checked ? colors.status.building : colors.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {check.checked ? (
                    <Check size={14} color={colors.primaryForeground} />
                  ) : (
                    <X size={14} color={colors.mutedForeground} />
                  )}
                </View>
                <Text style={{ fontSize: 14, color: check.checked ? colors.foreground : colors.mutedForeground }}>
                  {check.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Notes Section */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground, letterSpacing: 1 }}>NOTES</Text>

            {/* Add Note */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
              }}
            >
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder="Add a note..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={{
                  color: colors.foreground,
                  fontSize: 14,
                  lineHeight: 20,
                  minHeight: 60,
                }}
              />
              {newNote.trim() && (
                <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
                  <Pressable
                    onPress={addNote}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      backgroundColor: colors.primary,
                      borderRadius: borderRadius.sm,
                    }}
                  >
                    <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Add Note</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Existing Notes */}
            {notes.map((note) => (
              <View
                key={note.id}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.md,
                }}
              >
                <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>{note.content}</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 8 }}>
                  {new Date(note.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA Button */}
          <Pressable
            onPress={() => navigation.navigate('StartBuilding')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 16,
              borderRadius: borderRadius.lg,
              backgroundColor: pressed ? colors.primaryStrong : colors.primary,
            })}
          >
            <Rocket size={20} color={colors.primaryForeground} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primaryForeground }}>Start Building</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Status Modal */}
      <Modal visible={showStatusModal} transparent animationType="fade" onRequestClose={() => setShowStatusModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowStatusModal(false)}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              paddingVertical: spacing.md,
              paddingBottom: spacing.xxl,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>Change Status</Text>
              <Pressable onPress={() => setShowStatusModal(false)} style={{ padding: spacing.sm }}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleStatusChange(option.value)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  backgroundColor: pressed || idea.status === option.value ? colors.card : 'transparent',
                })}
              >
                <StatusBadge status={option.value} />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowCategoryModal(false)}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              paddingVertical: spacing.md,
              paddingBottom: spacing.xxl,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>Select Category</Text>
              <Pressable onPress={() => setShowCategoryModal(false)} style={{ padding: spacing.sm }}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    handleFieldUpdate('category', cat.id);
                    setIdea((prev) => (prev ? { ...prev, category: cat.id } : prev));
                    setShowCategoryModal(false);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    backgroundColor: pressed || idea.category === cat.id ? colors.card : 'transparent',
                  })}
                >
                  <cat.Icon size={20} color={idea.category === cat.id ? colors.primary : colors.foreground} />
                  <Text
                    style={{
                      fontSize: 16,
                      color: idea.category === cat.id ? colors.primary : colors.foreground,
                    }}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Autofill Preview Modal */}
      <Modal
        visible={showAutofillModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAutofillModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowAutofillModal(false)}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              paddingVertical: spacing.md,
              paddingBottom: spacing.xxl,
              maxHeight: '80%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} color={colors.primary} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>AI Suggestions</Text>
              </View>
              <Pressable onPress={() => setShowAutofillModal(false)} style={{ padding: spacing.sm }}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.md, gap: 12 }}>
              {autofillSuggestions && (
                <>
                  {autofillSuggestions.core_problem && (
                    <View style={{ gap: 4 }}>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Core Problem</Text>
                      <Text style={{ fontSize: 14, color: colors.foreground }}>{autofillSuggestions.core_problem}</Text>
                    </View>
                  )}
                  {autofillSuggestions.core_value_proposition && (
                    <View style={{ gap: 4 }}>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Value Proposition</Text>
                      <Text style={{ fontSize: 14, color: colors.foreground }}>
                        {autofillSuggestions.core_value_proposition}
                      </Text>
                    </View>
                  )}
                  {autofillSuggestions.core_loop && (
                    <View style={{ gap: 4 }}>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Core Loop</Text>
                      <Text style={{ fontSize: 14, color: colors.foreground }}>{autofillSuggestions.core_loop}</Text>
                    </View>
                  )}
                  {autofillSuggestions.mvp_shape && (
                    <View style={{ gap: 4 }}>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>MVP Shape</Text>
                      <Text style={{ fontSize: 14, color: colors.foreground }}>{autofillSuggestions.mvp_shape}</Text>
                    </View>
                  )}
                  {autofillSuggestions.target_user && (
                    <View style={{ gap: 4 }}>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Target User</Text>
                      <Text style={{ fontSize: 14, color: colors.foreground }}>{autofillSuggestions.target_user}</Text>
                    </View>
                  )}

                  <Pressable
                    onPress={() => handleApplyAutofill(autofillSuggestions)}
                    style={{
                      marginTop: spacing.md,
                      paddingVertical: 14,
                      backgroundColor: colors.primary,
                      borderRadius: borderRadius.md,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Apply All Suggestions</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Name Suggestions Modal */}
      <Modal visible={showNameModal} transparent animationType="fade" onRequestClose={() => setShowNameModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowNameModal(false)}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              paddingVertical: spacing.md,
              paddingBottom: spacing.xxl,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Wand2 size={20} color={colors.primary} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>Name Suggestions</Text>
              </View>
              <Pressable onPress={() => setShowNameModal(false)} style={{ padding: spacing.sm }}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={{ padding: spacing.md, gap: 12 }}>
              {nameSuggestions.map((suggestion, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSelectName(suggestion.name)}
                  style={({ pressed }) => ({
                    padding: spacing.md,
                    borderRadius: borderRadius.lg,
                    borderWidth: 1,
                    borderColor: pressed ? colors.primary : colors.border,
                    backgroundColor: pressed ? `${colors.primary}10` : 'transparent',
                  })}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{suggestion.name}</Text>
                  <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>{suggestion.reason}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Pitch Suggestions Modal */}
      <Modal visible={showPitchModal} transparent animationType="fade" onRequestClose={() => setShowPitchModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowPitchModal(false)}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              paddingVertical: spacing.md,
              paddingBottom: spacing.xxl,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} color={colors.primary} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>Draft Pitch</Text>
              </View>
              <Pressable onPress={() => setShowPitchModal(false)} style={{ padding: spacing.sm }}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.md, gap: 12 }}>
              {pitchSuggestions.map((suggestion, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSelectPitch(suggestion.pitch)}
                  style={({ pressed }) => ({
                    padding: spacing.md,
                    borderRadius: borderRadius.lg,
                    borderWidth: 1,
                    borderColor: pressed ? colors.primary : colors.border,
                    backgroundColor: pressed ? `${colors.primary}10` : 'transparent',
                  })}
                >
                  <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>{suggestion.pitch}</Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.mutedForeground,
                      marginTop: 8,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    {suggestion.tone}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
