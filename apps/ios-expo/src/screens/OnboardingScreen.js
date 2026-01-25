import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  User,
  Rocket,
  Palette,
  Compass,
  BookOpen,
  Target,
  Zap,
  FolderOpen,
  Lightbulb,
  CheckCircle,
  MoreHorizontal,
  Clock,
  Sun,
  Moon,
  Bell,
  BellOff,
  Sparkles,
  Check,
} from 'lucide-react-native';
import { supabase } from '../../shared/lib/supabase';
import { VaultLogoWithText } from '../../shared/components/VaultLogo';
import { colors, spacing, borderRadius, typography, shadows } from '../../shared/theme';

const TOTAL_STEPS = 7;

// ============ Step Components ============

function StepIndicator({ currentStep, totalSteps }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === currentStep ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i <= currentStep ? colors.accentForeground : `${colors.mutedForeground}4D`,
          }}
        />
      ))}
    </View>
  );
}

function OptionCard({ icon: Icon, label, isSelected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: isSelected ? colors.accentForeground : colors.border,
        backgroundColor: isSelected ? colors.primarySoft : colors.card,
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: borderRadius.sm,
        backgroundColor: isSelected ? colors.primaryStrong : `${colors.border}CC`,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Icon size={20} color={isSelected ? colors.foreground : colors.mutedForeground} />
      </View>
      <Text style={{
        flex: 1,
        fontSize: typography.base,
        fontWeight: typography.medium,
        color: isSelected ? colors.foreground : colors.mutedForeground,
      }}>
        {label}
      </Text>
      {isSelected && (
        <View style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: colors.primaryStrong,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Check size={12} color={colors.foreground} />
        </View>
      )}
    </Pressable>
  );
}

function ChipButton({ label, isSelected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        borderRadius: borderRadius.full,
        borderWidth: 2,
        borderColor: isSelected ? colors.accentForeground : colors.border,
        backgroundColor: isSelected ? colors.primaryStrong : colors.card,
      }}
    >
      <Text style={{
        fontSize: typography.sm,
        fontWeight: typography.medium,
        color: isSelected ? colors.foreground : colors.mutedForeground,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

function SimpleCard({ label, isSelected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: isSelected ? colors.accentForeground : colors.border,
        backgroundColor: isSelected ? colors.primarySoft : colors.card,
      }}
    >
      <Text style={{
        fontSize: typography.base,
        fontWeight: typography.medium,
        color: isSelected ? colors.foreground : colors.mutedForeground,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

function IconCard({ icon: Icon, label, isSelected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: isSelected ? colors.accentForeground : colors.border,
        backgroundColor: isSelected ? colors.primarySoft : colors.card,
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <Icon size={24} color={isSelected ? colors.accentForeground : colors.mutedForeground} />
      <Text style={{
        fontSize: typography.sm,
        fontWeight: typography.medium,
        color: isSelected ? colors.foreground : colors.mutedForeground,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

// Step 0: Who Are You
function WhoAreYouStep({ data, updateData }) {
  const options = [
    { id: 'student', label: 'Student / Learning', icon: GraduationCap },
    { id: 'solo_builder', label: 'Solo builder', icon: User },
    { id: 'founder', label: 'Founder / Indie hacker', icon: Rocket },
    { id: 'creator', label: 'Creator / Writer / Designer', icon: Palette },
    { id: 'explorer', label: 'Explorer (ideas, no pressure)', icon: Compass },
  ];

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: typography['2xl'], fontWeight: typography.bold, color: colors.foreground, textAlign: 'center', marginBottom: spacing.sm }}>
          Who are you building as?
        </Text>
        <Text style={{ fontSize: typography.sm, color: colors.mutedForeground, textAlign: 'center' }}>
          Which best describes you right now?
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.foreground }}>What should we call you?</Text>
        <TextInput
          value={data.displayName}
          onChangeText={(v) => updateData('displayName', v)}
          placeholder="Your name"
          placeholderTextColor={colors.mutedForeground}
          style={{
            height: 48,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            color: colors.foreground,
            fontSize: typography.base,
          }}
        />
        <Text style={{ fontSize: typography.xs, color: colors.mutedForeground }}>We'll personalize your experience with this.</Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        {options.map((opt) => (
          <OptionCard
            key={opt.id}
            icon={opt.icon}
            label={opt.label}
            isSelected={data.userType === opt.id}
            onPress={() => updateData('userType', opt.id)}
          />
        ))}
      </View>
    </View>
  );
}

