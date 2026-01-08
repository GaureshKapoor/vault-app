import { RefreshControl, ScrollView, Text, View, Pressable } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../../shared/lib/supabase';

const statusOrder = ['building', 'shortlisted', 'idea', 'paused', 'shipped'];

export default function HomeScreen() {
  const navigation = useNavigation();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ideas')
      .select('id,title,status,ai_score,category,updated_at')
      .order('updated_at', { ascending: false })
      .limit(20);
    if (!error) {
      setIdeas(data || []);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchIdeas();
    }, [fetchIdeas])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchIdeas();
    setRefreshing(false);
  }, [fetchIdeas]);

  const sortedIdeas = [...ideas].sort((a, b) => {
    return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#09090b' }}
      contentContainerStyle={{ padding: 20, gap: 18 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a78bfa" />}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>Home</Text>
          <Text style={{ color: '#9ca3af' }}>Structure ideas with autofill + scoring.</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={() => navigation.navigate('NewIdea')}
            style={({ pressed }) => ({
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: pressed ? '#1f1f23' : '#13131a',
            })}
          >
            <Text style={{ color: '#a78bfa', fontWeight: '600' }}>New</Text>
          </Pressable>
          <View style={{ borderRadius: 24, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#18181b' }}>
            <Text style={{ color: '#a78bfa', fontWeight: '600' }}>{loading ? 'Loading…' : `${ideas.length} ideas`}</Text>
          </View>
        </View>
      </View>

      {sortedIdeas.map((idea) => (
        <Pressable
          key={idea.id}
          onPress={() => navigation.navigate('IdeaDetail', { ideaId: idea.id })}
          style={({ pressed }) => ({
            borderRadius: 16,
            borderWidth: 1,
            borderColor: pressed ? '#3f3f49' : '#1f1f23',
            padding: 16,
            backgroundColor: pressed ? '#15151b' : 'transparent',
          })}
        >
          <Text style={{ color: '#f4f4f5', fontWeight: '600', fontSize: 16 }}>{idea.title}</Text>
          <Text style={{ color: '#a1a1aa', marginTop: 2 }}>Status · {idea.status}</Text>
          <Text style={{ color: '#71717a', fontSize: 12 }}>{idea.category || 'No category'}</Text>
          <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#a78bfa', fontWeight: '700', fontSize: 32 }}>{idea.ai_score ?? '—'}</Text>
            <Text style={{ color: '#a1a1aa' }}>AI score</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
