import { View, Text, Pressable } from 'react-native';
import { colors } from '../../shared/theme';

export const STATUS_OPTIONS = [
  { value: 'idea', label: 'Idea' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'building', label: 'Building' },
  { value: 'paused', label: 'Paused' },
  { value: 'shipped', label: 'Shipped' },
];

const statusStyles = {
  idea: {
    bg: 'rgba(139, 92, 246, 0.2)',
    text: '#a78bfa',
    border: 'rgba(139, 92, 246, 0.4)',
  },
  shortlisted: {
    bg: 'rgba(234, 179, 8, 0.2)',
    text: '#fbbf24',
    border: 'rgba(234, 179, 8, 0.4)',
  },
  building: {
    bg: 'rgba(34, 197, 94, 0.2)',
    text: '#4ade80',
    border: 'rgba(34, 197, 94, 0.4)',
  },
  paused: {
    bg: 'rgba(113, 113, 122, 0.2)',
    text: '#a1a1aa',
    border: 'rgba(113, 113, 122, 0.4)',
  },
  shipped: {
    bg: 'rgba(59, 130, 246, 0.2)',
    text: '#60a5fa',
    border: 'rgba(59, 130, 246, 0.4)',
  },
  archived: {
    bg: colors.muted,
    text: colors.mutedForeground,
    border: colors.border,
  },
};

export function StatusBadge({ status, interactive, onPress, style }) {
  const statusKey = status?.toLowerCase() || 'idea';
  const styles = statusStyles[statusKey] || statusStyles.idea;
  const displayLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Idea';

  const badge = (
    <View
      style={[
        {
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: styles.bg,
          borderWidth: 1,
          borderColor: styles.border,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '500',
          color: styles.text,
        }}
      >
        {displayLabel}
      </Text>
    </View>
  );

  if (interactive && onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {badge}
      </Pressable>
    );
  }

  return badge;
}

export default StatusBadge;