// Step 1: Experience
function ExperienceStep({ data, updateData }) {
  const experienceOptions = [
    { id: 'beginner', label: 'Just getting started' },
    { id: 'some', label: 'Some experience' },
    { id: 'experienced', label: 'Very experienced' },
  ];

  const toolOptions = [
    { id: 'lovable', label: 'Lovable' },
    { id: 'v0', label: 'v0 by Vercel' },
    { id: 'bolt', label: 'bolt.new' },
    { id: 'replit', label: 'Replit' },
    { id: 'cursor', label: 'Cursor' },
    { id: 'windsurf', label: 'Windsurf' },
    { id: 'claude_codex', label: 'Claude Code / Codex' },
    { id: 'none', label: 'None of these' },
  ];

  const toggleTool = (toolId) => {
    if (toolId === 'none') {
      updateData('toolsUsed', ['none']);
      return;
    }
    const newTools = data.toolsUsed.filter(t => t !== 'none');
    if (newTools.includes(toolId)) {
      updateData('toolsUsed', newTools.filter(t => t !== toolId));
    } else {
      updateData('toolsUsed', [...newTools, toolId]);
    }
  };

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: typography['2xl'], fontWeight: typography.bold, color: colors.foreground, textAlign: 'center', marginBottom: spacing.sm }}>
          Your building experience
        </Text>
        <Text style={{ fontSize: typography.sm, color: colors.mutedForeground, textAlign: 'center' }}>
          This helps Vault tailor how ideas are structured.
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.foreground }}>
          How experienced are you with building things?
        </Text>
        {experienceOptions.map((opt) => (
          <SimpleCard
            key={opt.id}
            label={opt.label}
            isSelected={data.buildingExperience === opt.id}
            onPress={() => updateData('buildingExperience', opt.id)}
          />
        ))}
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.foreground }}>
          Have you used any of these tools before?
        </Text>
        <Text style={{ fontSize: typography.xs, color: colors.mutedForeground }}>Select all that apply</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {toolOptions.map((opt) => (
            <ChipButton
              key={opt.id}
              label={opt.label}
              isSelected={data.toolsUsed.includes(opt.id)}
              onPress={() => toggleTool(opt.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// Step 2: Goals
function GoalsStep({ data, updateData }) {
  const options = [
    { id: 'learn', label: 'Learn how to build', icon: BookOpen },
    { id: 'decide', label: 'Decide what idea to work on next', icon: Target },
    { id: 'ship', label: 'Ship MVPs faster', icon: Zap },
    { id: 'organize', label: 'Organize and refine ideas', icon: FolderOpen },
    { id: 'explore', label: 'Explore startup ideas', icon: Lightbulb },
    { id: 'action', label: 'Turn thoughts into action', icon: CheckCircle },
    { id: 'other', label: 'Other', icon: MoreHorizontal },
  ];

  const toggleGoal = (goalId) => {
    if (data.goals.includes(goalId)) {
      updateData('goals', data.goals.filter(g => g !== goalId));
    } else {
      updateData('goals', [...data.goals, goalId]);
    }
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: typography['2xl'], fontWeight: typography.bold, color: colors.foreground, textAlign: 'center', marginBottom: spacing.sm }}>
          What do you want Vault to help you with?
        </Text>
        <Text style={{ fontSize: typography.sm, color: colors.mutedForeground, textAlign: 'center' }}>
          What are you here to do? Select all that apply.
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        {options.map((opt) => (
          <OptionCard
            key={opt.id}
            icon={opt.icon}
            label={opt.label}
            isSelected={data.goals.includes(opt.id)}
            onPress={() => toggleGoal(opt.id)}
          />
        ))}
      </View>
    </View>
  );
}

// Step 3: Time Commitment
function TimeCommitmentStep({ data, updateData }) {
  const options = [
    { id: 'less_2', label: 'Less than 2 hours per week' },
    { id: '2_5', label: '2-5 hours per week' },
    { id: '5_10', label: '5-10 hours per week' },
    { id: '10_20', label: '10-20 hours per week' },
    { id: 'all_in', label: 'All in' },
  ];

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.primarySoft,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}>
          <Clock size={24} color={colors.accentForeground} />
        </View>
        <Text style={{ fontSize: typography['2xl'], fontWeight: typography.bold, color: colors.foreground, textAlign: 'center', marginBottom: spacing.sm }}>
          Time to ideate
        </Text>
        <Text style={{ fontSize: typography.sm, color: colors.mutedForeground, textAlign: 'center' }}>
          How much time can you dedicate to finding and iterating your next big idea?
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        {options.map((opt) => (
          <SimpleCard
            key={opt.id}
            label={opt.label}
            isSelected={data.weeklyHours === opt.id}
            onPress={() => updateData('weeklyHours', opt.id)}
          />
        ))}
      </View>
    </View>
  );
}

// Step 4: Preferences
function PreferencesStep({ data, updateData }) {
  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: typography['2xl'], fontWeight: typography.bold, color: colors.foreground, textAlign: 'center', marginBottom: spacing.sm }}>
          Preferences
        </Text>
        <Text style={{ fontSize: typography.sm, color: colors.mutedForeground, textAlign: 'center' }}>
          Make Vault yours
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.foreground }}>Choose your theme</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <IconCard
            icon={Sun}
            label="Light"
            isSelected={data.theme === 'light'}
            onPress={() => updateData('theme', 'light')}
          />
          <IconCard
            icon={Moon}
            label="Dark"
            isSelected={data.theme === 'dark'}
            onPress={() => updateData('theme', 'dark')}
          />
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.foreground }}>Enable reminders and nudges?</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <IconCard
            icon={Bell}
            label="Yes"
            isSelected={data.notifications === true}
            onPress={() => updateData('notifications', true)}
          />
          <IconCard
            icon={BellOff}
            label="No"
            isSelected={data.notifications === false}
            onPress={() => updateData('notifications', false)}
          />
        </View>
      </View>
    </View>
  );
}

