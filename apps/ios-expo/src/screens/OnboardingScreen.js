import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { supabase } from '../../../shared/lib/supabase';

const steps = [
  { key: 'user_type', label: 'Who are you?', placeholder: 'Founder, builder, creator...' },
  { key: 'goals', label: 'Main goals', placeholder: 'Ship faster, validate ideas...' },
  { key: 'tools', label: 'Tools you use', placeholder: 'Lovable, Replit, Cursor...' },
  { key: 'weekly_hours', label: 'Weekly commitment', placeholder: '10 hours/week' },
  { key: 'first_idea', label: 'First idea title', placeholder: 'Focus companion' },
];

export default function OnboardingScreen({ navigation }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState({ user_type: '', goals: '', tools: '', weekly_hours: '', first_idea: '' });
  const [saving, setSaving] = useState(false);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Please sign in');
      setSaving(false);
      return;
    }
    await supabase
      .from('profiles')
      .update({
        user_type: form.user_type,
        goals: form.goals ? [form.goals] : null,
        tools_used: form.tools ? [form.tools] : null,
        weekly_hours: form.weekly_hours,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (form.first_idea) {
      await supabase
        .from('ideas')
        .insert({ user_id: user.id, title: form.first_idea, status: 'idea' });
    }

    setSaving(false);
    navigation.replace('MainShell');
  };

  const currentStep = steps[stepIndex];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#09090b' }} contentContainerStyle={{ padding: 24, gap: 20 }}>
      <View>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>Onboarding</Text>
        <Text style={{ color: '#9ca3af', marginTop: 8 }}>
          Step {stepIndex + 1} / {steps.length}
        </Text>
      </View>
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#27272a', padding: 16, gap: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>{currentStep.label}</Text>
        <TextInput
          placeholder={currentStep.placeholder}
          placeholderTextColor="#71717a"
          value={form[currentStep.key]}
          onChangeText={(value) => setForm((prev) => ({ ...prev, [currentStep.key]: value }))}
          style={{ borderRadius: 12, borderWidth: 1, borderColor: '#27272a', padding: 12, color: '#fff' }}
        />
      </View>
      <Pressable
        onPress={handleNext}
        style={({ pressed }) => ({ borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: pressed ? '#5b21b6' : '#7c3aed' })}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>{saving ? 'Saving…' : stepIndex === steps.length - 1 ? 'Finish' : 'Next'}</Text>
      </Pressable>
    </ScrollView>
  );
}
