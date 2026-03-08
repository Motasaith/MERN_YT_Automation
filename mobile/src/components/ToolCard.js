// Tool card for the Creative Ecosystem grid
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Card from './Card';
import { COLORS, SPACING } from '../constants/theme';

export default function ToolCard({ name, desc, icon, onPress }) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialIcons name={icon} size={28} color={COLORS.primary} />
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.desc} numberOfLines={2}>{desc}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: SPACING.md },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  desc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
});
