import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../../../shared/lib/supabase';
import { useAIOperations } from '../../../shared/hooks/useAIOperations';
import NotesSection from '../components/NotesSection';
import AISuggestButton from '../components/AISuggestButton';
import ActionDrawer from '../components/ActionDrawer';

export default function IdeaDetailScreen() {
  const route = useRoute();
  const ideaId = route.params?.ideaId;
  const { autofillIdea, scoreIdea, isLoading: aiLoading } = useAIOperations();
  const [idea, setIdea] = useState(null);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchIdea = async () => {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .single();
      if (error) {
        Alert.alert('Error loading idea', error.message);
      } else {
        setIdea(data);
      }
    };
    fetchIdea();
  }, [ideaId]);

  const handleChange = (key, value) => {
    setIdea((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!idea) return;
    setSaving(true);
    const { error } = await supabase
      .from('ideas')
      .update({
        title: idea.title,
        core_problem: idea.core_problem,
        core_value_proposition: idea.core_value_proposition,
        core_loop: idea.core_loop,
        mvp_shape: idea.mvp_shape,
        target_user: idea.target_user,
        status: idea.status,
        category: idea.category,
        description: idea.description,
      })
      .eq('id', idea.id);
    setSaving(false);
    if (error) {
      Alert.alert('Save failed', error.message);
    } else {
      Alert.alert('Saved', 'Idea updated.');
    }
  };

  const handleAutofill = async () => {
    if (!idea) return;
    const result = await autofillIdea({
      title: idea.title,
      category: idea.category,
      main_idea: idea.description,
    });
    if (result) {
      setIdea((prev) => ({
        ...prev,
        core_problem: result.core_problem || prev.core_problem,
        core_value_proposition: result.core_value_proposition || prev.core_value_proposition,
        core_loop: result.core_loop || prev.core_loop,
        mvp_shape: result.mvp_shape || prev.mvp_shape,
        target_user: result.target_user || prev.target_user,
      }));
    }
  };

  const handleApplySuggestions = (result) => {
    setIdea((prev) => ({
      ...prev,
      core_problem: result.core_problem || prev.core_problem,
      core_value_proposition: result.core_value_proposition || prev.core_value_proposition,
      core_loop: result.core_loop || prev.core_loop,
      mvp_shape: result.mvp_shape || prev.mvp_shape,
      target_user: result.target_user || prev.target_user,
    }));
  };

  if (!idea) {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#a78bfa' }}>Loading idea...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#09090b' }} contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>{idea.title}</Text>
        <Text style={{ color: '#9ca3af' }}>Status: {idea.status}</Text>
      </View>
      <Pressable
        onPress={() => setDrawerOpen(true)}
        style={({ pressed }) => ({ alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#27272a', backgroundColor: pressed ? '#1f1f23' : '#13131a' })}
      >
        <Text style={{ color: '#a78bfa', fontWeight: '600' }}>Share & Export</Text>
      </Pressable>
      <AISuggestButton idea={idea} onApply={handleApplySuggestions} />

      {[{ key: 'description', label: 'Main idea' }, { key: 'core_problem', label: 'Core problem' }, { key: 'core_value_proposition', label: 'Value prop' }, { key: 'core_loop', label: 'Core loop' }, { key: 'mvp_shape', label: 'MVP shape' }, { key: 'target_user', label: 'Target user' }].map((field) => (
        <View key={field.key} style={{ borderRadius: 16, borderWidth: 1, borderColor: '#27272a', padding: 12 }}>
          <Text style={{ color: '#a1a1aa', marginBottom: 6 }}>{field.label}</Text>
          <TextInput
            value={idea[field.key] || ''}
            onChangeText={(value) => handleChange(field.key, value)}
            multiline
            style={{ color: '#fff', minHeight: 60 }}
            placeholder={field.label}
            placeholderTextColor="#71717a"
          />
        </View>
      ))}

      <NotesSection ideaId={idea.id} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable
          onPress={handleAutofill}
          style={({ pressed }) => ({ flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', backgroundColor: pressed ? '#1f1f23' : '#13131a' })}
        >
          <Text style={{ color: '#a78bfa' }}>{aiLoading ? 'Thinking…' : 'Autofill'}</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            const result = await scoreIdea({ title: idea.title, core_problem: idea.core_problem, core_value_proposition: idea.core_value_proposition });
            if (result) {
              setIdea((prev) => ({
                ...prev,
                ai_score: result.ai_score,
                ai_reasoning: result.ai_reasoning,
              }));
            }
          }}
          style={({ pressed }) => ({ flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', backgroundColor: pressed ? '#1f1f23' : '#13131a' })}
        >
          <Text style={{ color: '#a78bfa' }}>Score</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={handleSave}
        style={({ pressed }) => ({ borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: pressed ? '#5b21b6' : '#7c3aed' })}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>{saving ? 'Saving…' : 'Save idea'}</Text>
      </Pressable>

      <ActionDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Share & Export"
        actions={[
          {
            label: 'Copy summary',
            description: 'Copy idea title, status, and score to clipboard',
            onPress: () => Alert.alert('Coming soon'),
          },
          {
            label: 'Share via email',
            description: 'Send this idea outline to your inbox',
            onPress: () => Alert.alert('Coming soon'),
          },
        ]}
      />
    </ScrollView>
  );
}
