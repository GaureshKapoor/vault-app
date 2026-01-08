import { RefreshControl, ScrollView, Text, View, ActivityIndicator } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../shared/lib/supabase';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

const statusOrder = ['building', 'shortlisted', 'idea', 'paused', 'shipped'];

const stageMeta = {
  building: {
    title: 'In flight',
    tip: 'Capture blockers daily so nothing lingers.',
  },
  shortlisted: {
    title: 'Up next',
    tip: 'Gut-check priorities weekly to keep this list sharp.',
  },
  idea: {
    title: 'Fresh sparks',
    tip: 'Use AI autofill to structure these quickly.',
  },
  paused: {
    title: 'On the shelf',
    tip: 'Plan a resume date or deliberately archive.',
  },
  shipped: {
    title: 'Shipped wins',
    tip: 'Document learnings so you can re-use playbooks.',
  },
};

export default function ProgressScreen() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = useCallback(async () => {
    const { data, error } = await supabase
      .from('ideas')
      .select('id,title,status,updated_at,ai_score')
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(100);
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

  const { refreshing, onRefresh } = usePullToRefresh(fetchIdeas);

  const grouped = useMemo(() => {
    return ideas.reduce((acc, idea) => {
      acc[idea.status] = acc[idea.status] ? [...acc[idea.status], idea] : [idea];
      return acc;
    }, {});
  }, [ideas]);

  const activeIdea = grouped.building?.[0];
  const stuckIdeas = ideas.filter((idea) => idea.status !== 'shipped' && Date.now() - new Date(idea.updated_at).getTime() > 7 * 24 * 3600 * 1000);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color="#a78bfa" />
        <Text style={{ color: '#9ca3af', marginTop: 8 }}>Loading progress…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#09090b' }}
      contentContainerStyle={{ padding: 20, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a78bfa" />}
    >
      <View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>Progress Overview</Text>
        <Text style={{ color: '#9ca3af' }}>Focus slot + stage stories.</Text>
      </View>

      <View style={{ borderRadius: 18, borderWidth: 1, borderColor: '#1f1f23', padding: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Focus slot</Text>
        {activeIdea ? (
          <>
            <Text style={{ color: '#9ca3af', marginTop: 8 }}>{activeIdea.title}</Text>
            <Text style={{ color: '#71717a' }}>Updated {new Date(activeIdea.updated_at).toLocaleString()}</Text>
          </>
        ) : (
          <Text style={{ color: '#52525b', marginTop: 8 }}>No idea is in building right now.</Text>
        )}
      </View>

      {stuckIdeas.length > 0 && (
        <View style={{ borderRadius: 18, borderWidth: 1, borderColor: '#3f1f23', padding: 16, backgroundColor: '#1f1414' }}>
          <Text style={{ color: '#f87171', fontWeight: '600' }}>Needs attention</Text>
          {stuckIdeas.slice(0, 3).map((idea) => (
            <Text key={idea.id} style={{ color: '#fca5a5', marginTop: 6 }}>
              {idea.title} — inactive since {new Date(idea.updated_at).toLocaleDateString()}
            </Text>
          ))}
        </View>
      )}

      {statusOrder.map((status) => (
        <View key={status} style={{ borderRadius: 18, borderWidth: 1, borderColor: '#1f1f23', padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{stageMeta[status].title}</Text>
            <Text style={{ color: '#a78bfa', fontSize: 12 }}>{grouped[status]?.length || 0} ideas</Text>
          </View>
          <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>{stageMeta[status].tip}</Text>
          <View style={{ marginTop: 12, gap: 8 }}>
            {(grouped[status] || []).map((idea) => (
              <View key={idea.id} style={{ padding: 12, borderRadius: 12, backgroundColor: '#111113' }}>
                <Text style={{ color: '#e4e4e7' }}>{idea.title}</Text>
                <Text style={{ color: '#71717a', fontSize: 12 }}>Updated {new Date(idea.updated_at).toLocaleDateString()}</Text>
                {idea.ai_score && (
                  <Text style={{ color: '#a78bfa', fontSize: 12 }}>AI score · {idea.ai_score}</Text>
                )}
              </View>
            ))}
            {!(grouped[status]?.length) && <Text style={{ color: '#52525b', fontSize: 13 }}>Nothing here yet.</Text>}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
