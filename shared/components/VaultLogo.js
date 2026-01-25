import { Pressable, View, Text } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors } from '../theme';

const sizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
};

export function VaultLogo({ size = 'md' }) {
  const dimension = sizes[size];

  return (
    <View style={{ width: dimension, height: dimension }}>
      <Svg viewBox="0 0 40 40" width={dimension} height={dimension}>
        {/* Abstract vault / container shape - matching web */}
        <Rect x="4" y="8" width="14" height="14" rx="3" fill={colors.primary} />
        <Rect x="22" y="8" width="14" height="14" rx="3" fill={colors.primary} fillOpacity={0.6} />
        <Rect x="4" y="26" width="14" height="6" rx="2" fill={colors.primary} fillOpacity={0.4} />
        <Rect x="22" y="26" width="14" height="6" rx="2" fill={colors.primary} fillOpacity={0.8} />
      </Svg>
    </View>
  );
}

export function VaultLogoWithText({ size = 'md', onPress }) {
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <VaultLogo size={size} />
      <Text style={{
        fontSize: size === 'lg' ? 24 : 20,
        fontWeight: '700',
        color: colors.foreground,
        letterSpacing: -0.5,
      }}>
        Vault
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export default VaultLogo;
