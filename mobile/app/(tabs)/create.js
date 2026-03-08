// Create Tab — Quick create modal / navigator to all creation tools
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';

const CREATE_OPTIONS = [
  { id: 'script', title: 'New Video Script', desc: 'AI-powered script generation', icon: 'edit-note', route: '/scripts/generator' },
  { id: 'thumbnail', title: 'Generate Thumbnail', desc: 'AI thumbnail concepts', icon: 'image', route: '/thumbnail' },
  { id: 'schedule', title: 'Schedule Post', desc: 'Auto-publish to platforms', icon: 'schedule-send', route: '/scheduler' },
  { id: 'keywords', title: 'Research Keywords', desc: 'Find trending topics', icon: 'trending-up', route: '/keywords' },
  { id: 'editor', title: 'Open Video Editor', desc: 'Edit with stock assets', icon: 'movie-filter', route: '/editor' },
  { id: 'brand', title: 'Brand Assets', desc: 'Logos, fonts & styles', icon: 'palette', route: '/brand' },
];

export default function CreateScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Create Something</Text>
      <Text style={styles.subtitle}>What would you like to create today?</Text>

      <View style={styles.grid}>
        {CREATE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={styles.card}
            onPress={() => router.push(opt.route)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[COLORS.bgCardLight, COLORS.bgCard]}
              style={styles.cardInner}
            >
              <View style={styles.iconWrap}>
                <MaterialIcons name={opt.icon} size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>{opt.title}</Text>
              <Text style={styles.cardDesc}>{opt.desc}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: SPACING.lg },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginTop: SPACING.lg },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.xl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  card: {
    width: '47%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardInner: {
    padding: SPACING.lg,
    minHeight: 140,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardDesc: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 16 },
});
