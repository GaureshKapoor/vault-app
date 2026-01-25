import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Target,
  Lightbulb,
  Layers,
  Rocket,
  Users,
} from 'lucide-react-native';
import { supabase } from '../../shared/lib/supabase';
import { useAIOperations } from '../../shared/hooks/useAIOperations';
import { colors, spacing, borderRadius, typography } from '../../shared/theme';
import { CATEGORIES, CategoryPicker } from '../components/CategoryPicker';

function ThinkingCard({ icon: Icon, title, placeholder, value, onChange }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
        <View
          style={{
            padding: 6,
            borderRadius: borderRadius.sm,
            backgroundColor: colors.primarySoft,
          }}
        >
          <Icon size={16} color={colors.primary} />
        </View>
        <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.text }}>
          {title}
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline
        style={{
          fontSize: typography.sm,
          color: colors.text,
          minHeight: 60,
          textAlignVertical: 'top',
        }}
      />
    </View>
  );
}

export default function NewIdeaScreen({ navigation, route }) {
  const inboxThought = route.params?.inboxThought;

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [mainIdea, setMainIdea] = useState(inboxThought || '');
  const [coreProblem, setCoreProblem] = useState('');
  const [coreValueProp, setCoreValueProp] = useState('');
  const [coreLoop, setCoreLoop] = useState('');
  const [mvpShape, setMvpShape] = useState('');
  const [targetUser, setTargetUser] = useState('');

  const [saving, setSaving] = useState(false);
  const { autofillIdea, isAutofilling } = useAIOperations();

  const handleAutofill = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please add a title before using AI autofill.');
      return;
    }

    const result = await autofillIdea({
      title,
      category,
      main_idea: mainIdea,
    });

    if (result) {
      // Apply suggestions
      if (result.core_problem) setCoreProblem(result.core_problem);
      if (result.core_value_proposition) setCoreValueProp(result.core_value_proposition);
      if (result.core_loop) setCoreLoop(result.core_loop);
      if (result.mvp_shape) setMvpShape(result.mvp_shape);
      if (result.target_user) setTargetUser(result.target_user);
      Alert.alert('Fields updated', 'AI suggestions have been applied.');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please add a title for your idea.');
      return;
    }
    if (!mainIdea.trim()) {
      Alert.alert('Description required', 'Please add a description for your idea.');
      return;
    }
    if (!category) {
      Alert.alert('Category required', 'Please select a category for your idea.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Not signed in');
        setSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from('ideas')
        .insert({
          user_id: user.id,
          title: title.trim(),
          category: category,
          main_idea: mainIdea.trim(),
          description: mainIdea.trim(),
          core_problem: coreProblem.trim() || mainIdea.trim(),
          core_value_proposition: coreValueProp.trim() || mainIdea.trim(),
          core_loop: coreLoop.trim() || null,
          mvp_shape: mvpShape.trim() || null,
          target_user: targetUser.trim() || null,
          status: 'idea',
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Idea created!', 'Your new idea has been saved.');
      navigation.navigate('IdeaDetail', { ideaId: data.id });
    } catch (error) {
      console.error('Error saving idea:', error);
      Alert.alert('Error saving', 'Could not save idea. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCategoryObj = CATEGORIES.find((c) => c.id === category);

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
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            padding: spacing.sm,
            borderRadius: borderRadius.sm,
            backgroundColor: pressed ? colors.secondary : 'transparent',
          })}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: typography.lg, fontWeight: typography.semibold, color: colors.text }}>
          New Idea
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.sm,
            backgroundColor: pressed ? colors.primaryStrong : colors.primary,
            opacity: saving ? 0.5 : 1,
          })}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Save size={16} color={colors.white} />
          )}
          <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: colors.white }}>
            Save
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.md, gap: spacing.lg, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Identity Section */}
          <View style={{ gap: spacing.md }}>
            {/* Title & Category Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Project name"
                placeholderTextColor={colors.mutedForeground}
                style={{
                  flex: 1,
                  minWidth: 150,
                  fontSize: typography['2xl'],
                  fontWeight: typography.bold,
                  color: colors.text,
                  borderBottomWidth: 2,
                  borderBottomColor: colors.primary,
                  paddingVertical: spacing.xs,
                }}
              />
              <Pressable
                onPress={() => {
                  // Show category modal
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.primarySoft,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {selectedCategoryObj?.Icon && (
                  <selectedCategoryObj.Icon size={14} color={colors.primary} />
                )}
                <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: colors.primary }}>
                  {category || 'Select category'}
                </Text>
              </Pressable>
            </View>

            {/* Category Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  const IconComp = cat.Icon;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCategory(cat.id)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: borderRadius.full,
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <IconComp size={14} color={isSelected ? colors.white : colors.text} />
                      <Text
                        style={{
                          fontSize: typography.sm,
                          fontWeight: typography.medium,
                          color: isSelected ? colors.white : colors.text,
                        }}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Main Idea */}
            <View
              style={{
                backgroundColor: colors.primarySoft,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.primary + '20',
              }}
            >
              <TextInput
                value={mainIdea}
                onChangeText={setMainIdea}
                placeholder="Describe your main idea in one sentence..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={{
                  fontSize: typography.base,
                  color: colors.text,
                  minHeight: 60,
                  textAlignVertical: 'top',
                }}
              />
            </View>
          </View>

          {/* Autofill Button */}
          <Pressable
            onPress={handleAutofill}
            disabled={isAutofilling}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: pressed ? colors.card : colors.background,
              opacity: isAutofilling ? 0.5 : 1,
            })}
          >
            {isAutofilling ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Sparkles size={16} color={colors.primary} />
            )}
            <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.primary }}>
              {isAutofilling ? 'Generating...' : 'Autofill with AI'}
            </Text>
          </Pressable>

          {/* Thinking Framework */}
          <View style={{ gap: spacing.md }}>
            <Text
              style={{
                fontSize: typography.xs,
                fontWeight: typography.semibold,
                color: colors.text,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Thinking Framework
            </Text>

            <ThinkingCard
              icon={Target}
              title="Core Problem"
              placeholder="What problem are you solving?"
              value={coreProblem}
              onChange={setCoreProblem}
            />

            <ThinkingCard
              icon={Lightbulb}
              title="Value Proposition"
              placeholder="What's the unique value you offer?"
              value={coreValueProp}
              onChange={setCoreValueProp}
            />

            <ThinkingCard
              icon={Layers}
              title="Core Loop"
              placeholder="What's the repeatable user action?"
              value={coreLoop}
              onChange={setCoreLoop}
            />

            <ThinkingCard
              icon={Rocket}
              title="MVP Shape"
              placeholder="What's the simplest version you can build?"
              value={mvpShape}
              onChange={setMvpShape}
            />
          </View>

          {/* Target User */}
          <View style={{ gap: spacing.md }}>
            <Text
              style={{
                fontSize: typography.xs,
                fontWeight: typography.semibold,
                color: colors.text,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Target User
            </Text>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                <View
                  style={{
                    padding: 6,
                    borderRadius: borderRadius.sm,
                    backgroundColor: colors.primarySoft,
                  }}
                >
                  <Users size={16} color={colors.primary} />
                </View>
                <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.text }}>
                  Who is this for?
                </Text>
              </View>
              <TextInput
                value={targetUser}
                onChangeText={setTargetUser}
                placeholder="Describe your ideal user..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={{
                  fontSize: typography.sm,
                  color: colors.text,
                  minHeight: 60,
                  textAlignVertical: 'top',
                }}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
