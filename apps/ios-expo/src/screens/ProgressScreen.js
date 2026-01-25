import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { supabase } from '../../shared/lib/supabase';
import { colors, spacing, borderRadius, typography } from '../../shared/theme';
import { StatusBadge, STATUS_OPTIONS } from '../components/StatusBadge';

const statusOrder = ['idea', 'shortlisted', 'building', 'shipped', 'paused'];

const statusLabels = {
  idea: 'Idea',
  shortlisted: 'Shortlisted',
  building: 'Building',
  paused: 'Paused',
  shipped: 'Shipped',
  archived: 'Archived',
};

const stageMeta = {
  building: {
    title: 'In flight',
    description: 'This is the only idea you\'re actively shipping. Celebrate momentum and keep shipping rituals tight.',
    tip: 'Capture blockers daily so nothing lingers.',
  },
  shortlisted: {
    title: 'Up next',
    description: 'Shortlisted ideas are vetted and ready to grab the baton when focus frees up.',
    tip: 'Gut check priorities weekly to keep this list sharp.',
  },
  idea: {
    title: 'Fresh sparks',
    description: 'Raw ideas that still need structure before they earn a shortlist slot.',
    tip: 'Use AI autofill to sketch the story in minutes.',
  },
  paused: {
    title: 'On the shelf',
    description: 'Paused ideas have momentum but are temporarily waiting. Revisit them with intention.',
    tip: 'Plan a date to resume or deliberately archive.',
  },
  shipped: {
    title: 'Shipped wins',
    description: 'Artifacts of progress. Revisit why they worked and reuse playbooks.',
    tip: 'Document learnings so future you benefits.',
  },
};

const statusColors = {
  idea: { bg: '#7c3aed20', text: '#a78bfa' },
  shortlisted: { bg: '#f59e0b20', text: '#fbbf24' },
  building: { bg: '#10b98120', text: '#34d399' },
  paused: { bg: '#64748b20', text: '#94a3b8' },
  shipped: { bg: '#3b82f620', text: '#60a5fa' },
};

const formatRelativeTime = (isoDate) => {
  if (!isoDate) return 'No activity yet';
  const target = new Date(isoDate).getTime();
  if (Number.isNaN(target)) return 'No activity yet';
  const diffMs = Date.now() - target;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Touched today';
  if (diffDays === 1) return 'Updated yesterday';
  return `Inactive for ${diffDays} days`;
};

