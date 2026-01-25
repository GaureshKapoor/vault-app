import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Lightbulb,
  Wand2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Save,
  Pencil,
  X,
  Check,
} from 'lucide-react-native';
import { useAIChat } from '../../shared/hooks/useAIChat';
import { useIdeaGeneration } from '../../shared/hooks/useIdeaGeneration';
import { colors, spacing, borderRadius, typography } from '../../shared/theme';
import { CATEGORIES } from '../components/CategoryPicker';

const MODE_STORAGE_KEY = 'vault_ai_mode';

// Difficulty options for the generator
const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Any difficulty' },
  { value: '1', label: '1 - Weekend' },
  { value: '2', label: '2 - Easy' },
  { value: '3', label: '3 - Moderate' },
  { value: '4', label: '4 - Challenging' },
  { value: '5', label: '5 - Complex' },
];

export default function AIScreen({ navigation }) {
  const [mode, setMode] = useState('chat'); // 'chat' or 'generate'

  // Load saved mode on mount
  useEffect(() => {
    AsyncStorage.getItem(MODE_STORAGE_KEY).then((saved) => {
      if (saved === 'generate' || saved === 'chat') {
        setMode(saved);
      }
    });
  }, []);

  // Save mode changes
  useEffect(() => {
    AsyncStorage.setItem(MODE_STORAGE_KEY, mode).catch(console.error);
  }, [mode]);

  const chatState = useAIChat();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            {mode === 'chat' ? (
              <Sparkles size={20} color={colors.white} />
            ) : (
              <Lightbulb size={20} color={colors.white} />
            )}
          </View>
          <View>
            <Text style={styles.headerTitle}>
              {mode === 'chat' ? 'AI Assistant' : 'Idea Generator'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {mode === 'chat' ? 'Think fast, build later' : 'Generate and save ideas'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {mode === 'chat' && chatState.messages.length > 1 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={chatState.clearHistory}
            >
              <Trash2 size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <ModeToggle mode={mode} onChange={setMode} />
        </View>
      </View>

      {/* Content */}
      {mode === 'chat' ? (
        <ChatView chatState={chatState} />
      ) : (
        <GenerateView navigation={navigation} />
      )}
    </SafeAreaView>
  );
}

function ModeToggle({ mode, onChange }) {
  return (
    <View style={styles.modeToggle}>
      <TouchableOpacity
        style={[styles.modeButton, mode === 'chat' && styles.modeButtonActive]}
        onPress={() => onChange('chat')}
      >
        <MessageCircle size={16} color={mode === 'chat' ? colors.white : colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeButton, mode === 'generate' && styles.modeButtonActive]}
        onPress={() => onChange('generate')}
      >
        <Lightbulb size={16} color={mode === 'generate' ? colors.white : colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

function ChatView({ chatState }) {
  const { messages, sendMessage, isLoading, error } = chatState;
  const [input, setInput] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.role === 'user' && styles.messageRowUser,
            ]}
          >
            <View
              style={[
                styles.messageAvatar,
                message.role === 'assistant' ? styles.avatarAssistant : styles.avatarUser,
              ]}
            >
              {message.role === 'assistant' ? (
                <Bot size={16} color={colors.primary} />
              ) : (
                <User size={16} color={colors.textSecondary} />
              )}
            </View>
            <View style={styles.messageContent}>
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'assistant'
                    ? styles.bubbleAssistant
                    : styles.bubbleUser,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user' && styles.messageTextUser,
                  ]}
                >
                  {message.content}
                </Text>
              </View>
              <Text
                style={[
                  styles.messageTime,
                  message.role === 'user' && styles.messageTimeUser,
                ]}
              >
                {formatTime(message.createdAt || message.timestamp)}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={styles.messageRow}>
            <View style={[styles.messageAvatar, styles.avatarAssistant]}>
              <Bot size={16} color={colors.primary} />
            </View>
            <View style={[styles.messageBubble, styles.bubbleAssistant]}>
              <View style={styles.thinkingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.thinkingText}>Thinking...</Text>
              </View>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything about your ideas..."
          placeholderTextColor={colors.textSecondary}
          editable={!isLoading}
          multiline
          maxLength={1000}
          onSubmitEditing={handleSubmit}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSubmit}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Send size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function GenerateView({ navigation }) {
  const {
    ideas,
    isGenerating,
    generateIdeas,
    autofillIdea,
    quickSave,
    removeIdea,
    clearAllIdeas,
    toggleExpand,
  } = useIdeaGeneration();

  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [gist, setGist] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);

  const handleGenerate = async () => {
    const options = {};
    if (category && category !== 'any') options.category = category;
    if (difficulty && difficulty !== 'any') options.difficulty = parseInt(difficulty);
    if (gist.trim()) options.gist = gist.trim();

    await generateIdeas(options);
    setGist('');
  };

  const unsavedIdeas = ideas.filter((i) => !i.savedId);
  const savedIdeas = ideas.filter((i) => i.savedId);

  return (
    <ScrollView
      style={styles.generateContainer}
      contentContainerStyle={styles.generateContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Generation Controls */}
      <View style={styles.controlsCard}>
        <View style={styles.controlsHeader}>
          <Wand2 size={16} color={colors.text} />
          <Text style={styles.controlsTitle}>Generate Ideas</Text>
        </View>

        {/* Quick filters */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.filterButtonText}>
              {category || 'Any category'}
            </Text>
            <ChevronDown size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowDifficultyModal(true)}
          >
            <Text style={styles.filterButtonText}>
              {DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)?.label || 'Any difficulty'}
            </Text>
            <ChevronDown size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Sparkles size={16} color={colors.white} />
          )}
          <Text style={styles.generateButtonText}>Generate Random</Text>
        </TouchableOpacity>

        {/* Gist input */}
        <View style={styles.gistSection}>
          <Text style={styles.gistLabel}>Or describe what you want to build:</Text>
          <TextInput
            style={styles.gistInput}
            value={gist}
            onChangeText={setGist}
            placeholder="A tool that helps developers track their side projects..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
          {gist.trim() && (
            <TouchableOpacity
              style={[styles.generateFromGistButton, isGenerating && styles.generateButtonDisabled]}
              onPress={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Lightbulb size={16} color={colors.white} />
              )}
              <Text style={styles.generateButtonText}>Generate from Description</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Generated Ideas */}
      {ideas.length > 0 && (
        <View style={styles.ideasSection}>
          <View style={styles.ideasHeader}>
            <Text style={styles.ideasTitle}>
              Generated Ideas ({unsavedIdeas.length} unsaved
              {savedIdeas.length > 0 && `, ${savedIdeas.length} saved`})
            </Text>
            {unsavedIdeas.length > 0 && (
              <TouchableOpacity onPress={clearAllIdeas}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {ideas.map((idea) => (
            <GeneratedIdeaCard
              key={idea.id}
              idea={idea}
              onQuickSave={quickSave}
              onAutofill={autofillIdea}
              onRemove={removeIdea}
              onToggleExpand={toggleExpand}
              navigation={navigation}
            />
          ))}
        </View>
      )}

      {/* Empty state */}
      {ideas.length === 0 && !isGenerating && (
        <View style={styles.emptyState}>
          <Lightbulb size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyTitle}>No ideas yet</Text>
          <Text style={styles.emptySubtitle}>
            Generate random ideas or describe what you want to build
          </Text>
        </View>
      )}

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={[styles.modalOption, !category && styles.modalOptionSelected]}
                onPress={() => {
                  setCategory('');
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>Any category</Text>
                {!category && <Check size={20} color={colors.primary} />}
              </TouchableOpacity>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.modalOption, category === cat.id && styles.modalOptionSelected]}
                  onPress={() => {
                    setCategory(cat.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={styles.modalOptionContent}>
                    <Text style={styles.modalOptionEmoji}>{cat.icon}</Text>
                    <Text style={styles.modalOptionText}>{cat.label}</Text>
                  </View>
                  {category === cat.id && <Check size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Difficulty Modal */}
      <Modal
        visible={showDifficultyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDifficultyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Difficulty</Text>
              <TouchableOpacity onPress={() => setShowDifficultyModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.modalOption, difficulty === opt.value && styles.modalOptionSelected]}
                onPress={() => {
                  setDifficulty(opt.value);
                  setShowDifficultyModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{opt.label}</Text>
                {difficulty === opt.value && <Check size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function GeneratedIdeaCard({ idea, onQuickSave, onAutofill, onRemove, onToggleExpand, navigation }) {
  const getDifficultyLabel = (diff) => {
    const labels = {
      1: 'Weekend',
      2: 'Easy',
      3: 'Moderate',
      4: 'Challenging',
      5: 'Complex',
    };
    return labels[diff] || diff;
  };

  return (
    <View style={[styles.ideaCard, idea.savedId && styles.ideaCardSaved]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.ideaCardHeader}
        onPress={() => onToggleExpand(idea.id)}
        activeOpacity={0.7}
      >
        <View style={styles.ideaCardHeaderContent}>
          <Text style={styles.ideaCardTitle} numberOfLines={2}>
            {idea.title}
          </Text>
          <View style={styles.ideaCardMeta}>
            {idea.category && (
              <View style={styles.ideaCardChip}>
                <Text style={styles.ideaCardChipText}>{idea.category}</Text>
              </View>
            )}
            {idea.difficulty && (
              <View style={styles.ideaCardChip}>
                <Text style={styles.ideaCardChipText}>{getDifficultyLabel(idea.difficulty)}</Text>
              </View>
            )}
            {idea.savedId && (
              <View style={[styles.ideaCardChip, styles.savedChip]}>
                <Text style={[styles.ideaCardChipText, styles.savedChipText]}>Saved</Text>
              </View>
            )}
          </View>
        </View>
        {idea.isExpanded ? (
          <ChevronUp size={20} color={colors.textSecondary} />
        ) : (
          <ChevronDown size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>

      {/* Description (always visible) */}
      <Text style={styles.ideaCardDescription} numberOfLines={idea.isExpanded ? undefined : 2}>
        {idea.description}
      </Text>

      {/* Expanded content */}
      {idea.isExpanded && idea.fullDetails && (
        <View style={styles.ideaCardExpanded}>
          {idea.fullDetails.core_problem && (
            <View style={styles.ideaCardField}>
              <Text style={styles.ideaCardFieldLabel}>Problem</Text>
              <Text style={styles.ideaCardFieldValue}>{idea.fullDetails.core_problem}</Text>
            </View>
          )}
          {idea.fullDetails.core_value_proposition && (
            <View style={styles.ideaCardField}>
              <Text style={styles.ideaCardFieldLabel}>Value Proposition</Text>
              <Text style={styles.ideaCardFieldValue}>{idea.fullDetails.core_value_proposition}</Text>
            </View>
          )}
          {idea.fullDetails.target_user && (
            <View style={styles.ideaCardField}>
              <Text style={styles.ideaCardFieldLabel}>Target User</Text>
              <Text style={styles.ideaCardFieldValue}>{idea.fullDetails.target_user}</Text>
            </View>
          )}
          {idea.fullDetails.mvp_shape && (
            <View style={styles.ideaCardField}>
              <Text style={styles.ideaCardFieldLabel}>MVP Shape</Text>
              <Text style={styles.ideaCardFieldValue}>{idea.fullDetails.mvp_shape}</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.ideaCardActions}>
        {!idea.savedId && (
          <>
            {!idea.fullDetails && (
              <TouchableOpacity
                style={[styles.ideaCardAction, idea.isAutofilling && styles.ideaCardActionDisabled]}
                onPress={() => onAutofill(idea.id)}
                disabled={idea.isAutofilling}
              >
                {idea.isAutofilling ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Wand2 size={16} color={colors.primary} />
                )}
                <Text style={styles.ideaCardActionText}>
                  {idea.isAutofilling ? 'Filling...' : 'Autofill'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.ideaCardAction, idea.isSaving && styles.ideaCardActionDisabled]}
              onPress={() => onQuickSave(idea.id)}
              disabled={idea.isSaving}
            >
              {idea.isSaving ? (
                <ActivityIndicator size="small" color={colors.success} />
              ) : (
                <Save size={16} color={colors.success} />
              )}
              <Text style={[styles.ideaCardActionText, { color: colors.success }]}>
                {idea.isSaving ? 'Saving...' : 'Quick Save'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ideaCardAction}
              onPress={() => onRemove(idea.id)}
            >
              <Trash2 size={16} color={colors.error} />
              <Text style={[styles.ideaCardActionText, { color: colors.error }]}>Remove</Text>
            </TouchableOpacity>
          </>
        )}
        {idea.savedId && (
          <TouchableOpacity
            style={styles.ideaCardAction}
            onPress={() => navigation.navigate('IdeaDetail', { ideaId: idea.savedId })}
          >
            <Pencil size={16} color={colors.primary} />
            <Text style={styles.ideaCardActionText}>View in Ideas</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clearButton: {
    padding: spacing.sm,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    padding: 4,
  },
  modeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },

  // Chat styles
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarAssistant: {
    backgroundColor: colors.primaryLight,
  },
  avatarUser: {
    backgroundColor: colors.surface,
  },
  messageContent: {
    maxWidth: '80%',
  },
  messageBubble: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  bubbleAssistant: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: borderRadius.sm,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderTopRightRadius: borderRadius.sm,
  },
  messageText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    lineHeight: 20,
  },
  messageTextUser: {
    color: colors.white,
  },
  messageTime: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  messageTimeUser: {
    textAlign: 'right',
  },
  thinkingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thinkingText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  errorContainer: {
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },

  // Generate styles
  generateContainer: {
    flex: 1,
  },
  generateContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  controlsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  controlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  controlsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },
  gistSection: {
    marginTop: spacing.lg,
  },
  gistLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  gistInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generateFromGistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: spacing.sm,
  },
  ideasSection: {
    marginTop: spacing.md,
  },
  ideasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  ideasTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  clearAllText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Idea card styles
  ideaCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  ideaCardSaved: {
    borderColor: colors.success,
    backgroundColor: colors.successLight + '10',
  },
  ideaCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  ideaCardHeaderContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  ideaCardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ideaCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  ideaCardChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
  },
  ideaCardChipText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  savedChip: {
    backgroundColor: colors.successLight,
  },
  savedChipText: {
    color: colors.success,
  },
  ideaCardDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  ideaCardExpanded: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ideaCardField: {
    marginBottom: spacing.sm,
  },
  ideaCardFieldLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ideaCardFieldValue: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  ideaCardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ideaCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ideaCardActionDisabled: {
    opacity: 0.5,
  },
  ideaCardActionText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },

  // Modal styles
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
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionSelected: {
    backgroundColor: colors.primaryLight + '20',
  },
  modalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalOptionEmoji: {
    fontSize: 20,
  },
  modalOptionText: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
});
