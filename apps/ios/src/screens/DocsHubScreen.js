import { ScrollView, Text, View } from 'react-native';
import DocCard from '../components/DocCard';
import { docs } from '../data/docsContent';

export default function DocsHubScreen({ navigation }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#09090b' }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>Docs</Text>
      <Text style={{ color: '#9ca3af', marginBottom: 20 }}>
        Privacy, terms, and guides for the new Expo build live here.
      </Text>
      {docs.map((doc) => (
        <DocCard
          key={doc.id}
          title={doc.title}
          description={doc.subtitle}
          onPress={() => navigation.navigate('DocDetail', { docId: doc.id })}
        />
      ))}
      <DocCard
        title="How to use Vault"
        description="Five screens that explain the full workflow."
        onPress={() => navigation.navigate('Guide')}
      />
    </ScrollView>
  );
}
