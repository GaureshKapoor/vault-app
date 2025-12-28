import { ScrollView, Text, View } from 'react-native';
import { docs } from '../data/docsContent';

export default function DocDetailScreen({ route }) {
  const doc = docs.find((entry) => entry.id === route.params?.docId) || docs[0];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#09090b' }} contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>{doc.title}</Text>
        <Text style={{ color: '#9ca3af', marginTop: 4 }}>{doc.subtitle}</Text>
      </View>
      {doc.sections.map((section) => (
        <View key={section.title} style={{ borderRadius: 18, borderWidth: 1, borderColor: '#27272a', padding: 16 }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{section.title}</Text>
          <Text style={{ color: '#cfcfd4', marginTop: 6 }}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
