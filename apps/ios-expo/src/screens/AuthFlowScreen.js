import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { supabase } from '../../../shared/lib/supabase';

const steps = [
  'Account',
  'Subscription',
  'Experience',
  'Goals',
  'Tools',
  'Commitment',
  'First idea',
];

export default function AuthFlowScreen({ navigation }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Check your inbox', 'Confirm email to finish signup.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigation.replace('Onboarding');
      }
    } catch (err) {
      Alert.alert('Auth error', err instanceof Error ? err.message : 'Unable to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      navigation.replace('MainShell');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        <View>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>Vault</Text>
          <Text style={{ color: '#9ca3af', marginTop: 6 }}>Sign in to continue capturing ideas.</Text>
        </View>
        <View style={{ gap: 12 }}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#71717a"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ borderRadius: 12, borderWidth: 1, borderColor: '#27272a', padding: 12, color: '#fff' }}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#71717a"
            secureTextEntry
            style={{ borderRadius: 12, borderWidth: 1, borderColor: '#27272a', padding: 12, color: '#fff' }}
            value={password}
            onChangeText={setPassword}
          />
        </View>
        <Pressable
          onPress={handleAuth}
          style={({ pressed }) => ({
            borderRadius: 12,
            padding: 14,
            alignItems: 'center',
            backgroundColor: pressed ? '#5b21b6' : '#7c3aed',
            opacity: loading ? 0.7 : 1,
          })}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>{loading ? '...' : mode === 'signup' ? 'Sign up' : 'Sign in'}</Text>
        </Pressable>
        <Pressable onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
          <Text style={{ color: '#a78bfa', textAlign: 'center' }}>
            {mode === 'signup' ? 'Already have an account? Sign in.' : "New here? Create an account."}
          </Text>
        </Pressable>

        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#27272a', padding: 16 }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Onboarding step</Text>
          <Text style={{ color: '#9ca3af', marginTop: 6 }}>
            {stepIndex + 1} / {steps.length} — {steps[stepIndex]}
          </Text>
          <Pressable
            onPress={handleNextStep}
            style={({ pressed }) => ({
              marginTop: 12,
              paddingVertical: 12,
              alignItems: 'center',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#27272a',
              backgroundColor: pressed ? '#13131a' : '#111113',
            })}
          >
            <Text style={{ color: '#a78bfa', fontWeight: '600' }}>Next</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
