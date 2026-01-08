import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View, Pressable } from 'react-native';
import { useAIChat } from '../../shared/hooks/useAIChat';

export default function AIScreen() {
  const { messages, sendMessage, clearHistory, isLoading, error } = useAIChat();
  const [draft, setDraft] = useState('');

  const handleSend = async () => {
    if (!draft.trim()) return;
    try {
      await sendMessage(draft.trim());
    } catch (err) {
      Alert.alert('AI error', err instanceof Error ? err.message : 'Unable to reach Vault AI right now.');
    }
    setDraft('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b', padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>AI Desk</Text>
          <Text style={{ color: '#9ca3af' }}>Ask Vault anything about your backlog.</Text>
        </View>
        <Pressable onPress={clearHistory}>
          <Text style={{ color: '#a78bfa' }}>Clear</Text>
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingVertical: 12 }}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.role === 'user' ? '#1c1c1f' : '#111113',
              borderRadius: 16,
              padding: 12,
              maxWidth: '85%',
            }}
          >
            <Text style={{ color: '#d4d4d8' }}>{msg.content}</Text>
            <Text style={{ color: '#71717a', fontSize: 10 }}>{new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}</Text>
          </View>
        ))}
      </ScrollView>
      {error && <Text style={{ color: '#f87171' }}>{error}</Text>}
      <View style={{ marginTop: 12, borderRadius: 16, borderWidth: 1, borderColor: '#27272a', paddingHorizontal: 12 }}>
        <TextInput
          placeholder={isLoading ? 'Vault AI is thinking…' : 'Ask AI...'}
          placeholderTextColor="#71717a"
          value={draft}
          onChangeText={setDraft}
          editable={!isLoading}
          onSubmitEditing={handleSend}
          style={{ color: '#fff', paddingVertical: 12 }}
        />
      </View>
    </View>
  );
}
