import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
  Plus,
  Sparkles,
  Send,
  Lightbulb,
  PenLine,
  Mic,
  Link2,
  Archive,
  ArchiveRestore,
  Trash2,
  Feather,
  CloudOff,
  PartyPopper,
} from 'lucide-react-native';
import { supabase } from '../../shared/lib/supabase';
import { colors, spacing, borderRadius } from '../../shared/theme';

const STORAGE_KEY = 'vault-ios-inbox';

const templates = [
  { id: 'pain', label: 'Customer pain', Icon: Lightbulb, text: 'Customer pain: ' },
  { id: 'workflow', label: 'Workflow idea', Icon: PenLine, text: 'Workflow tweak: ' },
  { id: 'voice', label: 'Voice memo', Icon: Mic, text: 'Voice memo transcription: ' },
  { id: 'link', label: 'Link drop', Icon: Link2, text: 'Interesting link → ' },
];

const hoursSince = (date) => {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60));
};

const formatTimestamp = (date) => {
  const diffHours = hoursSince(date);
  if (diffHours < 1) return 'Moments ago';
  if (diffHours < 24) return `${diffHours}h ago`;
  const days = Math.floor(diffHours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

export default function InboxScreen() {
  const navigation = useNavigation();
  const [thoughts, setThoughts] = useState([]);
  const [draft, setDraft] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    loadThoughts();
  }, []);

  // Save to AsyncStorage whenever thoughts change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
  }, [thoughts]);

  const loadThoughts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setThoughts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading thoughts:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadThoughts();
    setRefreshing(false);
  }, []);

  const addThought = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const thought = {
      id: Date.now().toString(),
      text: trimmed,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    setThoughts((prev) => [thought, ...prev]);
    setDraft('');
  };

  const handleTemplate = (templateText) => {
    setDraft((prev) => (prev ? `${prev}\n${templateText}` : templateText));
  };

  const handleCreateWithAI = (thought) => {
    navigation.navigate('NewIdea', { inboxThought: thought.text });
    setThoughts((prev) =>
      prev.map((item) =>
        item.id === thought.id
          ? { ...item, status: 'promoted', promotedAt: new Date().toISOString() }
          : item
      )
    );
  };

  const handleMarkPromoted = (thought) => {
    setThoughts((prev) =>
      prev.map((item) =>
        item.id === thought.id
          ? { ...item, status: 'promoted', promotedAt: new Date().toISOString() }
          : item
      )
    );
  };

  const handleArchive = (thought) => {
    setThoughts((prev) =>
      prev.map((item) => (item.id === thought.id ? { ...item, status: 'archived' } : item))
    );
  };

  const handleRestore = (thought) => {
    setThoughts((prev) =>
      prev.map((item) => (item.id === thought.id ? { ...item, status: 'active' } : item))
    );
  };

  const handleDelete = (thought) => {
    Alert.alert('Delete Thought', 'Are you sure you want to delete this thought?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setThoughts((prev) => prev.filter((item) => item.id !== thought.id)),
      },
    ]);
  };

  // Categorize thoughts
  const activeThoughts = useMemo(
    () => thoughts.filter((t) => t.status === 'active' || !t.status),
    [thoughts]
  );

  const freshThoughts = useMemo(
    () =>
      activeThoughts
        .filter((t) => hoursSince(t.createdAt) < 12)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [activeThoughts]
  );

  const needsStructureThoughts = useMemo(
    () =>
      activeThoughts
        .filter((t) => hoursSince(t.createdAt) >= 12)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [activeThoughts]
  );

  const promotedThoughts = useMemo(
    () =>
      thoughts
        .filter((t) => t.status === 'promoted')
        .sort((a, b) => new Date(b.promotedAt || b.createdAt) - new Date(a.promotedAt || a.createdAt)),
    [thoughts]
  );

  const archivedThoughts = useMemo(
    () =>
      thoughts
        .filter((t) => t.status === 'archived')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [thoughts]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>Inbox</Text>
        <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 2 }}>
          Dump sparks quickly, then decide whether to nurture, promote, or shelve them.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.lg, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Create New Idea Card */}
        <Pressable
          onPress={() => navigation.navigate('NewIdea', { fromInbox: true })}
          style={({ pressed }) => ({
            borderRadius: borderRadius.xl,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: pressed ? colors.primary : colors.border,
            backgroundColor: pressed ? `${colors.primary}10` : `${colors.card}50`,
            padding: spacing.lg,
            alignItems: 'center',
          })}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Plus size={32} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.foreground }}>
            Ideas are the future
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>
            Tap to create a new idea
          </Text>
        </Pressable>

        {/* Mind Dump Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.md,
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Sparkles size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.foreground }}>
                Mind dump HQ
              </Text>
              <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                Capture anything swirling in your head.
              </Text>
            </View>
          </View>

          {/* Input */}
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Brain dump, question, half-formed pitch…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={{
              backgroundColor: colors.background,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              color: colors.foreground,
              fontSize: 15,
              minHeight: 100,
              textAlignVertical: 'top',
            }}
          />

          {/* Templates */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {templates.map((template) => (
              <Pressable
                key={template.id}
                onPress={() => handleTemplate(template.text)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: borderRadius.sm,
                  backgroundColor: pressed ? colors.secondary : colors.muted,
                })}
              >
                <template.Icon size={14} color={colors.foreground} />
                <Text style={{ fontSize: 13, color: colors.foreground }}>{template.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Footer */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <CloudOff size={12} color={colors.mutedForeground} />
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Stored locally</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable
                onPress={() => setDraft('')}
                style={{ paddingVertical: 8, paddingHorizontal: 12 }}
              >
                <Text style={{ color: colors.mutedForeground, fontWeight: '500' }}>Clear</Text>
              </Pressable>
              <Pressable
                onPress={addThought}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: borderRadius.sm,
                  backgroundColor: pressed ? colors.primaryStrong : colors.primary,
                })}
              >
                <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Log thought</Text>
                <Send size={16} color={colors.primaryForeground} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View
            style={{
              flex: 1,
              borderRadius: borderRadius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: `${colors.muted}30`,
              padding: spacing.md,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.mutedForeground, textTransform: 'uppercase' }}>
              Fresh drops
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '600', color: colors.foreground, marginTop: 4 }}>
              {freshThoughts.length}
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}>
              Touch within 24h
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              borderRadius: borderRadius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.mutedForeground, textTransform: 'uppercase' }}>
              Needs structure
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '600', color: colors.foreground, marginTop: 4 }}>
              {needsStructureThoughts.length}
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}>
              Give these AI pass
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              borderRadius: borderRadius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.mutedForeground, textTransform: 'uppercase' }}>
              Promoted
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '600', color: colors.foreground, marginTop: 4 }}>
              {promotedThoughts.length}
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}>
              Wins to revisit
            </Text>
          </View>
        </View>

        {/* Thought Sections */}
        <ThoughtSection
          title="Just dropped"
          description="Stuff you captured recently. Promote while it's fresh."
          emptyLabel="Nothing new yet. Capture a thought to see it here."
          thoughts={freshThoughts}
          variant="default"
          onCreateWithAI={handleCreateWithAI}
          onMarkPromoted={handleMarkPromoted}
          onArchive={handleArchive}
        />

        <ThoughtSection
          title="Needs structure"
          description="Older notes that deserve shaping before they go stale."
          emptyLabel="All caught up."
          thoughts={needsStructureThoughts}
          variant="default"
          onCreateWithAI={handleCreateWithAI}
          onMarkPromoted={handleMarkPromoted}
          onArchive={handleArchive}
        />

        <ThoughtSection
          title="Already promoted"
          description="Ideas that graduated into the pipeline."
          emptyLabel="No conversions yet. Keep promoting promising sparks."
          thoughts={promotedThoughts}
          variant="promoted"
          onArchive={handleArchive}
        />

        {archivedThoughts.length > 0 && (
          <ThoughtSection
            title="Shelf / Archive"
            description="Quiet storage for brain dumps you don't need right now."
            emptyLabel=""
            thoughts={archivedThoughts}
            variant="archived"
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ThoughtSection({
  title,
  description,
  emptyLabel,
  thoughts,
  variant = 'default',
  onCreateWithAI,
  onMarkPromoted,
  onArchive,
  onRestore,
  onDelete,
}) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.foreground }}>{title}</Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 2 }}>{description}</Text>
        </View>
        <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{thoughts.length}</Text>
      </View>

      {/* Empty State */}
      {thoughts.length === 0 && emptyLabel && (
        <View
          style={{
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.border,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 13, color: colors.mutedForeground, textAlign: 'center' }}>
            {emptyLabel}
          </Text>
        </View>
      )}

      {/* Thoughts List */}
      <View style={{ gap: 12 }}>
        {thoughts.map((thought) => (
          <View
            key={thought.id}
            style={{
              borderRadius: borderRadius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
            }}
          >
            <Text style={{ fontSize: 15, color: colors.foreground, lineHeight: 22 }}>{thought.text}</Text>

            {/* Timestamp */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <Feather size={12} color={colors.mutedForeground} />
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                {formatTimestamp(thought.createdAt)}
              </Text>
              {thought.status === 'promoted' && thought.promotedAt && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                  <PartyPopper size={12} color={colors.primary} />
                  <Text style={{ fontSize: 11, color: colors.primary }}>
                    Promoted {formatTimestamp(thought.promotedAt)}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {variant === 'default' && (
                <>
                  {onCreateWithAI && (
                    <Pressable
                      onPress={() => onCreateWithAI(thought)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: borderRadius.sm,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: pressed ? colors.card : 'transparent',
                      })}
                    >
                      <Sparkles size={14} color={colors.primary} />
                      <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: '500' }}>
                        Draft with AI
                      </Text>
                    </Pressable>
                  )}
                  {onMarkPromoted && (
                    <Pressable
                      onPress={() => onMarkPromoted(thought)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 }}
                    >
                      <Plus size={14} color={colors.mutedForeground} />
                      <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Mark promoted</Text>
                    </Pressable>
                  )}
                  {onArchive && (
                    <Pressable
                      onPress={() => onArchive(thought)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 }}
                    >
                      <Archive size={14} color={colors.mutedForeground} />
                      <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Archive</Text>
                    </Pressable>
                  )}
                </>
              )}

              {variant === 'promoted' && onArchive && (
                <Pressable
                  onPress={() => onArchive(thought)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 }}
                >
                  <Archive size={14} color={colors.mutedForeground} />
                  <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Move to shelf</Text>
                </Pressable>
              )}

              {variant === 'archived' && (
                <>
                  {onRestore && (
                    <Pressable
                      onPress={() => onRestore(thought)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: borderRadius.sm,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: pressed ? colors.card : 'transparent',
                      })}
                    >
                      <ArchiveRestore size={14} color={colors.foreground} />
                      <Text style={{ fontSize: 13, color: colors.foreground }}>Restore</Text>
                    </Pressable>
                  )}
                  {onDelete && (
                    <Pressable
                      onPress={() => onDelete(thought)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 }}
                    >
                      <Trash2 size={14} color={colors.error} />
                      <Text style={{ fontSize: 13, color: colors.error }}>Delete</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
