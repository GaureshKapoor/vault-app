import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  Mail,
  Briefcase,
  Target,
  Clock,
  Settings,
  LogOut,
  Trash2,
  Sun,
  Moon,
  Pencil,
  X,
  Check,
  CreditCard,
  Sparkles,
  BookOpen,
  FileText,
  ChevronRight,
} from 'lucide-react-native';
import { supabase } from '../../shared/lib/supabase';
import { colors, spacing, borderRadius, typography } from '../../shared/theme';

// Avatar options
const AVATAR_OPTIONS = [
  { id: 'rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'sparkles', emoji: '✨', label: 'Sparkles' },
  { id: 'lightning', emoji: '⚡', label: 'Lightning' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'rainbow', emoji: '🌈', label: 'Rainbow' },
  { id: 'unicorn', emoji: '🦄', label: 'Unicorn' },
  { id: 'alien', emoji: '👽', label: 'Alien' },
  { id: 'robot', emoji: '🤖', label: 'Robot' },
  { id: 'astronaut', emoji: '🧑‍🚀', label: 'Astronaut' },
  { id: 'ninja', emoji: '🥷', label: 'Ninja' },
  { id: 'wizard', emoji: '🧙', label: 'Wizard' },
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'dog', emoji: '🐶', label: 'Dog' },
  { id: 'fox', emoji: '🦊', label: 'Fox' },
  { id: 'panda', emoji: '🐼', label: 'Panda' },
  { id: 'penguin', emoji: '🐧', label: 'Penguin' },
  { id: 'owl', emoji: '🦉', label: 'Owl' },
  { id: 'butterfly', emoji: '🦋', label: 'Butterfly' },
  { id: 'dragon', emoji: '🐉', label: 'Dragon' },
];

const DEFAULT_AVATAR = 'rocket';

// Options for select fields
const USER_TYPE_OPTIONS = [
  { id: 'student', label: 'Student / Learning' },
  { id: 'solo_builder', label: 'Solo builder' },
  { id: 'founder', label: 'Founder / Indie hacker' },
  { id: 'creator', label: 'Creator / Writer / Designer' },
  { id: 'explorer', label: 'Explorer' },
];

const EXPERIENCE_OPTIONS = [
  { id: 'beginner', label: 'Just getting started' },
  { id: 'some', label: 'Some experience' },
  { id: 'experienced', label: 'Very experienced' },
];

const WEEKLY_HOURS_OPTIONS = [
  { id: 'less_2', label: 'Less than 2 hours/week' },
  { id: '2_5', label: '2-5 hours/week' },
  { id: '5_10', label: '5-10 hours/week' },
  { id: '10_20', label: '10-20 hours/week' },
  { id: 'all_in', label: 'All in' },
];

const GOAL_OPTIONS = [
  { id: 'learn', label: 'Learn how to build' },
  { id: 'decide', label: 'Decide what to work on' },
  { id: 'ship', label: 'Ship MVPs faster' },
  { id: 'organize', label: 'Organize ideas' },
  { id: 'explore', label: 'Explore startup ideas' },
  { id: 'action', label: 'Turn thoughts into action' },
];

