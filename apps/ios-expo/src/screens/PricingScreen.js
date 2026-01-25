import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, Check, X, Sparkles } from 'lucide-react-native';
import { supabase } from '../../shared/lib/supabase';
import { VaultLogoWithText } from '../../shared/components/VaultLogo';
import { colors, spacing, borderRadius, typography, shadows } from '../../shared/theme';

const features = [
  { name: 'Ideas stored', free: '10', pro: 'Unlimited' },
  { name: 'AI refinement', free: 'Basic', pro: 'Advanced' },
  { name: 'Scoring & insights', free: false, pro: true },
  { name: 'Export ideas', free: false, pro: true },
  { name: 'Priority support', free: false, pro: true },
];

export default function PricingScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [isLoading, setIsLoading] = useState(false);
  const [isFromApp, setIsFromApp] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed_at')
          .eq('user_id', user.id)
          .single();

        if (profile?.onboarding_completed_at) {
          setIsFromApp(true);
        }
      }
    };
    checkUserStatus();
  }, []);

  const handleContinue = async () => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.navigate('Auth');
        return;
      }

      if (selectedPlan === 'free') {
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'active',
          })
          .eq('user_id', user.id);

        if (error) throw error;
        // Navigator will handle redirect to Onboarding
      } else {
        // Pro plan - start 7-day trial (no Stripe on mobile for now)
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);

        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_tier: 'pro',
            subscription_status: 'trial',
            trial_ends_at: trialEnd.toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;
        // Navigator will handle redirect to Onboarding
      }
    } catch (error) {
      console.error('Error processing subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (isFromApp) {
      navigation.goBack();
    } else {
      navigation.navigate('Auth');
    }
  };

  const PlanCard = ({ plan, price, description, isSelected, badge }) => (
    <Pressable
      onPress={() => setSelectedPlan(plan)}
      style={{
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: isSelected ? colors.primary : colors.border,
        backgroundColor: isSelected ? colors.primarySoft : colors.card,
        position: 'relative',
      }}
    >
      {badge && (
        <View style={{
          position: 'absolute',
          top: -10,
          left: 12,
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: borderRadius.full,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}>
          <Sparkles size={10} color={colors.primaryForeground} />
          <Text style={{ color: colors.primaryForeground, fontSize: 10, fontWeight: typography.semibold }}>{badge}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, marginTop: badge ? 4 : 0 }}>
        <Text style={{ fontSize: typography.base, fontWeight: typography.bold, color: colors.foreground }}>
          {plan === 'free' ? 'Free' : 'Pro'}
        </Text>
        <View style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: isSelected ? colors.primary : colors.mutedForeground,
          backgroundColor: isSelected ? colors.primary : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {isSelected && <Check size={10} color={colors.primaryForeground} />}
        </View>
      </View>

      <Text style={{ fontSize: typography.xl, fontWeight: typography.bold, color: colors.foreground, marginBottom: 4 }}>
        ${price}<Text style={{ fontSize: typography.xs, fontWeight: typography.normal, color: colors.mutedForeground }}>/mo</Text>
      </Text>
      <Text style={{ fontSize: typography.xs, color: colors.mutedForeground }}>{description}</Text>
    </Pressable>
  );

  const FeatureRow = ({ name, free, pro, isLast }) => (
    <View style={{
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.border,
    }}>
      <Text style={{ flex: 1, fontSize: typography.xs, color: colors.foreground }}>{name}</Text>
      <View style={{ width: 60, alignItems: 'center' }}>
        {typeof free === 'boolean' ? (
          free ? <Check size={14} color={colors.success} /> : <X size={14} color={colors.mutedForeground} />
        ) : (
          <Text style={{ fontSize: typography.xs, color: colors.mutedForeground }}>{free}</Text>
        )}
      </View>
      <View style={{ width: 60, alignItems: 'center' }}>
        {typeof pro === 'boolean' ? (
          pro ? <Check size={14} color={colors.success} /> : <X size={14} color={colors.mutedForeground} />
        ) : (
          <Text style={{ fontSize: typography.xs, color: colors.primary, fontWeight: typography.medium }}>{pro}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <Pressable
          onPress={handleBack}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}
        >
          <ArrowLeft size={16} color={colors.mutedForeground} />
          <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.mutedForeground }}>Back</Text>
        </Pressable>

        {/* Logo */}
        <View style={{ marginBottom: spacing.lg }}>
          <VaultLogoWithText />
        </View>

        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography['2xl'], fontWeight: typography.bold, color: colors.foreground, textAlign: 'center', marginBottom: spacing.sm }}>
            {isFromApp ? 'Manage subscription' : 'Choose your plan'}
          </Text>
          <Text style={{ fontSize: typography.sm, color: colors.mutedForeground, textAlign: 'center' }}>
            {isFromApp ? 'Upgrade or change your plan' : 'Start free or unlock the full Vault experience'}
          </Text>
        </View>

        {/* Plan Cards */}
        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
          <PlanCard
            plan="free"
            price="0"
            description="For casual explorers"
            isSelected={selectedPlan === 'free'}
          />
          <PlanCard
            plan="pro"
            price="9"
            description="For serious builders"
            isSelected={selectedPlan === 'pro'}
            badge="7-day trial"
          />
        </View>

        {/* Feature Comparison */}
        <View style={{
          backgroundColor: colors.card,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          marginBottom: spacing.lg,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.muted,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <Text style={{ flex: 1, fontSize: typography.xs, fontWeight: typography.semibold, color: colors.foreground }}>Feature</Text>
            <Text style={{ width: 60, fontSize: typography.xs, fontWeight: typography.semibold, color: colors.foreground, textAlign: 'center' }}>Free</Text>
            <Text style={{ width: 60, fontSize: typography.xs, fontWeight: typography.semibold, color: colors.foreground, textAlign: 'center' }}>Pro</Text>
          </View>

          {/* Features */}
          {features.map((feature, index) => (
            <FeatureRow
              key={feature.name}
              name={feature.name}
              free={feature.free}
              pro={feature.pro}
              isLast={index === features.length - 1}
            />
          ))}
        </View>

        {/* CTA */}
        <Pressable
          onPress={handleContinue}
          disabled={isLoading}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.primaryStrong : colors.primary,
            borderRadius: borderRadius.md,
            height: 48,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isLoading ? 0.7 : 1,
            ...shadows.primary,
          })}
        >
          {isLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <ActivityIndicator color={colors.primaryForeground} size="small" />
              <Text style={{ color: colors.primaryForeground, fontWeight: typography.semibold, fontSize: typography.base }}>Setting up...</Text>
            </View>
          ) : (
            <Text style={{ color: colors.primaryForeground, fontWeight: typography.semibold, fontSize: typography.base }}>
              {selectedPlan === 'pro' ? 'Start 7-day trial' : 'Continue with Free'}
            </Text>
          )}
        </Pressable>

        {selectedPlan === 'pro' && (
          <Text style={{ textAlign: 'center', fontSize: typography.xs, color: colors.mutedForeground, marginTop: spacing.md }}>
            No credit card required. Cancel anytime.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
