import { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Sparkles, Target, Archive, Inbox, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { VaultLogoWithText } from '../../shared/components/VaultLogo';
import { colors, spacing, borderRadius, typography, shadows } from '../../shared/theme';

// Data - matching web
const exampleTemplates = [
  {
    template: '{0} that {1}',
    highlights: [
      { text: 'A mood tracker', color: '#60a5fa' },
      { text: 'uses Spotify listening history', color: '#4ade80' },
    ],
  },
  {
    template: '{0} but it {1}',
    highlights: [
      { text: 'Voice memo app', color: '#fb923c' },
      { text: 'auto-transcribes and tags ideas', color: '#a78bfa' },
    ],
  },
  {
    template: '{0} for {1}',
    highlights: [
      { text: 'Notion style database', color: '#fb7185' },
      { text: 'tracking side projects and status', color: '#2dd4bf' },
    ],
  },
];

const taglineWords = ['faster', 'better', 'effortless'];

const features = [
  { icon: Sparkles, title: 'AI Autofill', description: 'Structure raw ideas into buildable concepts' },
  { icon: Target, title: 'Idea Scoring', description: 'Get instant AI feedback on viability' },
  { icon: Archive, title: 'Idea Vault', description: 'Organize and track all your ideas' },
  { icon: Inbox, title: 'Quick Capture', description: 'Capture thoughts, convert to ideas later' },
];

// Components
function TemplateCard({ idea }) {
  const parts = idea.template.split(/\{(\d+)\}/);

  return (
    <View style={{
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginHorizontal: spacing.md,
    }}>
      <Text style={{
        fontSize: typography.lg,
        fontWeight: typography.medium,
        lineHeight: 28,
        color: colors.foreground,
        textAlign: 'center',
      }}>
        {parts.map((part, i) => {
          const highlightIndex = parseInt(part);
          if (!isNaN(highlightIndex) && idea.highlights[highlightIndex]) {
            const highlight = idea.highlights[highlightIndex];
            return (
              <Text key={i} style={{ color: highlight.color, textDecorationLine: 'underline' }}>
                {highlight.text}
              </Text>
            );
          }
          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    </View>
  );
}

function AnimatedTagline() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % taglineWords.length);
      }, 200);
    }, 3000);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <View style={{ height: 48, justifyContent: 'center', alignItems: 'center', marginTop: spacing.sm }}>
      <Animated.Text style={{
        fontSize: 30,
        fontWeight: typography.bold,
        color: colors.primary,
        fontStyle: 'italic',
        opacity: fadeAnim,
      }}>
        {taglineWords[currentIndex]}
      </Animated.Text>
    </View>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <View style={{
      flex: 1,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      <View style={{
        width: 32,
        height: 32,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
      }}>
        <Icon size={16} color={colors.primary} />
      </View>
      <Text style={{
        fontSize: typography.sm,
        fontWeight: typography.semibold,
        color: colors.foreground,
        marginBottom: 2,
      }}>
        {title}
      </Text>
      <Text style={{ fontSize: typography.xs, color: colors.mutedForeground }}>
        {description}
      </Text>
    </View>
  );
}

export default function LandingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % exampleTemplates.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + exampleTemplates.length) % exampleTemplates.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % exampleTemplates.length);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Logo only, no menu */}
        <View style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}>
          <VaultLogoWithText />
        </View>

        {/* Hero Content */}
        <View style={{ paddingHorizontal: spacing.lg, alignItems: 'center', marginTop: spacing.md }}>
          {/* Beta Badge */}
          <View style={{
            backgroundColor: colors.primarySoft,
            borderWidth: 1,
            borderColor: `${colors.primary}33`,
            paddingHorizontal: spacing.md,
            paddingVertical: 6,
            borderRadius: borderRadius.full,
            marginBottom: spacing.md,
          }}>
            <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.primary }}>
              🚀 Now in Beta
            </Text>
          </View>

          {/* Headline */}
          <Text style={{
            fontSize: 28,
            fontWeight: typography.bold,
            color: colors.foreground,
            textAlign: 'center',
            letterSpacing: -0.5,
          }}>
            All Your <Text style={{ color: colors.primary }}>Ideas</Text>, One Place
          </Text>

          {/* Animated Tagline */}
          <AnimatedTagline />

          {/* Subheadline */}
          <Text style={{
            fontSize: typography.base,
            fontWeight: typography.medium,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginTop: spacing.sm,
          }}>
            Less chaos. More building.
          </Text>

          {/* Description */}
          <Text style={{
            fontSize: typography.base,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginTop: spacing.md,
            maxWidth: 320,
            lineHeight: 24,
          }}>
            Capture ideas as they come, use AI to create, refine and evaluate them, and move from half-baked thoughts to execution-ready plans at rapid pace.
          </Text>

          {/* Vibe-ideate tagline */}
          <Text style={{
            fontSize: typography.base,
            fontStyle: 'italic',
            color: colors.mutedForeground,
            textAlign: 'center',
            marginTop: spacing.lg,
          }}>
            <Text style={{ color: colors.primary }}>Vibe-ideate</Text> ✨ in the world of vibe-coding
          </Text>
        </View>

        {/* Idea Cards Carousel */}
        <View style={{ marginTop: spacing.xl, marginBottom: spacing.lg }}>
          <TemplateCard idea={exampleTemplates[currentIndex]} />

          {/* Navigation */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.md,
            marginTop: spacing.md,
          }}>
            <Pressable onPress={handlePrev} style={{ padding: spacing.sm }}>
              <ChevronLeft size={20} color={colors.mutedForeground} />
            </Pressable>
            <Text style={{ fontSize: typography.xs, color: colors.mutedForeground }}>
              Swipe through sample ideas - created with AI
            </Text>
            <Pressable onPress={handleNext} style={{ padding: spacing.sm }}>
              <ChevronRight size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Dots */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.sm,
            marginTop: spacing.md,
          }}>
            {exampleTemplates.map((_, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
                style={{
                  height: 8,
                  width: index === currentIndex ? 24 : 8,
                  borderRadius: 4,
                  backgroundColor: index === currentIndex ? colors.primary : `${colors.mutedForeground}4D`,
                }}
              />
            ))}
          </View>
        </View>

        {/* Features Grid */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
            <FeatureCard {...features[0]} />
            <FeatureCard {...features[1]} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <FeatureCard {...features[2]} />
            <FeatureCard {...features[3]} />
          </View>
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
          <Pressable
            onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.primaryStrong : colors.primary,
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.md,
              alignItems: 'center',
              ...shadows.primary,
            })}
          >
            <Text style={{
              color: colors.primaryForeground,
              fontSize: typography.base,
              fontWeight: typography.semibold,
            }}>
              Get Started Free
            </Text>
          </Pressable>

          <Text style={{
            textAlign: 'center',
            fontSize: typography.xs,
            color: colors.mutedForeground,
            marginTop: spacing.md,
          }}>
            Already have an account?{' '}
            <Text
              style={{ color: colors.primary }}
              onPress={() => navigation.navigate('Auth', { mode: 'login' })}
            >
              Log in
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