// Step 5: First Idea
function FirstIdeaStep({ data, updateData }) {
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.primarySoft,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}>
          <Lightbulb size={24} color={colors.accentForeground} />
        </View>
        <Text style={{ fontSize: typography['2xl'], fontWeight: typography.bold, color: colors.foreground, textAlign: 'center', marginBottom: spacing.sm }}>
          Your first idea
        </Text>
        <Text style={{ fontSize: typography.sm, color: colors.mutedForeground, textAlign: 'center' }}>
          Let's start with one idea you have right now. It doesn't need to be perfect.
        </Text>
      </View>

      <View style={{ gap: spacing.md }}>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.foreground }}>
            What's the working name of your idea?
          </Text>
          <TextInput
            value={data.ideaName}
            onChangeText={(v) => updateData('ideaName', v)}
            placeholder="AI meal planner, personal finance tracker, etc."
            placeholderTextColor={colors.mutedForeground}
            style={{
              height: 48,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              color: colors.foreground,
              fontSize: typography.base,
            }}
          />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.foreground }}>
            In a few sentences, what does this idea do?
          </Text>
          <Text style={{ fontSize: typography.xs, color: colors.mutedForeground }}>
            Who is it for? What problem does it solve?
          </Text>
          <TextInput
            value={data.ideaDescription}
            onChangeText={(v) => updateData('ideaDescription', v)}
            placeholder="Describe your idea..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{
              minHeight: 100,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              color: colors.foreground,
              fontSize: typography.base,
            }}
          />
        </View>
      </View>
    </View>
  );
}

