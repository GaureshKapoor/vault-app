import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../../shared/lib/supabase';
import { VaultLogoWithText } from '../../shared/components/VaultLogo';
import { colors, spacing, borderRadius, typography, shadows } from '../../shared/theme';

export default function AuthScreen({ navigation, route }) {
  const initialMode = route?.params?.mode || 'login';
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // After successful auth, the navigator will automatically redirect based on session state
  // No need for manual navigation - useSupabaseSession and useAuthGuard handle the flow

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
          if (error.message.includes('already registered')) {
            Alert.alert('Account exists', 'This email is already registered. Try logging in instead.');
          } else {
            throw error;
          }
        } else {
          Alert.alert('Account created!', 'Welcome to Vault. Let\'s build something great.');
          // Navigator will automatically redirect based on session state
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          if (error.message.includes('Invalid login')) {
            Alert.alert('Invalid credentials', 'Email or password is incorrect.');
          } else {
            throw error;
          }
        }
        // On successful login, navigator will automatically redirect based on session state
      }
    } catch (error) {
      Alert.alert('Authentication error', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      Alert.alert('Check your email', 'We\'ve sent you a password reset link.');
      setIsForgotPassword(false);
    } catch (error) {
      Alert.alert('Reset failed', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetOnboarding = async () => {
    if (!email || !password) {
      Alert.alert('Login required', 'Enter email and password to reset onboarding.');
      return;
    }

    setIsLoading(true);
    try {
      // Sign in first
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userId = data.user.id;

      // Delete all ideas
      await supabase.from('ideas').delete().eq('user_id', userId);

      // Reset profile
      await supabase.from('profiles').update({
        onboarding_completed_at: null,
        subscription_status: 'none',
        subscription_tier: null,
        trial_ends_at: null,
        user_type: null,
        building_experience: null,
        tools_used: null,
        goals: null,
        weekly_hours: null,
      }).eq('user_id', userId);

      Alert.alert('Reset complete', 'Onboarding has been reset. Please log in again.');
      // Sign out so the navigator shows the login screen
      await supabase.auth.signOut();
    } catch (error) {
      Alert.alert('Reset failed', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Shared input style
  const inputStyle = {
    height: 48,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    color: colors.foreground,
    fontSize: typography.base,
  };

  // Shared button style
  const primaryButtonStyle = ({ pressed }) => ({
    backgroundColor: pressed ? colors.primaryStrong : colors.primary,
    borderRadius: borderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: isLoading ? 0.7 : 1,
    ...shadows.primary,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: spacing.lg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <Pressable
            onPress={() => navigation.navigate('Landing')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl }}
          >
            <ArrowLeft size={16} color={colors.mutedForeground} />
            <Text style={{ fontSize: typography.sm, fontWeight: typography.medium, color: colors.mutedForeground }}>
              Back
            </Text>
          </Pressable>

          {/* Logo */}
          <View style={{ marginBottom: spacing.xl }}>
            <VaultLogoWithText onPress={() => navigation.navigate('Landing')} />
          </View>

          {/* Title */}
          <Text style={{
            fontSize: typography['2xl'],
            fontWeight: typography.bold,
            color: colors.foreground,
            marginBottom: spacing.xl,
          }}>
            {isForgotPassword
              ? 'Reset your password'
              : isSignUp
              ? 'Create your account'
              : 'Log in to your account'}
          </Text>

          {isForgotPassword ? (
            // Forgot Password Form
            <View style={{ gap: spacing.md }}>
              <View>
                <Text style={{
                  fontSize: 11,
                  fontWeight: typography.medium,
                  color: colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 6,
                }}>
                  Email
                </Text>
                <TextInput
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  style={inputStyle}
                />
              </View>

              <Pressable
                onPress={handleForgotPassword}
                disabled={isLoading}
                style={primaryButtonStyle}
              >
                {isLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <ActivityIndicator color={colors.primaryForeground} size="small" />
                    <Text style={{ color: colors.primaryForeground, fontWeight: typography.semibold, fontSize: typography.base }}>
                      Sending...
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: colors.primaryForeground, fontWeight: typography.semibold, fontSize: typography.base }}>
                    Send reset link
                  </Text>
                )}
              </Pressable>

              <Pressable onPress={() => setIsForgotPassword(false)} style={{ alignItems: 'center', marginTop: spacing.sm }}>
                <Text style={{ color: colors.primary, fontSize: typography.sm }}>Back to login</Text>
              </Pressable>
            </View>
          ) : (
            // Login / Signup Form
            <View style={{ gap: spacing.md }}>
              {/* Email */}
              <View>
                <Text style={{
                  fontSize: 11,
                  fontWeight: typography.medium,
                  color: colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 6,
                }}>
                  Email
                </Text>
                <TextInput
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  style={inputStyle}
                />
              </View>

              {/* Password */}
              <View>
                <Text style={{
                  fontSize: 11,
                  fontWeight: typography.medium,
                  color: colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 6,
                }}>
                  Password
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    editable={!isLoading}
                    style={{
                      ...inputStyle,
                      paddingRight: 48,
                    }}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: spacing.md, top: 12 }}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={colors.mutedForeground} />
                    ) : (
                      <Eye size={20} color={colors.mutedForeground} />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleAuth}
                disabled={isLoading}
                style={primaryButtonStyle}
              >
                {isLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <ActivityIndicator color={colors.primaryForeground} size="small" />
                    <Text style={{ color: colors.primaryForeground, fontWeight: typography.semibold, fontSize: typography.base }}>
                      {isSignUp ? 'Creating account...' : 'Logging in...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: colors.primaryForeground, fontWeight: typography.semibold, fontSize: typography.base }}>
                    {isSignUp ? 'Sign Up' : 'Log In'}
                  </Text>
                )}
              </Pressable>

              {/* Forgot Password */}
              {!isSignUp && (
                <Pressable onPress={() => setIsForgotPassword(true)} style={{ marginTop: spacing.xs }}>
                  <Text style={{ color: colors.primary, fontSize: typography.sm }}>Forgot password?</Text>
                </Pressable>
              )}

              {/* Toggle Sign Up / Login */}
              <Text style={{ textAlign: 'center', fontSize: typography.sm, color: colors.mutedForeground, marginTop: spacing.md }}>
                {isSignUp ? 'Already have an account? ' : 'New to Vault? '}
                <Text
                  style={{ color: colors.primary, fontWeight: typography.medium }}
                  onPress={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Log in' : 'Sign up'}
                </Text>
              </Text>

              {/* Dev Tools */}
              <View style={{
                marginTop: spacing.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: `${colors.mutedForeground}4D`,
                borderRadius: borderRadius.md,
                backgroundColor: `${colors.card}4D`,
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: typography.medium,
                  color: colors.mutedForeground,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: spacing.md,
                }}>
                  Dev Tools
                </Text>
                <Pressable
                  onPress={handleResetOnboarding}
                  disabled={isLoading}
                  style={({ pressed }) => ({
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: borderRadius.sm,
                    paddingVertical: 10,
                    alignItems: 'center',
                    backgroundColor: pressed ? colors.card : 'transparent',
                    opacity: isLoading ? 0.7 : 1,
                  })}
                >
                  {isLoading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <ActivityIndicator color={colors.foreground} size="small" />
                      <Text style={{ color: colors.foreground, fontSize: typography.sm }}>Resetting...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: colors.foreground, fontSize: typography.sm }}>Reset & Restart Onboarding</Text>
                  )}
                </Pressable>
                <Text style={{ fontSize: typography.xs, color: colors.mutedForeground, marginTop: spacing.sm }}>
                  Enter email/password to reset
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
