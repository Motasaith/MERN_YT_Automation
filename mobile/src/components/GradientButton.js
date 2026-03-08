// Gradient button component matching the purple CreatorFlow theme
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export default function GradientButton({ title, onPress, icon, loading, disabled, style, small, outline }) {
  if (outline) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.outlineBtn, small && styles.smallBtn, disabled && styles.disabled, style]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="small" />
        ) : (
          <View style={styles.row}>
            {icon && <MaterialIcons name={icon} size={small ? 16 : 20} color={COLORS.primary} style={styles.icon} />}
            <Text style={[styles.outlineText, small && styles.smallText]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.8} style={[disabled && styles.disabled, style]}>
      <LinearGradient
        colors={COLORS.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, small && styles.smallBtn]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View style={styles.row}>
            {icon && <MaterialIcons name={icon} size={small ? 16 : 20} color="#fff" style={styles.icon} />}
            <Text style={[styles.text, small && styles.smallText]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: SPACING.sm },
  text: { fontSize: 16, fontWeight: '700', color: '#fff' },
  smallBtn: { paddingVertical: 10, paddingHorizontal: 18 },
  smallText: { fontSize: 14 },
  outlineBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  disabled: { opacity: 0.5 },
});
