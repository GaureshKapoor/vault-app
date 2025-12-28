import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../shared';

const STORAGE_KEY = 'vault-ios-inbox';
const prompts = ['Customer pain: ', 'Workflow tweak: ', 'Voice memo transcription: ', 'Interesting link → '];

export default function InboxScreen() {
  const navigation = useNavigation();
  const [thoughts, setThoughts] = useState([]);
  const [draft, setDraft] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) {
        setThoughts(JSON.parse(value));
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
  }, [thoughts]);

  const handleAddThought = async () => {
    if (!draft.trim()) return;
    const tempId = Date.now().toString();
    const newThought = {
      id: tempId,
      text: draft.trim(),
      createdAt: new Date().toISOString(),
      promoted: false,
    };
    setThoughts((prev) => [newThought, ...prev]);
    setDraft('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('inbox_thoughts')
      .insert({ user_id: user.id, content: newThought.text })
      .select()
      .single();
    if (!error && data) {
      setThoughts((prev) => prev.map((thought) => (thought.id === tempId ? { ...thought, id: data.id } : thought)));
    }
  };

  const handleDelete = useCallback(async (id) => {
    setThoughts((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target) setRecentlyDeleted(target);
      return prev.filter((thought) => thought.id !== id);
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('inbox_thoughts').delete().eq('user_id', user.id).eq('id', id);
    }
  }, []);

  const handlePromote = useCallback(
    async (thought) => {
      navigation.navigate('MainShell', {
        screen: 'Home',
        params: { inboxThought: thought.text },
      });
      setThoughts((prev) => prev.filter((item) => item.id !== thought.id));
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('inbox_thoughts')
          .update({ promoted: true })
          .eq('id', thought.id)
          .eq('user_id', user.id);
      }
    },
    [navigation]
  );

  const sections = useMemo(() => {
    const now = Date.now();
    const fresh = [];
    const needsStructure = [];
    thoughts.forEach((thought) => {
      const ageHours = (now - new Date(thought.createdAt).getTime()) / 1000 / 60 / 60;
      if (ageHours < 12) {
        fresh.push(thought);
      } else {
        needsStructure.push(thought);
      }
    });
    return { fresh, needsStructure };
  }, [thoughts]);

  const handleUndo = () => {
    if (!recentlyDeleted) return;
    setThoughts((prev) => [recentlyDeleted, ...prev]);
    setRecentlyDeleted(null);
  };

  const syncRemoteInbox = useCallback(async () => {
    setSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('inbox_thoughts')
        .select('id, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) {
        const mapped = data.map((row) => ({ id: row.id, text: row.content, createdAt: row.created_at, promoted: false }));
        setThoughts(mapped);
        setLastSync(new Date().toISOString());
      }
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncRemoteInbox();
  }, [syncRemoteInbox]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#09090b' }}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}
    >
      <View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>Inbox</Text>
        <Text style={{ color: '#9ca3af', marginTop: 4 }}>Capture raw sparks & brain dumps.</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <Pressable
            onPress={syncRemoteInbox}
            style={({ pressed }) => ({
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: '#27272a',
              backgroundColor: pressed ? '#13131a' : '#111113',
            })}
          >
            <Text style={{ color: '#a78bfa', fontWeight: '600' }}>{syncing ? 'Syncing…' : 'Sync now'}</Text>
          </Pressable>
          {lastSync && <Text style={{ color: '#71717a', fontSize: 12 }}>Last sync {new Date(lastSync).toLocaleTimeString()}</Text>}
        </View>
      </View>

      <View style={{ borderRadius: 20, backgroundColor: '#111113', borderWidth: 1, borderColor: '#27272a', padding: 16 }}>
        <Text style={{ color: '#9ca3af', marginBottom: 12 }}>Templates</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {prompts.map((prompt) => (
            <Pressable
              key={prompt}
              onPress={() => setDraft((prev) => `${prev ? prev + '\n' : ''}${prompt}`)}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: pressed ? '#1f1f28' : '#16161a',
              })}
            >
              <Text style={{ color: '#e4e4e7', fontSize: 12 }}>{prompt}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#27272a', padding: 16, gap: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>New thought</Text>
        <TextInput
          placeholder="Brain dump, question, half-formed pitch…"
          placeholderTextColor="#71717a"
          multiline
          value={draft}
          onChangeText={setDraft}
          style={{ color: '#fff', borderWidth: 1, borderColor: '#27272a', borderRadius: 12, padding: 12, minHeight: 80 }}
        />
        <Pressable
          onPress={handleAddThought}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#5b21b6' : '#7c3aed',
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
          })}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Save thought</Text>
        </Pressable>
      </View>

      {[{ label: 'Just dropped', data: sections.fresh }, { label: 'Needs structure', data: sections.needsStructure }].map(
        (section) => (
          <View key={section.label} style={{ borderRadius: 18, borderWidth: 1, borderColor: '#1f1f23', padding: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{section.label}</Text>
            <Text style={{ color: '#9ca3af', marginTop: 6 }}>
              {section.data.length ? `${section.data.length} thoughts` : 'Nothing here yet'}
            </Text>
            <View style={{ marginTop: 12, gap: 12 }}>
              {section.data.map((thought) => (
                <View key={thought.id} style={{ borderRadius: 14, borderWidth: 1, borderColor: '#27272a', padding: 12 }}>
                  <Text style={{ color: '#e4e4e7' }}>{thought.text}</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <Pressable
                      onPress={() => handlePromote(thought)}
                      style={({ pressed }) => ({ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: pressed ? '#312e81' : '#1e1b4b' })}
                    >
                      <Text style={{ color: '#c4b5fd', fontWeight: '600' }}>Promote</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete(thought.id)} style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
                      <Text style={{ color: '#f87171', fontWeight: '600' }}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )
      )}

      {recentlyDeleted && (
        <View style={{ borderRadius: 14, borderWidth: 1, borderColor: '#f87171', padding: 12, backgroundColor: '#2a1414' }}>
          <Text style={{ color: '#fca5a5' }}>Thought deleted.</Text>
          <Pressable onPress={handleUndo} style={{ marginTop: 8 }}>
            <Text style={{ color: '#fda4af', fontWeight: '600' }}>Undo</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