export default function ProfileScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [profile, setProfile] = useState({
    display_name: null,
    email: null,
    user_type: null,
    building_experience: null,
    goals: null,
    weekly_hours: null,
    notifications_enabled: true,
    avatar_url: null,
    subscription_tier: null,
    subscription_status: null,
    trial_ends_at: null,
  });

  const [editedData, setEditedData] = useState({
    display_name: '',
    user_type: '',
    building_experience: '',
    goals: [],
    weekly_hours: '',
    avatar_url: DEFAULT_AVATAR,
  });

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('vault-theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, email, user_type, building_experience, goals, weekly_hours, notifications_enabled, avatar_url, subscription_tier, subscription_status, trial_ends_at')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile({
        display_name: data.display_name,
        email: data.email || user.email || null,
        user_type: data.user_type,
        building_experience: data.building_experience,
        goals: data.goals,
        weekly_hours: data.weekly_hours,
        notifications_enabled: data.notifications_enabled ?? true,
        avatar_url: data.avatar_url,
        subscription_tier: data.subscription_tier,
        subscription_status: data.subscription_status,
        trial_ends_at: data.trial_ends_at,
      });
      setEditedData({
        display_name: data.display_name || '',
        user_type: data.user_type || '',
        building_experience: data.building_experience || '',
        goals: data.goals || [],
        weekly_hours: data.weekly_hours || '',
        avatar_url: data.avatar_url || DEFAULT_AVATAR,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTheme();
      fetchProfile();
    }, [fetchProfile])
  );

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await AsyncStorage.setItem('vault-theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleStartEditing = () => {
    setEditedData({
      display_name: profile.display_name || '',
      user_type: profile.user_type || '',
      building_experience: profile.building_experience || '',
      goals: profile.goals || [],
      weekly_hours: profile.weekly_hours || '',
      avatar_url: profile.avatar_url || DEFAULT_AVATAR,
    });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditedData({
      display_name: profile.display_name || '',
      user_type: profile.user_type || '',
      building_experience: profile.building_experience || '',
      goals: profile.goals || [],
      weekly_hours: profile.weekly_hours || '',
      avatar_url: profile.avatar_url || DEFAULT_AVATAR,
    });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editedData.display_name || null,
          user_type: editedData.user_type || null,
          building_experience: editedData.building_experience || null,
          goals: editedData.goals.length > 0 ? editedData.goals : null,
          weekly_hours: editedData.weekly_hours || null,
          avatar_url: editedData.avatar_url || DEFAULT_AVATAR,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile((prev) => ({
        ...prev,
        display_name: editedData.display_name || null,
        user_type: editedData.user_type || null,
        building_experience: editedData.building_experience || null,
        goals: editedData.goals.length > 0 ? editedData.goals : null,
        weekly_hours: editedData.weekly_hours || null,
        avatar_url: editedData.avatar_url || DEFAULT_AVATAR,
      }));
      setIsEditing(false);
      Alert.alert('Success', 'Your profile has been updated.');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotifications = async (enabled) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ notifications_enabled: enabled })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, notifications_enabled: enabled }));
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your ideas. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) throw new Error('No active session');

              // Call delete-user edge function
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
                  },
                }
              );

              const data = await response.json();
              if (!response.ok) throw new Error(data.error || 'Failed to delete account');

              // Clear local storage
              await AsyncStorage.multiRemove([
                'vault_chat_history',
                'vault_generated_ideas',
                'vault_ai_mode',
                'vault-inbox-thoughts',
              ]);

              await supabase.auth.signOut();
              Alert.alert('Account Deleted', 'Your account has been permanently removed.');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account. Please contact support.');
            }
          },
        },
      ]
    );
  };

  const handleSelectAvatar = async (avatarId) => {
    if (isEditing) {
      setEditedData((prev) => ({ ...prev, avatar_url: avatarId }));
      setShowAvatarPicker(false);
      return;
    }

    // Save directly if not in edit mode
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarId })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, avatar_url: avatarId }));
      setShowAvatarPicker(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update avatar.');
    }
  };

  const handleToggleGoal = (goalId) => {
    setEditedData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter((g) => g !== goalId)
        : [...prev.goals, goalId],
    }));
  };

  const getAvatarEmoji = (avatarId) => {
    const avatar = AVATAR_OPTIONS.find((a) => a.id === avatarId);
    return avatar?.emoji || AVATAR_OPTIONS.find((a) => a.id === DEFAULT_AVATAR)?.emoji || '🚀';
  };

  const formatUserType = (type) => {
    if (!type) return 'Not set';
    const option = USER_TYPE_OPTIONS.find((o) => o.id === type);
    return option?.label || type;
  };

  const formatExperience = (exp) => {
    if (!exp) return 'Not set';
    const option = EXPERIENCE_OPTIONS.find((o) => o.id === exp);
    return option?.label || exp;
  };

  const formatWeeklyHours = (hours) => {
    if (!hours) return 'Not set';
    const option = WEEKLY_HOURS_OPTIONS.find((o) => o.id === hours);
    return option?.label || hours;
  };

  const formatGoals = (goals) => {
    if (!goals || goals.length === 0) return 'Not set';
    const formatted = goals.map((g) => {
      const option = GOAL_OPTIONS.find((o) => o.id === g);
      return option?.label || g;
    });
    if (formatted.length <= 2) {
      return formatted.join(', ');
    }
    return formatted.slice(0, 2).join(', ') + ` +${formatted.length - 2} more`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {!isEditing ? (
          <TouchableOpacity style={styles.editButton} onPress={handleStartEditing}>
            <Pencil size={18} color={colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.iconButton} onPress={handleCancelEditing}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, styles.saveButton]}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Check size={20} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar & Name */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => setShowAvatarPicker(true)}
          >
            <Text style={styles.avatarEmoji}>
              {getAvatarEmoji(isEditing ? editedData.avatar_url : profile.avatar_url)}
            </Text>
          </TouchableOpacity>
          <View style={styles.avatarInfo}>
            <Text style={styles.displayName}>
              {(isEditing ? editedData.display_name : profile.display_name) || 'Builder'}
            </Text>
            <Text style={styles.userType}>{formatUserType(profile.user_type)}</Text>
            <Text style={styles.avatarHint}>
              {isEditing ? 'Update your name below' : 'Tap avatar to change'}
            </Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          {/* Display Name */}
          {isEditing ? (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.iconContainer}>
                  <User size={20} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Display name</Text>
                  <TextInput
                    style={styles.input}
                    value={editedData.display_name}
                    onChangeText={(text) => setEditedData((prev) => ({ ...prev, display_name: text }))}
                    placeholder="What should we call you?"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.iconContainer}>
                  <User size={20} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Name</Text>
                  <Text style={styles.cardValue}>{profile.display_name || 'Not set'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Email (not editable) */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.iconContainer}>
                <Mail size={20} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Email</Text>
                <Text style={styles.cardValue}>{profile.email || 'Not set'}</Text>
              </View>
            </View>
          </View>

          {/* User Type */}
          {isEditing ? (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.iconContainer}>
                  <User size={20} color={colors.primary} />
                </View>
                <Text style={styles.cardLabel}>I am a...</Text>
              </View>
              <View style={styles.chipContainer}>
                {USER_TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.chip,
                      editedData.user_type === option.id && styles.chipSelected,
                    ]}
                    onPress={() => setEditedData((prev) => ({ ...prev, user_type: option.id }))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        editedData.user_type === option.id && styles.chipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.iconContainer}>
                  <User size={20} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>I am a...</Text>
                  <Text style={styles.cardValue}>{formatUserType(profile.user_type)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Experience */}
          {isEditing ? (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.iconContainer}>
                  <Briefcase size={20} color={colors.primary} />
                </View>
                <Text style={styles.cardLabel}>Experience</Text>
              </View>
              <View style={styles.chipContainer}>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.chip,
                      editedData.building_experience === option.id && styles.chipSelected,
                    ]}
                    onPress={() => setEditedData((prev) => ({ ...prev, building_experience: option.id }))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        editedData.building_experience === option.id && styles.chipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.iconContainer}>
                  <Briefcase size={20} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Experience</Text>
                  <Text style={styles.cardValue}>{formatExperience(profile.building_experience)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Goals */}
          {isEditing ? (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.iconContainer}>
                  <Target size={20} color={colors.primary} />
                </View>
                <Text style={styles.cardLabel}>Goals (select multiple)</Text>
              </View>
              <View style={styles.chipContainer}>
                {GOAL_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.chip,
                      editedData.goals.includes(option.id) && styles.chipSelected,
                    ]}
                    onPress={() => handleToggleGoal(option.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        editedData.goals.includes(option.id) && styles.chipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.iconContainer}>
                  <Target size={20} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Goals</Text>
                  <Text style={styles.cardValue}>{formatGoals(profile.goals)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Weekly Hours */}
          {isEditing ? (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.iconContainer}>
                  <Clock size={20} color={colors.primary} />
                </View>
                <Text style={styles.cardLabel}>Weekly Commitment</Text>
              </View>
              <View style={styles.chipContainer}>
                {WEEKLY_HOURS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.chip,
                      editedData.weekly_hours === option.id && styles.chipSelected,
                    ]}
                    onPress={() => setEditedData((prev) => ({ ...prev, weekly_hours: option.id }))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        editedData.weekly_hours === option.id && styles.chipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.iconContainer}>
                  <Clock size={20} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Weekly Commitment</Text>
                  <Text style={styles.cardValue}>{formatWeeklyHours(profile.weekly_hours)}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.iconContainer}>
                {profile.subscription_tier === 'pro' ? (
                  <Sparkles size={20} color={colors.primary} />
                ) : (
                  <CreditCard size={20} color={colors.primary} />
                )}
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardValue}>
                  {(profile.subscription_tier || 'Free').charAt(0).toUpperCase() + (profile.subscription_tier || 'free').slice(1)} Plan
                </Text>
                <Text style={styles.cardLabel}>
                  {profile.subscription_status === 'trial' && profile.trial_ends_at
                    ? `Trial ends ${new Date(profile.trial_ends_at).toLocaleDateString()}`
                    : profile.subscription_status === 'active'
                    ? 'Active subscription'
                    : 'Free tier'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => navigation.navigate('Pricing')}
              >
                <Text style={styles.upgradeButtonText}>
                  {profile.subscription_tier === 'pro' ? 'Manage' : 'Upgrade'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            {/* Theme Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.iconContainer}>
                {isDarkMode ? (
                  <Moon size={20} color={colors.primary} />
                ) : (
                  <Sun size={20} color={colors.primary} />
                )}
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardValue}>Dark Mode</Text>
                <Text style={styles.cardLabel}>{isDarkMode ? 'Dark theme' : 'Light theme'}</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.divider} />

            {/* Notifications */}
            <View style={styles.settingRow}>
              <View style={styles.iconContainer}>
                <Settings size={20} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardValue}>Notifications</Text>
                <Text style={styles.cardLabel}>
                  {profile.notifications_enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <Switch
                value={profile.notifications_enabled ?? true}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* Docs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Docs</Text>

          <TouchableOpacity
            style={styles.card}
            onPress={() => Linking.openURL('https://vault-app.vercel.app/privacy')}
          >
            <View style={styles.cardRow}>
              <View style={styles.iconContainer}>
                <FileText size={20} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardValue}>Privacy Policy</Text>
                <Text style={styles.cardLabel}>Understand how we store and process your data.</Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => Linking.openURL('https://vault-app.vercel.app/terms')}
          >
            <View style={styles.cardRow}>
              <View style={styles.iconContainer}>
                <BookOpen size={20} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardValue}>Terms & Conditions</Text>
                <Text style={styles.cardLabel}>Review the agreement that covers Vault usage.</Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => Linking.openURL('https://vault-app.vercel.app/guide')}
          >
            <View style={styles.cardRow}>
              <View style={styles.iconContainer}>
                <Sparkles size={20} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardValue}>How to use Vault</Text>
                <Text style={styles.cardLabel}>Step-by-step guide showing how each page fits together.</Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Actions Section */}
        <View style={[styles.section, { marginBottom: 120 }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={18} color={colors.text} />
            <Text style={styles.logoutButtonText}>Log out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Trash2 size={18} color={colors.error} />
            <Text style={styles.deleteButtonText}>Delete account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Avatar Picker Modal */}
      <Modal
        visible={showAvatarPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose your avatar</Text>
              <TouchableOpacity onPress={() => setShowAvatarPicker(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarOption,
                    (isEditing ? editedData.avatar_url : profile.avatar_url) === avatar.id &&
                      styles.avatarOptionSelected,
                  ]}
                  onPress={() => handleSelectAvatar(avatar.id)}
                >
                  <Text style={styles.avatarOptionEmoji}>{avatar.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  avatarButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  avatarInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  userType: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  avatarHint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  cardValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  input: {
    fontSize: typography.sizes.md,
    color: colors.text,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  upgradeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upgradeButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  logoutButtonText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.errorLight,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteButtonText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    fontWeight: typography.weights.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarOptionEmoji: {
    fontSize: 28,
  },
});
