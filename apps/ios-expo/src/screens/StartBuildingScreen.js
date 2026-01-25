import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Rocket, Zap } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../../shared/theme';

const COMING_SOON_TOOLS = [
  { name: 'Lovable', letter: 'L' },
  { name: 'Replit', letter: 'R' },
  { name: 'Cursor', letter: 'C' },
  { name: 'Vercel', letter: 'V' },
];

export default function StartBuildingScreen({ navigation }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            padding: spacing.sm,
            borderRadius: borderRadius.sm,
            backgroundColor: pressed ? colors.secondary : 'transparent',
          })}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: typography.xl, fontWeight: typography.bold, color: colors.text }}>
          Start Building
        </Text>
      </View>

      {/* Coming Soon Content */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
        }}
      >
        {/* Icon */}
        <View style={{ position: 'relative', marginBottom: spacing.xl }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Rocket size={48} color={colors.white} />
          </View>
          <View
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.warning,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={16} color={colors.white} />
          </View>
        </View>

        {/* Text */}
        <Text
          style={{
            fontSize: typography['2xl'],
            fontWeight: typography.bold,
            color: colors.text,
            marginBottom: spacing.sm,
            textAlign: 'center',
          }}
        >
          Build plugins coming soon
        </Text>
        <Text
          style={{
            fontSize: typography.base,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.xl,
            maxWidth: 300,
          }}
        >
          Connect directly to Lovable, Replit, Cursor, and more to go from idea to deployed app.
        </Text>

        {/* Tool Cards */}
        <View style={{ width: '100%', maxWidth: 280, gap: spacing.sm }}>
          {COMING_SOON_TOOLS.map((tool) => (
            <View
              key={tool.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                opacity: 0.5,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: typography.lg,
                    fontWeight: typography.bold,
                    color: colors.textSecondary,
                  }}
                >
                  {tool.letter}
                </Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: typography.base,
                  fontWeight: typography.medium,
                  color: colors.text,
                }}
              >
                {tool.name}
              </Text>
              <Text
                style={{
                  fontSize: typography.xs,
                  color: colors.textSecondary,
                }}
              >
                Soon
              </Text>
            </View>
          ))}
        </View>

        {/* Back Button */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            marginTop: spacing.xl,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
            backgroundColor: pressed ? colors.secondary : colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          })}
        >
          <Text
            style={{
              fontSize: typography.sm,
              fontWeight: typography.medium,
              color: colors.text,
            }}
          >
            Back to Idea
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
