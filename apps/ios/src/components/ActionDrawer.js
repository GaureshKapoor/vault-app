import { Modal, Pressable, Text, View } from 'react-native';

export default function ActionDrawer({ visible, onClose, title, actions = [] }) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose}>
        <View
          style={{
            marginTop: 'auto',
            backgroundColor: '#111113',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            gap: 16,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{title}</Text>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => {
                onClose();
                action.onPress();
              }}
              style={({ pressed }) => ({
                paddingVertical: 12,
                borderRadius: 12,
                paddingHorizontal: 12,
                backgroundColor: pressed ? '#1f1f23' : '#15151b',
              })}
            >
              <Text style={{ color: '#e4e4e7', fontWeight: '600' }}>{action.label}</Text>
              {action.description && (
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>{action.description}</Text>
              )}
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={{ alignItems: 'center', paddingVertical: 10 }}>
            <Text style={{ color: '#a78bfa', fontWeight: '600' }}>Close</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
