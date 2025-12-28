import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { supabase } from '../../shared';
import { useAIOperations } from '../../shared/hooks/useAIOperations';

export default function NewIdeaScreen({ navigation, route }) {
  const inboxThought = route.params?.inboxThought;
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState(inboxThought || '');
  const [coreProblem, setCoreProblem] = useState('');
  const [coreValue, setCoreValue] = useState('');
  const [saving, setSaving] = useState(false);
  const { autofillIdea, isLoading } = useAIOperations();

  const handleAutofill = async () => {
    if (!title) {
      Alert.alert('Missing title', 'Please add a title first.');
      return;
    }
    const result = await autofillIdea({
      title,
      category,
      main_idea: description,
    });
    if (result) {
      setCoreProblem(result.core_problem || '');
      setCoreValue(result.core_value_proposition || '');
    }
  };

  const handleSave = async () => {
    if (!title || !coreProblem || !coreValue) {
      Alert.alert('Missing fields', 'Title, core problem, and value prop are required.');
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Not signed in');
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from('ideas')
      .insert({
        user_id: user.id,
        title,
        category,
        description,
        core_problem: coreProblem,
        core_value_proposition: coreValue,
        status: 'idea',
      });
    if (error) {
      Alert.alert('Save failed', error.message);
    } else {
      Alert.alert('Idea created', 'Redirecting to Home');
      navigation.navigate('MainShell', { screen: 'Home' });
    }
    setSaving(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#09090b' }} contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>New Idea</Text>
      <TextInput
        placeholder="Title"
        placeholderTextColor="#71717a"
        value={title}
        onChangeText={setTitle}
        style={{ borderRadius: 12, borderWidth: 1, borderColor: '#27272a', padding: 12, color: '#fff' }}
      />
      <TextInput
        placeholder="Category"
        placeholderTextColor="#71717a"
        value={category}
        onChangeText={setCategory}
        style={{ borderRadius: 12, borderWidth: 1, borderColor: '#27272a', padding: 12, color: '#fff' }}
      />
      <TextInput
        placeholder="Main idea"
        placeholderTextColor="#71717a"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ borderRadius: 12, borderWidth: 1, borderColor: '#27272a', padding: 12, minHeight: 100, color: '#fff' }}
      />
      <TextInput
        placeholder="Core problem"
        placeholderTextColor="#71717a"
        value={coreProblem}
        onChangeText={setCoreProblem}
        multiline
        style={{ borderRadius: 12, borderWidth: 1, borderColor: '#27272a', padding: 12, minHeight: 80, color: '#fff' }}
      />
      <TextInput
        placeholder="Value proposition"
        placeholderTextColor="#71717a"
        value={coreValue}
        onChangeText={setCoreValue}
        multiline
        style={{ borderRadius: 12, borderWidth: 1, borderColor: '#27272a', padding: 12, minHeight: 80, color: '#fff' }}
      />
      <Pressable
        onPress={handleAutofill}
        style={({ pressed }) => ({
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#27272a',
          backgroundColor: pressed ? '#13131a' : '#111113',
        })}
      >
        <Text style={{ color: '#a78bfa', fontWeight: '600' }}>{isLoading ? 'Thinking…' : 'Autofill fields'}</Text>
      </Pressable>
      <Pressable
        onPress={handleSave}
        style={({ pressed }) => ({
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          backgroundColor: pressed ? '#5b21b6' : '#7c3aed',
        })}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>{saving ? 'Saving…' : 'Create idea'}</Text>
      </Pressable>
    </ScrollView>
  );
}
