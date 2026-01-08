import { Pressable, Text } from 'react-native';
import { useAIOperations } from '../../shared/hooks/useAIOperations';

export default function AISuggestButton({ idea, onApply }) {
  const { autofillIdea, scoreIdea, isLoading } = useAIOperations();

  const handleRefine = async () => {
    if (!idea?.title) return;
    const result = await autofillIdea({
      title: idea.title,
      category: idea.category,
      main_idea: idea.description,
    });
    if (result) {
      onApply(result);
    }
  };

  return (
    <Pressable
      onPress={handleRefine}
      style={({ pressed }) => ({
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: pressed ? '#1f1f23' : '#13131a',
      })}
    >
      <Text style={{ color: '#a78bfa', fontWeight: '600' }}>{isLoading ? 'Refining…' : 'Refine fields with AI'}</Text>
    </Pressable>
  );
}
