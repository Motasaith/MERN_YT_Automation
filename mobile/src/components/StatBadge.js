// Stat badge used on the home dashboard
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export default function StatBadge({ label, value, change, color }) {
  return (
    <View style={[styles.badge, { borderColor: color || COLORS.primary }]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: color || COLORS.primary }]}>{value}</Text>
        {change && (
          <View style={[styles.changeBg, { backgroundColor: (color || COLORS.primary) + '22' }]}>
            <Text style={[styles.change, { color: color || COLORS.primary }]}>{change}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  label: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  valueRow: { flexDirection: 'row', alignItems: 'center' },
  value: { fontSize: 22, fontWeight: '800' },
  changeBg: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  change: { fontSize: 10, fontWeight: '600' },
});
