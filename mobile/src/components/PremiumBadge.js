// Premium badge overlay
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../constants/theme';

export default function PremiumBadge({ style }) {
  return (
    <View style={[styles.badge, style]}>
      <MaterialIcons name="star" size={12} color={COLORS.premium} />
      <Text style={styles.text}>PREMIUM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.premiumBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.premium,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.premium,
    marginLeft: 3,
    letterSpacing: 1,
  },
});
