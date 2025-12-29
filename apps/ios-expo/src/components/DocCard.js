import { Pressable, Text, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

export default function DocCard({ title, description, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <View
        style={{
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: '#2f2f32',
          backgroundColor: '#151517',
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>{title}</Text>
        <Text style={{ fontSize: 13, color: '#9b9ba1', marginTop: 4 }}>{description}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#a78bfa' }}>View</Text>
          <ArrowRight color="#a78bfa" size={16} />
        </View>
      </View>
    </Pressable>
  );
}
