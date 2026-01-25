import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { colors, spacing, borderRadius } from '../../shared/theme';

export function ThinkingCard({ icon: Icon, title, content, isEditing, field, onUpdate }) {
  const [localValue, setLocalValue] = useState(content || '');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setLocalValue(content || '');
  }, [content]);

  const shouldTruncate = content && content.length > 150;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: isEditing ? colors.primary : colors.border,
        padding: spacing.md,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <View
          style={{
            padding: 6,
            borderRadius: borderRadius.sm,
            backgroundColor: `${colors.primary}15`,
          }}
        >
          <Icon size={16} color={colors.primary} />
        </View>
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
          {title}
        </Text>
      </View>

      {/* Content */}
      {isEditing ? (
        <TextInput
          value={localValue}
          onChangeText={setLocalValue}
          onBlur={() => onUpdate(field, localValue)}
          multiline
          style={{
            color: colors.foreground,
            fontSize: 14,
            lineHeight: 20,
            minHeight: 60,
            textAlignVertical: 'top',
          }}
          placeholder="Not defined"
          placeholderTextColor={colors.mutedForeground}
        />
      ) : (
        <View>
          <Text
            style={{
              fontSize: 14,
              color: content ? colors.mutedForeground : colors.mutedForeground,
              lineHeight: 20,
            }}
            numberOfLines={!isExpanded && shouldTruncate ? 3 : undefined}
          >
            {content || 'Not defined'}
          </Text>
          {shouldTruncate && (
            <Pressable onPress={() => setIsExpanded(!isExpanded)}>
              <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>
                {isExpanded ? 'Show less' : 'Show more'}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default ThinkingCard;
