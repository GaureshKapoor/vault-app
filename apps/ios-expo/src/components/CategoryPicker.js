import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { X, Briefcase, Brain, Heart, DollarSign, GraduationCap, Leaf, Users, Zap, UserCog, Coins, CircleDashed, LayoutGrid, ChevronDown } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../shared/theme';

export const CATEGORIES = [
  { id: 'SaaS', label: 'SaaS', Icon: Briefcase },
  { id: 'AI', label: 'AI', Icon: Brain },
  { id: 'Health', label: 'Health', Icon: Heart },
  { id: 'FinTech', label: 'FinTech', Icon: DollarSign },
  { id: 'EdTech', label: 'EdTech', Icon: GraduationCap },
  { id: 'Climate', label: 'Climate', Icon: Leaf },
  { id: 'Social', label: 'Social', Icon: Users },
  { id: 'Productivity', label: 'Productivity', Icon: Zap },
  { id: 'HR Tech', label: 'HR Tech', Icon: UserCog },
  { id: 'Web3', label: 'Web3', Icon: Coins },
  { id: 'Other', label: 'Other', Icon: CircleDashed },
];

export const CATEGORIES_WITH_ALL = [
  { id: 'All', label: 'All', Icon: LayoutGrid },
  ...CATEGORIES,
];

export function CategoryPicker({ selectedCategory, onSelect }) {
  const [visible, setVisible] = useState(false);

  const handleSelect = (categoryId) => {
    onSelect(categoryId);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: colors.foreground,
            letterSpacing: -0.5,
          }}
        >
          {selectedCategory}
        </Text>
        <ChevronDown size={20} color={colors.mutedForeground} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setVisible(false)}
        >
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              paddingTop: spacing.md,
              paddingBottom: spacing.xxl,
              maxHeight: '70%',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
                Choose a category
              </Text>
              <Pressable
                onPress={() => setVisible(false)}
                style={({ pressed }) => ({
                  padding: spacing.sm,
                  borderRadius: borderRadius.sm,
                  backgroundColor: pressed ? colors.secondary : 'transparent',
                })}
              >
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Categories Grid */}
            <ScrollView
              contentContainerStyle={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                padding: spacing.md,
                gap: spacing.sm,
              }}
            >
              {CATEGORIES_WITH_ALL.map((category) => {
                const isSelected = selectedCategory === category.id;
                const IconComponent = category.Icon;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => handleSelect(category.id)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingHorizontal: spacing.md,
                      paddingVertical: 10,
                      borderRadius: borderRadius.full,
                      borderWidth: 1,
                      backgroundColor: isSelected ? colors.primary : pressed ? colors.card : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    })}
                  >
                    <IconComponent
                      size={16}
                      color={isSelected ? colors.primaryForeground : colors.foreground}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: isSelected ? colors.primaryForeground : colors.foreground,
                      }}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default CategoryPicker;
