import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { supabase } from '../../shared/supabase';

export default function AuthScreen({ navigation }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
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
        navigation.replace('MainShell');
      }
    } catch (err) {
      Alert.alert('Auth error', err instanceof Error ? err.message : 'Unable to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
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
          onPress={handleSubmit}
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
      </ScrollView>
    </SafeAreaView>
  );
}
