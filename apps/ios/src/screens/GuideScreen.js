import { ScrollView, Text, View } from 'react-native';
import { guideSections } from '../data/guideSections';
import GuideStep from '../components/GuideStep';

export default function GuideScreen({ navigation }) {
  const handleNavigate = (route) => {
    if (route === 'Profile') {
      navigation.navigate('MainShell', { screen: 'Profile' });
      return;
    }
    navigation.navigate('MainShell', { screen: route });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#09090b' }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>How Vault Works</Text>
      <Text style={{ color: '#9ca3af', marginBottom: 20 }}>
        Follow the five-screenshot tour. Each screen in Vault has a purpose.
      </Text>
      {guideSections.map((step) => (
        <GuideStep key={step.id} step={step} onNavigate={handleNavigate} />
      ))}
    </ScrollView>
  );
}
