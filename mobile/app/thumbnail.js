// Thumbnail AI — Generate high-CTR thumbnail concepts
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
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

const THUMBNAIL_STYLES = [
  { id: 'bold', label: 'Bold & Colorful', icon: 'palette', desc: 'Eye-catching colors with large text' },
  { id: 'minimal', label: 'Minimalist', icon: 'crop-square', desc: 'Clean design with focused imagery' },
  { id: 'dramatic', label: 'Dramatic', icon: 'flash-on', desc: 'Dark tones with spotlight effects' },
  { id: 'comparison', label: 'Comparison', icon: 'compare', desc: 'Side-by-side vs. layout' },
];

export default function ThumbnailScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('bold');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleGenerate = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Enter a video title for thumbnail generation');
      return;
    }
    setLoading(true);
    // Simulate AI generation
    setTimeout(() => {
      setResults([
        { id: 1, concept: `Bold "${title}" with neon glow effect, large face reaction, bright gradient background`, score: 94 },
        { id: 2, concept: `Split screen comparison with before/after, bold yellow text overlay`, score: 88 },
        { id: 3, concept: `Close-up expression with emoji overlay, red arrow pointing to key element`, score: 82 },
      ]);
      setLoading(false);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thumbnail AI</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Video Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your video title..."
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.sectionTitle}>Thumbnail Style</Text>
        <View style={styles.styleGrid}>
          {THUMBNAIL_STYLES.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.styleCard, selectedStyle === s.id && styles.styleCardActive]}
              onPress={() => setSelectedStyle(s.id)}
            >
              <MaterialIcons
                name={s.icon}
                size={24}
                color={selectedStyle === s.id ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.styleLabel, selectedStyle === s.id && styles.styleLabelActive]}>{s.label}</Text>
              <Text style={styles.styleDesc}>{s.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <GradientButton
          title="Generate Thumbnails"
          icon="auto-awesome"
          onPress={handleGenerate}
          loading={loading}
          style={{ marginTop: SPACING.xl }}
        />

        {/* Results */}
        {results.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>AI Suggestions</Text>
            {results.map((r) => (
              <Card key={r.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.scoreWrap}>
                    <Text style={styles.scoreText}>{r.score}</Text>
                    <Text style={styles.scoreLabel}>CTR Score</Text>
                  </View>
                </View>
                <Text style={styles.conceptText}>{r.concept}</Text>
                <GradientButton title="Use This Concept" onPress={() => {}} small outline style={{ marginTop: SPACING.sm }} />
              </Card>
            ))}
          </>
        )}

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

  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  styleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  styleCard: {
    width: '48%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  styleCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  styleLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginTop: 6 },
  styleLabelActive: { color: COLORS.primary },
  styleDesc: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },

  resultCard: { marginBottom: SPACING.md },
  resultHeader: { flexDirection: 'row', marginBottom: SPACING.sm },
  scoreWrap: {
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  scoreText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  scoreLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },
  conceptText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
});
