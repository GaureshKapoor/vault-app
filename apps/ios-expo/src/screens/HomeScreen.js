import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MoreHorizontal,
  Plus,
  Archive,
  Share as ShareIcon,
  CheckSquare,
  ArrowUpDown,
  Trash2,
  Newspaper,
  X,
} from 'lucide-react-native';
import { supabase } from '../../shared/lib/supabase';
import { colors, spacing, borderRadius } from '../../shared/theme';
import { VaultLogoWithText } from '../../shared/components/VaultLogo';
import { CategoryPicker } from '../components/CategoryPicker';
import { IdeaCard } from '../components/IdeaCard';
import { StatusBadge, STATUS_OPTIONS } from '../components/StatusBadge';

const SORT_OPTIONS = [
  { value: 'updated_at', label: 'Last Edited' },
  { value: 'created_at', label: 'Created' },
  { value: 'title', label: 'Name (A-Z)' },
  { value: 'category', label: 'Category' },
  { value: 'ai_score', label: 'AI Score' },
  { value: 'status', label: 'Status' },
];

const STATUS_ORDER = {
  building: 1,
  shortlisted: 2,
  idea: 3,
  paused: 4,
  shipped: 5,
  archived: 6,
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const [ideas, setIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showArchived, setShowArchived] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('updated_at');
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusChangeIdea, setStatusChangeIdea] = useState(null);

  const fetchIdeas = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('id, title, description, main_idea, ai_score, status, category, is_template, sort_order, updated_at, created_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      Alert.alert('Error', 'Failed to load ideas. Please try again.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchIdeas();
    }, [fetchIdeas])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchIdeas(false);
    setRefreshing(false);
  }, [fetchIdeas]);

  // Sort function
  const sortIdeas = (ideasToSort) => {
    return [...ideasToSort].sort((a, b) => {
      // Templates always go to the bottom
      if (a.is_template !== b.is_template) {
        return a.is_template ? 1 : -1;
      }
      if (a.is_template && b.is_template) {
        return (a.sort_order || 999) - (b.sort_order || 999);
      }

      switch (sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'category':
          return (a.category || 'zzz').localeCompare(b.category || 'zzz');
        case 'ai_score':
          return (b.ai_score ?? -1) - (a.ai_score ?? -1);
        case 'status':
          return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated_at':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  };

  // Filter and sort ideas
  const filteredIdeas = sortIdeas(
    ideas.filter((idea) => {
      if (!showArchived && idea.status === 'archived') return false;
      if (showArchived && idea.status !== 'archived') return false;
      if (selectedCategory !== 'All' && idea.category !== selectedCategory) return false;
      return true;
    })
  );

  // Status change handler
  const handleStatusChange = async (newStatus) => {
    if (!statusChangeIdea) return;

    try {
      // Check if trying to set to "building" and there's already one building
      if (newStatus === 'building') {
        const buildingIdea = ideas.find(
          (i) => i.status === 'building' && i.id !== statusChangeIdea.id
        );
        if (buildingIdea) {
          Alert.alert(
            'One idea at a time',
            `You can only have one idea in "Building" status. "${buildingIdea.title}" is currently being built. Finish or pause it first.`
          );
          setShowStatusModal(false);
          setStatusChangeIdea(null);
          return;
        }
      }

      const { error } = await supabase
        .from('ideas')
        .update({ status: newStatus })
        .eq('id', statusChangeIdea.id);

      if (error) throw error;

      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === statusChangeIdea.id ? { ...idea, status: newStatus } : idea
        )
      );

      Alert.alert('Success', `Idea moved to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setShowStatusModal(false);
      setStatusChangeIdea(null);
    }
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedIds(new Set());
    setShowMenuModal(false);
  };

  // Toggle selection
  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Bulk action handler
  const handleBulkAction = async () => {
    if (selectedIds.size === 0) return;

    const newStatus = showArchived ? 'idea' : 'archived';
    const actionWord = showArchived ? 'restored' : 'archived';

    try {
      const { error } = await supabase
        .from('ideas')
        .update({ status: newStatus })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      Alert.alert(
        'Success',
        `${selectedIds.size} idea${selectedIds.size > 1 ? 's' : ''} ${actionWord}`
      );

      setIsSelectMode(false);
      setSelectedIds(new Set());
      fetchIdeas();
    } catch (error) {
      console.error(`Error ${actionWord} ideas:`, error);
      Alert.alert('Error', `Failed to ${showArchived ? 'restore' : 'archive'} ideas. Please try again.`);
    }
  };

  // Share handler
  const handleShare = async () => {
    if (filteredIdeas.length === 0) {
      Alert.alert('Nothing to share', 'Try changing filters or add an idea first.');
      return;
    }

    const dateLabel = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const filters = [];
    filters.push(showArchived ? 'View: Archived' : 'View: Active');
    if (selectedCategory !== 'All') {
      filters.push(`Category: ${selectedCategory}`);
    }

    const header = [`Vault Ideas — ${dateLabel}`, filters.join(' • ')].filter(Boolean).join('\n');

    const items = filteredIdeas
      .map((idea, index) => {
        const statusLabel = idea.status.charAt(0).toUpperCase() + idea.status.slice(1);
        const aiScore = idea.ai_score ? `${idea.ai_score}` : 'N/A';
        const category = idea.category ?? 'Uncategorized';
        return [
          `${index + 1}. ${idea.title ?? 'Untitled idea'}`,
          `   • Category: ${category}`,
          `   • Status: ${statusLabel} | AI Score: ${aiScore}`,
        ].join('\n');
      })
      .join('\n\n');

    const shareContent = `${header}\n\n${items}`;

    try {
      await Share.share({ message: shareContent });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left - Feed icon */}
          <View style={{ width: 80 }}>
            <Pressable
              onPress={() => {/* Navigate to feed if implemented */}}
              style={({ pressed }) => ({
                padding: spacing.sm,
                marginLeft: -spacing.sm,
                borderRadius: borderRadius.sm,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Newspaper size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Center - Logo + Title */}
          <View style={{ alignItems: 'center' }}>
            <VaultLogoWithText size="sm" />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: colors.foreground,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginTop: 4,
              }}
            >
              {showArchived ? 'Archived' : 'My Ideas'}
            </Text>
          </View>

          {/* Right - Actions */}
          <View style={{ width: 80, flexDirection: 'row', justifyContent: 'flex-end', gap: 4 }}>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => ({
                padding: spacing.sm,
                borderRadius: borderRadius.sm,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <ShareIcon size={20} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() => setShowMenuModal(true)}
              style={({ pressed }) => ({
                padding: spacing.sm,
                borderRadius: borderRadius.sm,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MoreHorizontal size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {/* Category and Sort Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
          <CategoryPicker selectedCategory={selectedCategory} onSelect={setSelectedCategory} />

          <Pressable
            onPress={() => setShowSortModal(true)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <ArrowUpDown size={16} color={colors.mutedForeground} />
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Select Mode Action Bar */}
      {isSelectMode && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.mutedForeground }}>{selectedIds.size} selected</Text>
          <Pressable
            onPress={handleBulkAction}
            disabled={selectedIds.size === 0}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: borderRadius.sm,
              backgroundColor: showArchived ? colors.primary : colors.error,
              opacity: selectedIds.size === 0 ? 0.5 : pressed ? 0.8 : 1,
            })}
          >
            {showArchived ? (
              <>
                <Archive size={16} color={colors.primaryForeground} />
                <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Restore Selected</Text>
              </>
            ) : (
              <>
                <Trash2 size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600' }}>Archive Selected</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* Ideas List */}
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Add New Idea Card */}
        {!isSelectMode && (
          <Pressable
            onPress={() => navigation.navigate('NewIdea')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: pressed ? colors.primary : colors.border,
              backgroundColor: pressed ? `${colors.primary}10` : 'transparent',
            })}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${colors.primary}20`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={20} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '500', color: colors.mutedForeground }}>
              Add new idea
            </Text>
          </Pressable>
        )}

        {/* Empty State */}
        {filteredIdeas.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
            <Text style={{ color: colors.mutedForeground, marginBottom: spacing.md, textAlign: 'center' }}>
              {showArchived
                ? 'No archived ideas yet'
                : selectedCategory !== 'All'
                ? `No ideas in ${selectedCategory} category`
                : 'No ideas yet. Start building your vault!'}
            </Text>
            {!showArchived && (
              <Pressable
                onPress={() => navigation.navigate('NewIdea')}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: borderRadius.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Plus size={16} color={colors.foreground} />
                <Text style={{ color: colors.foreground, fontWeight: '500' }}>Add New Idea</Text>
              </Pressable>
            )}
          </View>
        ) : (
          // Ideas List
          filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onPress={() => navigation.navigate('IdeaDetail', { ideaId: idea.id })}
              onStatusPress={() => {
                setStatusChangeIdea(idea);
                setShowStatusModal(true);
              }}
              isSelectMode={isSelectMode}
              isSelected={selectedIds.has(idea.id)}
              onSelectToggle={() => toggleSelection(idea.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Menu Modal */}
      <Modal visible={showMenuModal} transparent animationType="fade" onRequestClose={() => setShowMenuModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowMenuModal(false)}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              paddingVertical: spacing.md,
              paddingBottom: spacing.xxl,
            }}
          >
            <Pressable
              onPress={toggleSelectMode}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                backgroundColor: pressed ? colors.card : 'transparent',
              })}
            >
              <CheckSquare size={20} color={colors.foreground} />
              <Text style={{ fontSize: 16, color: colors.foreground }}>
                {isSelectMode ? 'Cancel Selection' : 'Select Ideas'}
              </Text>
            </Pressable>

            <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md }} />

            <Pressable
              onPress={() => {
                setShowArchived(!showArchived);
                setShowMenuModal(false);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                backgroundColor: pressed ? colors.card : 'transparent',
              })}
            >
              <Archive size={20} color={colors.foreground} />
              <Text style={{ fontSize: 16, color: colors.foreground }}>
                {showArchived ? 'Show Active Ideas' : 'Show Archived'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowSortModal(false)}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              paddingVertical: spacing.md,
              paddingBottom: spacing.xxl,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>Sort by</Text>
              <Pressable onPress={() => setShowSortModal(false)} style={{ padding: spacing.sm }}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  setSortBy(option.value);
                  setShowSortModal(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  backgroundColor: pressed ? colors.card : sortBy === option.value ? colors.accent : 'transparent',
                })}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: sortBy === option.value ? colors.primary : colors.foreground,
                  }}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Status Change Modal */}
      <Modal visible={showStatusModal} transparent animationType="fade" onRequestClose={() => setShowStatusModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowStatusModal(false)}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              paddingVertical: spacing.md,
              paddingBottom: spacing.xxl,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>Change Status</Text>
              <Pressable onPress={() => setShowStatusModal(false)} style={{ padding: spacing.sm }}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleStatusChange(option.value)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  backgroundColor:
                    pressed || statusChangeIdea?.status === option.value ? colors.card : 'transparent',
                })}
              >
                <StatusBadge status={option.value} />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
