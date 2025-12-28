import { Pressable, Text, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

export default function GuideStep({ step, onNavigate }) {
  return (
    <View
      style={{
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#27272a',
        backgroundColor: '#121214',
        marginBottom: 16,
      }}
    >
      <Text style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        Step {step.id.toString().padStart(2, '0')}
      </Text>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 6 }}>{step.title}</Text>
      <Text style={{ color: '#a1a1aa', fontSize: 14, marginTop: 6 }}>{step.blurb}</Text>
      <View style={{ marginTop: 12 }}>
        {step.bullets.map((bullet) => (
          <View key={bullet} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: '#a78bfa', marginTop: 6 }} />
            <Text style={{ color: '#d4d4d8', flex: 1 }}>{bullet}</Text>
          </View>
        ))}
      </View>
      <Pressable
        onPress={() => onNavigate(step.action.route)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <Text style={{ color: '#a78bfa', fontWeight: '600' }}>{step.action.label}</Text>
        <ArrowRight color="#a78bfa" size={18} />
      </Pressable>
    </View>
  );
}