// Step 6: Confirmation
function ConfirmationStep({ onComplete, isLoading }) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.lg }}>
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryStrong,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <CheckCircle size={40} color={colors.foreground} />
      </View>

      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: typography['2xl'], fontWeight: typography.bold, color: colors.foreground, textAlign: 'center', marginBottom: spacing.sm }}>
          Your Vault is ready.
        </Text>
        <Text style={{ fontSize: typography.sm, color: colors.mutedForeground, textAlign: 'center' }}>
          We've added your first idea. You can refine it anytime.
        </Text>
      </View>

      <Pressable
        onPress={onComplete}
        disabled={isLoading}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: pressed ? '#5b21b6' : colors.primaryStrong,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          opacity: isLoading ? 0.7 : 1,
          ...shadows.primary,
        })}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.foreground} size="small" />
        ) : (
          <Sparkles size={20} color={colors.foreground} />
        )}
        <Text style={{ color: colors.foreground, fontWeight: typography.semibold, fontSize: typography.base }}>
          {isLoading ? 'Setting up...' : 'Enter Vault'}
        </Text>
      </Pressable>
    </View>
  );
}

// ============ Main Component ============

export default function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [data, setData] = useState({
    displayName: '',
    userType: '',
    buildingExperience: '',
    toolsUsed: [],
    goals: [],
    weeklyHours: '',
    theme: 'dark',
    notifications: true,
    ideaName: '',
    ideaDescription: '',
  });

  const updateData = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!data.userType && data.displayName.trim().length > 0;
      case 1:
        return !!data.buildingExperience;
      case 2:
        return data.goals.length > 0;
      case 3:
        return !!data.weeklyHours;
      case 4:
        return true; // Preferences always valid
      case 5:
        return !!data.ideaName; // Only name required
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      navigation.navigate('Pricing');
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete(true);
  };

  const handleComplete = async (skip = false) => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile with onboarding data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: data.displayName || null,
          user_type: data.userType,
          building_experience: data.buildingExperience,
          tools_used: data.toolsUsed,
          goals: data.goals,
          weekly_hours: data.weeklyHours,
          notifications_enabled: data.notifications,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // If skipping or no idea name, don't create idea
      if (!skip && data.ideaName) {
        await supabase
          .from('ideas')
          .insert({
            user_id: user.id,
            title: data.ideaName,
            description: data.ideaDescription || null,
            core_problem: 'To be defined',
            core_value_proposition: 'To be defined',
            core_loop: 'To be defined',
            status: 'idea',
          });
      }

      // Navigator will automatically redirect to MainShell
      Alert.alert('Welcome to Vault!', 'Your workspace is ready. Let\'s build something great.');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WhoAreYouStep data={data} updateData={updateData} />;
      case 1:
        return <ExperienceStep data={data} updateData={updateData} />;
      case 2:
        return <GoalsStep data={data} updateData={updateData} />;
      case 3:
        return <TimeCommitmentStep data={data} updateData={updateData} />;
      case 4:
        return <PreferencesStep data={data} updateData={updateData} />;
      case 5:
        return <FirstIdeaStep data={data} updateData={updateData} />;
      case 6:
        return <ConfirmationStep onComplete={() => handleComplete(false)} isLoading={isLoading} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}>
          <VaultLogoWithText onPress={() => navigation.navigate('Landing')} />
          <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: spacing.lg }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* Footer Navigation */}
        {currentStep < TOTAL_STEPS - 1 && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}>
            <Pressable
              onPress={handleBack}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
            >
              <ArrowLeft size={16} color={colors.mutedForeground} />
              <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.mutedForeground }}>Back</Text>
            </Pressable>

            {/* Skip button only on FirstIdea step (step 5) */}
            {currentStep === 5 && (
              <Pressable onPress={handleSkip} disabled={isLoading}>
                <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.mutedForeground }}>Skip</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleNext}
              disabled={!canProceed()}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: canProceed() ? (pressed ? '#5b21b6' : colors.primaryStrong) : colors.border,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: borderRadius.sm,
              })}
            >
              <Text style={{
                fontSize: typography.sm,
                fontWeight: typography.semibold,
                color: canProceed() ? colors.foreground : colors.mutedForeground,
              }}>
                Continue
              </Text>
              <ArrowRight size={16} color={canProceed() ? colors.foreground : colors.mutedForeground} />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
