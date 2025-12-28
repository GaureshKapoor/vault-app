import { Pressable, ScrollView, Text, TextInput, View, Switch, Alert } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../shared';
import { useReminderPrompt } from '../hooks/useReminderPrompt';

const sectionLabels = ['Account', 'Subscription', 'Preferences'];

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const { scheduleReminder } = useReminderPrompt();
@@
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <Text style={{ color: '#a1a1aa' }}>Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
+        <Pressable onPress={scheduleReminder} style={{ marginTop: 12, paddingVertical: 10 }}>
+          <Text style={{ color: '#a78bfa' }}>Schedule reminder</Text>
+        </Pressable>
      </View>
*** End Patch
