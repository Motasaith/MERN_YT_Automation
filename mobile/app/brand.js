// Brand Assets — Manage logos, fonts, and brand styles
import React from 'react';
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
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';

const BRAND_COLORS = ['#b44aff', '#e040fb', '#40c4ff', '#00e676', '#ffc107', '#ff5252'];

const FONT_PRESETS = [
  { id: 1, name: 'Bold Impact', font: 'Impact', preview: 'Aa' },
  { id: 2, name: 'Clean Sans', font: 'Helvetica', preview: 'Aa' },
  { id: 3, name: 'Modern Mono', font: 'Courier', preview: 'Aa' },
  { id: 4, name: 'Elegant Serif', font: 'Georgia', preview: 'Aa' },
];

export default function BrandScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Brand Assets</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <Text style={styles.sectionTitle}>Your Logo</Text>
        <Card style={styles.logoCard}>
          <TouchableOpacity style={styles.logoUpload} onPress={() => Alert.alert('Upload', 'Choose a logo image')}>
            <MaterialIcons name="add-photo-alternate" size={36} color={COLORS.textMuted} />
            <Text style={styles.logoUploadText}>Tap to upload logo</Text>
          </TouchableOpacity>
        </Card>

        {/* Brand Colors */}
        <Text style={styles.sectionTitle}>Brand Colors</Text>
        <Card style={styles.colorsCard}>
          <View style={styles.colorRow}>
            {BRAND_COLORS.map((color, i) => (
              <TouchableOpacity key={i} style={[styles.colorDot, { backgroundColor: color }]}>
                {i === 0 && <MaterialIcons name="check" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addColorBtn}>
              <MaterialIcons name="add" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Font Presets */}
        <Text style={styles.sectionTitle}>Font Presets</Text>
        <View style={styles.fontGrid}>
          {FONT_PRESETS.map((f) => (
            <TouchableOpacity key={f.id} style={styles.fontCard}>
              <Text style={styles.fontPreview}>{f.preview}</Text>
              <Text style={styles.fontName}>{f.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Watermark */}
        <Text style={styles.sectionTitle}>Watermark Settings</Text>
        <Card style={styles.watermarkCard}>
          <View style={styles.watermarkRow}>
            <MaterialIcons name="branding-watermark" size={24} color={COLORS.primary} />
            <View style={styles.watermarkInfo}>
              <Text style={styles.watermarkTitle}>Auto-Watermark</Text>
              <Text style={styles.watermarkDesc}>Add your logo to all exported videos</Text>
            </View>
            <TouchableOpacity style={styles.toggleBtn}>
              <Text style={styles.toggleText}>ON</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Intro/Outro */}
        <Text style={styles.sectionTitle}>Intro & Outro Templates</Text>
        <View style={styles.templateRow}>
          <Card style={styles.templateCard}>
            <MaterialIcons name="play-arrow" size={32} color={COLORS.primary} />
            <Text style={styles.templateLabel}>Intro</Text>
            <Text style={styles.templateStatus}>Not set</Text>
          </Card>
          <Card style={styles.templateCard}>
            <MaterialIcons name="stop" size={32} color={COLORS.secondary} />
            <Text style={styles.templateLabel}>Outro</Text>
            <Text style={styles.templateStatus}>Not set</Text>
          </Card>
        </View>

        <GradientButton
          title="Save Brand Kit"
          icon="save"
          onPress={() => Alert.alert('Saved', 'Brand assets saved successfully!')}
          style={{ marginTop: SPACING.xl }}
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
  scroll: { flex: 1, paddingHorizontal: SPACING.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xl, marginBottom: SPACING.md },

  logoCard: { alignItems: 'center' },
  logoUpload: {
    width: 120,
    height: 120,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoUploadText: { fontSize: 11, color: COLORS.textMuted, marginTop: 8 },

  colorsCard: {},
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addColorBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fontGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  fontCard: {
    width: '48%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fontPreview: { fontSize: 32, fontWeight: '800', color: COLORS.text },
  fontName: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },

  watermarkCard: {},
  watermarkRow: { flexDirection: 'row', alignItems: 'center' },
  watermarkInfo: { flex: 1, marginLeft: SPACING.md },
  watermarkTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  watermarkDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  toggleBtn: {
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  toggleText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  templateRow: { flexDirection: 'row', gap: SPACING.md },
  templateCard: { flex: 1, alignItems: 'center', paddingVertical: SPACING.xl },
  templateLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 8 },
  templateStatus: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
});
