// Online Video Editor — Cloud-based editing with stock library
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '../src/components/GradientButton';
import Card from '../src/components/Card';
import PremiumBadge from '../src/components/PremiumBadge';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';

const TIMELINE_TRACKS = [
  { id: 1, type: 'video', label: 'Scene 1 — Hook', duration: '0:00 - 0:05', icon: 'videocam' },
  { id: 2, type: 'video', label: 'Scene 2 — Point 1', duration: '0:05 - 0:15', icon: 'videocam' },
  { id: 3, type: 'video', label: 'Scene 3 — Point 2', duration: '0:15 - 0:25', icon: 'videocam' },
  { id: 4, type: 'audio', label: 'AI Voiceover', duration: 'Full track', icon: 'mic' },
  { id: 5, type: 'text', label: 'Text Overlays', duration: 'Various', icon: 'text-fields' },
];

const STOCK_CATEGORIES = ['Technology', 'Business', 'Nature', 'People', 'Abstract', 'Cinematic'];

export default function EditorScreen() {
  const router = useRouter();
  const [format, setFormat] = useState('reel');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Editor</Text>
        <TouchableOpacity style={styles.exportBtn}>
          <MaterialIcons name="file-download" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Preview Area */}
        <Card style={styles.previewCard}>
          <View style={[styles.preview, format === 'reel' ? styles.previewReel : styles.previewLandscape]}>
            <MaterialIcons name="play-circle-outline" size={48} color={COLORS.primary} />
            <Text style={styles.previewText}>Video Preview</Text>
          </View>
          <View style={styles.formatRow}>
            <TouchableOpacity
              style={[styles.formatBtn, format === 'reel' && styles.formatBtnActive]}
              onPress={() => setFormat('reel')}
            >
              <Text style={[styles.formatLabel, format === 'reel' && styles.formatLabelActive]}>9:16 Reel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formatBtn, format === 'landscape' && styles.formatBtnActive]}
              onPress={() => setFormat('landscape')}
            >
              <Text style={[styles.formatLabel, format === 'landscape' && styles.formatLabelActive]}>16:9 Landscape</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Timeline */}
        <Text style={styles.sectionTitle}>Timeline</Text>
        {TIMELINE_TRACKS.map((track) => (
          <TouchableOpacity key={track.id} style={styles.trackRow}>
            <View style={[styles.trackIcon, {
              backgroundColor: track.type === 'video' ? COLORS.primary + '22'
                : track.type === 'audio' ? COLORS.info + '22' : COLORS.warning + '22'
            }]}>
              <MaterialIcons
                name={track.icon}
                size={18}
                color={track.type === 'video' ? COLORS.primary
                  : track.type === 'audio' ? COLORS.info : COLORS.warning}
              />
            </View>
            <View style={styles.trackInfo}>
              <Text style={styles.trackLabel}>{track.label}</Text>
              <Text style={styles.trackDuration}>{track.duration}</Text>
            </View>
            <MaterialIcons name="drag-handle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Stock Library */}
        <View style={styles.stockHeader}>
          <Text style={styles.sectionTitle}>Stock Library</Text>
          <PremiumBadge />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stockScroll}>
          {STOCK_CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat} style={styles.stockChip}>
              <Text style={styles.stockChipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stock Preview Grid */}
        <View style={styles.stockGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TouchableOpacity key={i} style={styles.stockItem}>
              <MaterialIcons name="movie" size={28} color={COLORS.textDark} />
              <Text style={styles.stockItemLabel}>Clip {i}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Video Generation */}
        <Card glow style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <MaterialIcons name="auto-awesome" size={24} color={COLORS.premium} />
            <Text style={styles.aiTitle}>AI Video Generation</Text>
            <PremiumBadge style={{ marginLeft: 'auto' }} />
          </View>
          <Text style={styles.aiDesc}>
            Generate unique AI video clips for each scene. Uses Kling AI, Pixverse, and Stability AI.
          </Text>
          <GradientButton
            title="Generate AI Clips"
            icon="movie-filter"
            onPress={() => Alert.alert('Premium', 'AI video generation requires a premium subscription')}
            small
            style={{ marginTop: SPACING.md }}
          />
        </Card>

        {/* Export */}
        <GradientButton
          title="Export Video"
          icon="file-download"
          onPress={() => Alert.alert('Exporting', 'Video export started...')}
          style={{ marginTop: SPACING.md }}
        />

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  exportBtn: { padding: 8 },
  scroll: { flex: 1, paddingHorizontal: SPACING.lg },

  previewCard: { marginTop: SPACING.lg, alignItems: 'center' },
  preview: { backgroundColor: COLORS.bgCardLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  previewReel: { width: '50%', aspectRatio: 9 / 16 },
  previewLandscape: { width: '100%', aspectRatio: 16 / 9 },
  previewText: { fontSize: 13, color: COLORS.textMuted, marginTop: 8 },

  formatRow: { flexDirection: 'row', marginTop: SPACING.md, gap: SPACING.sm },
  formatBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formatBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  formatLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  formatLabelActive: { color: COLORS.primary, fontWeight: '700' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xl, marginBottom: SPACING.md },

  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trackIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  trackInfo: { flex: 1 },
  trackLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  trackDuration: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  stockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.xl, marginBottom: SPACING.md },
  stockScroll: { marginBottom: SPACING.md },
  stockChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  stockChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },

  stockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  stockItem: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stockItemLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },

  aiCard: { marginTop: SPACING.lg },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  aiTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginLeft: 10 },
  aiDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});