const getDaysSince = (isoDate) => {
  if (!isoDate) return Infinity;
  const diffMs = Date.now() - new Date(isoDate).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const evaluationLabel = (value, label) => {
  if (value === null || value === undefined) return null;
  return `${label} ${value}/5`;
};

export default function ProgressScreen({ navigation }) {
  const [ideas, setIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('idea');

  const fetchIdeas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select(
          'id, title, status, difficulty, priority, sprint_fit, ai_score, ai_reasoning, updated_at, created_at, check_clear_problem, check_simple_loop, check_deployable_mvp'
        )
        .neq('status', 'archived')
        .eq('is_template', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchIdeas();
    }, [fetchIdeas])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchIdeas();
  }, [fetchIdeas]);

  const handleStatusChange = async (ideaId, newStatus) => {
    try {
      // Check if trying to set to "building" and there's already one building
      if (newStatus === 'building') {
        const currentIdea = ideas.find((i) => i.id === ideaId);
        if (currentIdea?.status !== 'building') {
          const buildingIdea = ideas.find((i) => i.status === 'building' && i.id !== ideaId);
          if (buildingIdea) {
            Alert.alert(
              'One idea at a time',
              `You can only have one idea in "Building" status. "${buildingIdea.title}" is currently being built. Finish or pause it first.`
            );
            return;
          }
        }
      }

      const { error } = await supabase
        .from('ideas')
        .update({ status: newStatus })
        .eq('id', ideaId);

      if (error) throw error;

      setIdeas((prev) =>
        prev.map((idea) => (idea.id === ideaId ? { ...idea, status: newStatus } : idea))
      );

      Alert.alert('Status Updated', `Idea moved to ${statusLabels[newStatus]}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

  const groupedIdeas = useMemo(() => {
    return statusOrder.reduce((acc, status) => {
      acc[status] = ideas.filter((idea) => idea.status === status);
      return acc;
    }, {});
  }, [ideas]);

  const buildingIdea = groupedIdeas.building?.[0];
  const backlogCount = groupedIdeas.shortlisted?.length || 0;
  const ideaCount = ideas.length;
  const stuckIdeas = ideas.filter(
    (idea) => idea.status !== 'shipped' && getDaysSince(idea.updated_at) > 7
  );

  // Calculate weekly activity percentage
  const weeklyActivityPercent = useMemo(() => {
    if (ideaCount === 0) return 0;
    const activeThisWeek = ideas.filter((idea) => getDaysSince(idea.updated_at) <= 7).length;
    return Math.round((activeThisWeek / ideaCount) * 100);
  }, [ideas, ideaCount]);

  // Timeline events
  const timelineEvents = useMemo(() => {
    return [...ideas]
      .sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
        const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5)
      .map((idea) => ({
        id: idea.id,
        title: idea.title,
        status: idea.status,
        timestamp: idea.updated_at || idea.created_at,
        summary:
          idea.ai_reasoning?.slice(0, 120) ||
          (idea.status === 'shipped'
            ? 'Marked as shipped — capture a retro while it\'s fresh.'
            : 'No AI notes yet. Ask the AI coach for a check-in.'),
      }));
  }, [ideas]);

  // Statuses to show in deep dives
  const statusesToShow = selectedStatus === 'all' ? statusOrder : [selectedStatus];

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
        <Text style={styles.headerTitle}>Progress overview</Text>
        <Text style={styles.headerSubtitle}>
          Keep one idea in focus, prep the next, and unstick anything idle.
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Summary Cards */}
        <View style={styles.heroGrid}>
          {/* Focus Slot Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroCardHeader}>
              <View>
                <Text style={styles.heroCardLabel}>Focus slot</Text>
                <Text style={styles.heroCardTitle}>Only-one-building rule</Text>
              </View>
              <Sparkles size={20} color={colors.primary} />
            </View>
            {buildingIdea ? (
              <View>
                <Text style={styles.heroCardSubtext}>Currently building</Text>
                <TouchableOpacity
                  style={styles.buildingIdeaCard}
                  onPress={() => navigation.navigate('IdeaDetail', { ideaId: buildingIdea.id })}
                >
                  <View style={styles.buildingIdeaContent}>
                    <Text style={styles.buildingIdeaTitle} numberOfLines={2}>
                      {buildingIdea.title}
                    </Text>
                    <ChevronRight size={16} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.buildingIdeaTime}>
                    {formatRelativeTime(buildingIdea.updated_at)}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.heroTip}>{stageMeta.building.tip}</Text>
                {/* Badges */}
                <View style={styles.badgeRow}>
                  {buildingIdea.difficulty && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Difficulty {buildingIdea.difficulty}/5</Text>
                    </View>
                  )}
                  {buildingIdea.ai_score !== null && (
                    <View style={[styles.badge, styles.aiBadge]}>
                      <Text style={[styles.badgeText, styles.aiBadgeText]}>
                        AI {buildingIdea.ai_score}/10
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.heroCardSubtext}>
                  Nothing is in the build slot. Pick one shortlisted idea and commit to it so
                  progress stays real.
                </Text>
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={styles.ctaButtonText}>Choose next build</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Pipeline Health Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroCardHeader}>
              <View>
                <Text style={styles.heroCardLabel}>Pipeline health</Text>
                <Text style={styles.heroCardTitle}>{ideaCount} ideas in motion</Text>
              </View>
              <TrendingUp size={20} color={colors.success} />
            </View>
            {/* Status counts */}
            <View style={styles.statusList}>
              {statusOrder.map((status) => (
                <View key={status} style={styles.statusRow}>
                  <StatusBadge status={status} />
                  <Text style={styles.statusCount}>{groupedIdeas[status]?.length || 0}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.heroTip}>
              {backlogCount === 0
                ? 'Your shortlist is empty. Curate two or three contenders so you\'re never starting from scratch.'
                : `Shortlist ready: ${backlogCount} waiting in line.`}
            </Text>
          </View>

          {/* Momentum Watch Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroCardHeader}>
              <View>
                <Text style={styles.heroCardLabel}>Momentum watch</Text>
                <Text style={styles.heroCardTitle}>{stuckIdeas.length} needs attention</Text>
              </View>
              <AlertTriangle size={20} color={colors.warning} />
            </View>
            {/* Activity indicator */}
            <View style={styles.activityRow}>
              <View style={styles.progressRing}>
                <Text style={styles.progressPercent}>{weeklyActivityPercent}%</Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Active this week</Text>
                <Text style={styles.activitySubtext}>
                  {stuckIdeas.length === 0
                    ? 'Everything touched in the last week. Keep the cadence!'
                    : `${stuckIdeas.length} ${stuckIdeas.length === 1 ? 'idea' : 'ideas'} idle for 7+ days.`}
                </Text>
              </View>
            </View>
            {/* Stuck ideas list */}
            {stuckIdeas.slice(0, 2).map((idea) => (
              <TouchableOpacity
                key={idea.id}
                style={styles.stuckIdeaCard}
                onPress={() => navigation.navigate('IdeaDetail', { ideaId: idea.id })}
              >
                <Text style={styles.stuckIdeaTitle} numberOfLines={1}>
                  {idea.title}
                </Text>
                <Text style={styles.stuckIdeaTime}>{formatRelativeTime(idea.updated_at)}</Text>
              </TouchableOpacity>
            ))}
            {stuckIdeas.length > 2 && (
              <Text style={styles.moreText}>+{stuckIdeas.length - 2} more waiting for a nudge.</Text>
            )}
          </View>
        </View>

        {/* Activity Timeline */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <View>
              <Text style={styles.sectionLabel}>Recent activity</Text>
              <Text style={styles.sectionTitle}>Lifecycle timeline</Text>
            </View>
            <CalendarClock size={20} color={colors.primary} />
          </View>
          {timelineEvents.length === 0 ? (
            <Text style={styles.emptyText}>
              No lifecycle movement yet. Once ideas move stages, you'll see a story here.
            </Text>
          ) : (
            timelineEvents.map((event, index) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.timelineEvent,
                  index < timelineEvents.length - 1 && styles.timelineEventBorder,
                ]}
                onPress={() => navigation.navigate('IdeaDetail', { ideaId: event.id })}
              >
                <View style={styles.timelineEventHeader}>
                  <View style={styles.timelineEventLeft}>
                    <StatusBadge status={event.status} />
                    <Text style={styles.timelineEventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                  </View>
                  <Text style={styles.timelineEventTime}>
                    {formatRelativeTime(event.timestamp)}
                  </Text>
                </View>
                <Text style={styles.timelineEventSummary} numberOfLines={2}>
                  {event.summary}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Status Filter */}
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Filter size={16} color={colors.textSecondary} />
            <Text style={styles.filterLabel}>Filter by stage</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStatus === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === 'all' && styles.filterChipTextActive,
                ]}
              >
                All stages
              </Text>
            </TouchableOpacity>
            {statusOrder.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  selectedStatus === status && {
                    backgroundColor: statusColors[status].bg,
                    borderColor: statusColors[status].text,
                  },
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatus === status && { color: statusColors[status].text },
                  ]}
                >
                  {statusLabels[status]} ({groupedIdeas[status]?.length || 0})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stage Deep Dives */}
        {statusesToShow.map((status) => {
          const ideasInStage = groupedIdeas[status];
          const meta = stageMeta[status];

          if (!meta) return null;

          return (
            <View key={status} style={styles.stageSection}>
              <View style={styles.stageHeader}>
                <View style={styles.stageHeaderLeft}>
                  <StatusBadge status={status} />
                  <Text style={styles.stageCount}>{ideasInStage?.length || 0} items</Text>
                </View>
              </View>
              <Text style={styles.stageTitle}>{meta.title}</Text>
              <Text style={styles.stageDescription}>{meta.description}</Text>
              <Text style={styles.stageTip}>{meta.tip}</Text>

              <View style={styles.stageIdeas}>
                {ideaCount === 0 && status === 'idea' && (
                  <View style={styles.emptyStageCard}>
                    <Text style={styles.emptyStageText}>
                      Capture a thought in Inbox to see it show up here.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyStageButton}
                      onPress={() => navigation.navigate('Inbox')}
                    >
                      <Text style={styles.emptyStageButtonText}>Go to Inbox</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {(ideasInStage || []).map((idea) => (
                  <TouchableOpacity
                    key={idea.id}
                    style={styles.ideaCard}
                    onPress={() => navigation.navigate('IdeaDetail', { ideaId: idea.id })}
                  >
                    <View style={styles.ideaCardHeader}>
                      <View style={styles.ideaCardHeaderLeft}>
                        <Text style={styles.ideaCardTitle} numberOfLines={2}>
                          {idea.title}
                        </Text>
                        <Text style={styles.ideaCardTime}>
                          {formatRelativeTime(idea.updated_at)}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={colors.textSecondary} />
                    </View>
                    {/* Badges */}
                    <View style={styles.ideaCardBadges}>
                      {idea.difficulty && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {evaluationLabel(idea.difficulty, 'Difficulty')}
                          </Text>
                        </View>
                      )}
                      {idea.priority && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {evaluationLabel(idea.priority, 'Priority')}
                          </Text>
                        </View>
                      )}
                      {idea.ai_score !== null && (
                        <View style={[styles.badge, styles.aiBadge]}>
                          <Text style={[styles.badgeText, styles.aiBadgeText]}>
                            AI {idea.ai_score}/10
                          </Text>
                        </View>
                      )}
                    </View>
                    {/* Readiness checks */}
                    <View style={styles.checksRow}>
                      {idea.check_clear_problem && (
                        <View style={[styles.checkBadge, styles.checkProblem]}>
                          <Text style={styles.checkBadgeText}>Problem clear</Text>
                        </View>
                      )}
                      {idea.check_simple_loop && (
                        <View style={[styles.checkBadge, styles.checkLoop]}>
                          <Text style={styles.checkBadgeText}>Loop simple</Text>
                        </View>
                      )}
                      {idea.check_deployable_mvp && (
                        <View style={[styles.checkBadge, styles.checkMvp]}>
                          <Text style={styles.checkBadgeText}>MVP ready</Text>
                        </View>
                      )}
                    </View>
                    {/* AI reasoning */}
                    {idea.ai_reasoning && (
                      <Text style={styles.ideaCardReasoning} numberOfLines={2}>
                        "{idea.ai_reasoning}"
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}

                {!ideasInStage?.length && ideaCount > 0 && (
                  <View style={styles.emptyStageCard}>
                    <Text style={styles.emptyStageText}>
                      Nothing in this stage yet. {meta.tip}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
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
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },

  // Hero cards
  heroGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  heroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  heroCardLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroCardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginTop: 4,
  },
  heroCardSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  heroTip: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  buildingIdeaCard: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  buildingIdeaContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buildingIdeaTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
    flex: 1,
  },
  buildingIdeaTime: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  ctaButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  aiBadge: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary + '40',
  },
  aiBadgeText: {
    color: colors.primary,
  },
  statusList: {
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  progressRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  progressPercent: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activitySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  stuckIdeaCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  stuckIdeaTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  stuckIdeaTime: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  moreText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },

  // Timeline
  timelineSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginTop: 4,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  timelineEvent: {
    paddingVertical: spacing.md,
  },
  timelineEventBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timelineEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timelineEventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  timelineEventTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
    flex: 1,
  },
  timelineEventTime: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  timelineEventSummary: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Filter
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },

  // Stage sections
  stageSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stageCount: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  stageTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  stageDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  stageTip: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  stageIdeas: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  emptyStageCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyStageText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyStageButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  emptyStageButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },
  ideaCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  ideaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ideaCardHeaderLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  ideaCardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  ideaCardTime: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  ideaCardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  checksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  checkBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  checkProblem: {
    backgroundColor: colors.success + '20',
  },
  checkLoop: {
    backgroundColor: '#3b82f620',
  },
  checkMvp: {
    backgroundColor: colors.primary + '20',
  },
  checkBadgeText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  ideaCardReasoning: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
});
