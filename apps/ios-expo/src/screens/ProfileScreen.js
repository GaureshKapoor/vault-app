import { Pressable, ScrollView, Text, TextInput, View, Switch, Alert } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../shared';
import { useReminderPrompt } from '../hooks/useReminderPrompt';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const { scheduleReminder } = useReminderPrompt();

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setDisplayName(data.display_name || '');
      setNotifications(data.notifications_enabled ?? true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        notifications_enabled: notifications,
      })
      .eq('user_id', profile.user_id);

    setSaving(false);

    if (error) {
      Alert.alert('Error', 'Could not save changes');
    } else {
      Alert.alert('Saved', 'Profile updated');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#09090b' }}
      contentContainerStyle={{ padding: 20, gap: 20 }}
    >
      <View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>Profile</Text>
        <Text style={{ color: '#9ca3af', marginTop: 4 }}>Manage your account and preferences.</Text>
      </View>

      {/* Account Section */}
      <View style={{ borderRadius: 18, borderWidth: 1, borderColor: '#1f1f23', padding: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, marginBottom: 12 }}>Account</Text>

        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ color: '#71717a', fontSize: 12, marginBottom: 4 }}>Email</Text>
            <Text style={{ color: '#a1a1aa' }}>{profile?.email || 'Loading...'}</Text>
          </View>

          <View>
            <Text style={{ color: '#71717a', fontSize: 12, marginBottom: 4 }}>Display Name</Text>
            <TextInput
              placeholder="Your name"
              placeholderTextColor="#71717a"
              value={displayName}
              onChangeText={setDisplayName}
              style={{
                color: '#fff',
                borderWidth: 1,
                borderColor: '#27272a',
                borderRadius: 12,
                padding: 12,
              }}
            />
          </View>
        </View>
      </View>

      {/* Subscription Section */}
      <View style={{ borderRadius: 18, borderWidth: 1, borderColor: '#1f1f23', padding: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, marginBottom: 12 }}>Subscription</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#a1a1aa' }}>Current Plan</Text>
          <View style={{ backgroundColor: '#1e1b4b', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ color: '#a78bfa', fontWeight: '600' }}>
              {profile?.subscription_tier || 'Free'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <Text style={{ color: '#a1a1aa' }}>Status</Text>
          <Text style={{ color: '#22c55e' }}>
            {profile?.subscription_status || 'Active'}
          </Text>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={{ borderRadius: 18, borderWidth: 1, borderColor: '#1f1f23', padding: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, marginBottom: 12 }}>Preferences</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#a1a1aa' }}>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#27272a', true: '#7c3aed' }}
            thumbColor="#fff"
          />
        </View>

        <Pressable
          onPress={scheduleReminder}
          style={{ marginTop: 12, paddingVertical: 10 }}
        >
          <Text style={{ color: '#a78bfa' }}>Schedule reminder</Text>
        </Pressable>
      </View>

      {/* Actions */}
      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#5b21b6' : '#7c3aed',
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          opacity: saving ? 0.7 : 1,
        })}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Text>
      </Pressable>

      {/* Docs Links */}
      <View style={{ borderRadius: 18, borderWidth: 1, borderColor: '#1f1f23', padding: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, marginBottom: 12 }}>Help & Info</Text>

        <Pressable
          onPress={() => navigation.navigate('DocsHub')}
          style={{ paddingVertical: 8 }}
        >
          <Text style={{ color: '#a78bfa' }}>Documentation</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Guide')}
          style={{ paddingVertical: 8 }}
        >
          <Text style={{ color: '#a78bfa' }}>How to Use Vault</Text>
        </Pressable>
      </View>

      {/* Sign Out */}
      <Pressable
        onPress={handleSignOut}
        style={({ pressed }) => ({
          borderWidth: 1,
          borderColor: '#f87171',
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          backgroundColor: pressed ? '#2a1414' : 'transparent',
        })}
      >
        <Text style={{ color: '#f87171', fontWeight: '600' }}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}
