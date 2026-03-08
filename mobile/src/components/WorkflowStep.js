// Workflow step indicator for "Your Content Workflow" section
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export default function WorkflowStep({ label, sublabel, icon, color, isLast }) {
  return (
    <View style={styles.row}>
      <View style={styles.leftCol}>
        <View style={[styles.dot, { backgroundColor: color }]}>
          <MaterialIcons name={icon} size={20} color="#fff" />
        </View>
        {!isLast && <View style={[styles.line, { backgroundColor: color + '44' }]} />}
      </View>
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sublabel}>{sublabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  leftCol: { alignItems: 'center', marginRight: SPACING.md },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { width: 2, height: 28 },
  textCol: { paddingTop: 6, flex: 1 },
  label: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sublabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
