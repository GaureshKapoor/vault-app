import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../shared/theme';
import { StatusBadge } from './StatusBadge';

function getScoreColor(score) {
  if (score >= 7) return { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80' };
  if (score >= 4) return { bg: 'rgba(234, 179, 8, 0.15)', text: '#fbbf24' };
  return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' };
}

export function IdeaCard({
  idea,
  onPress,
  onStatusPress,
  isSelectMode,
  isSelected,
  onSelectToggle,
}) {
  const { title, main_idea, description, status, category, ai_score, is_template, sort_order } = idea;

  // Generate display title with "Default #X:" prefix for templates
  const displayTitle = is_template && sort_order
    ? `Default #${sort_order}: ${title}`
    : title || `${category || 'Other'} App`;

  const scoreColors = ai_score !== null ? getScoreColor(ai_score) : null;

  const cardContent = (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: isSelected ? colors.primary : colors.border,
        borderStyle: is_template ? 'dashed' : 'solid',
        padding: spacing.md,
        opacity: status === 'archived' ? 0.6 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        {/* Checkbox for select mode */}
        {isSelectMode && (
          <Pressable
            onPress={onSelectToggle}
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: isSelected ? colors.primary : colors.mutedForeground,
              backgroundColor: isSelected ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
            }}
          >
            {isSelected && (
              <Text style={{ color: colors.primaryForeground, fontSize: 14, fontWeight: '700' }}>
                ✓
              </Text>
            )}
          </Pressable>
        )}

        {/* Main content */}
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 4,
            }}
            numberOfLines={1}
          >
            {displayTitle}
          </Text>

          {/* Description */}
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              marginBottom: spacing.sm,
            }}
            numberOfLines={1}
          >
            {main_idea || description || 'No description'}
          </Text>

          {/* Tags row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            {/* Status badge */}
            {!isSelectMode && status !== 'archived' ? (
              <StatusBadge status={status} interactive onPress={onStatusPress} />
            ) : (
              <StatusBadge status={status} />
            )}

            {/* Category */}
            {category && (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.accent,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.accentForeground }}>
                  {category}
                </Text>
              </View>
            )}

            {/* AI Score */}
            {ai_score !== null && scoreColors && (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: borderRadius.full,
                  backgroundColor: scoreColors.bg,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: scoreColors.text }}>
                  AI: {ai_score.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Chevron */}
        {!isSelectMode && (
          <View style={{ alignSelf: 'center' }}>
            <ChevronRight size={20} color={colors.mutedForeground} />
          </View>
        )}
      </View>
    </View>
  );

  if (isSelectMode) {
    return (
      <Pressable onPress={onSelectToggle} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        {cardContent}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      {cardContent}
    </Pressable>
  );
}

export default IdeaCard;
