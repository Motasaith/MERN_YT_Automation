// Script Generator — matches AI Video Script Generator design (mockup 3)
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '../../src/components/GradientButton';
import Card from '../../src/components/Card';
import { COLORS, SPACING, RADIUS, TONE_OPTIONS } from '../../src/constants/theme';
import { generateScriptPreview } from '../../src/services/api';

export default function ScriptGenerator() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('viral');
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('Required', 'Please enter a video topic');
      return;
    }
    setLoading(true);
    try {
      const result = await generateScriptPreview(topic, '', 'general', tone, 'medium');
      setScript(result.script);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = () => {
    // Pass generated script to the detail screen
    router.push({
      pathname: '/scripts/detail',
      params: { script: JSON.stringify(script), topic },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Video Script Generator</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Topic Input */}
        <Text style={styles.sectionTitle}>What is your video about?</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your video topic or keywords..."
          placeholderTextColor={COLORS.textMuted}
          value={topic}
          onChangeText={setTopic}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Tone Selection */}
        <View style={styles.toneHeader}>
          <MaterialIcons name="tune" size={20} color={COLORS.text} />
          <Text style={styles.toneTitle}>Select Tone</Text>
        </View>
        <View style={styles.toneGrid}>
          {TONE_OPTIONS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.toneBtn, tone === t.id && styles.toneBtnActive]}
              onPress={() => setTone(t.id)}
            >
              <MaterialIcons
                name={t.icon}
                size={18}
                color={tone === t.id ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.toneLabel, tone === t.id && styles.toneLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate Button */}
        <GradientButton
          title="Generate Script"
          icon="auto-awesome"
          onPress={handleGenerate}
          loading={loading}
          style={styles.generateBtn}
        />

        {/* Generated Script */}
        <Text style={styles.resultTitle}>Generated Script</Text>
        {script ? (
          <Card glow style={styles.scriptCard}>
            <Text style={styles.scriptTitle}>{topic}</Text>
            <View style={styles.draftBadge}>
              <Text style={styles.draftText}>DRAFT V1</Text>
            </View>
            <Text style={styles.scriptPreview} numberOfLines={8}>
              {script.fullScript || (script.scenes
                ? script.scenes.map((s) => s.text).join('\n\n')
                : JSON.stringify(script).substring(0, 300))}
            </Text>
            <GradientButton
              title="Open Full Script"
              icon="open-in-new"
              onPress={handleOpenDetail}
              small
              style={{ marginTop: SPACING.md }}
            />
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <MaterialIcons name="description" size={48} color={COLORS.textDark} />
            <Text style={styles.emptyTitle}>Your script will appear here...</Text>
            <Text style={styles.emptySubtitle}>Fill in your topic and hit generate to see the magic</Text>
          </Card>
        )}

        <View style={{ height: 40 }} />
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
  sectionTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: SPACING.lg, marginBottom: SPACING.md },

  // Input
  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    paddingTop: SPACING.lg,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Tone
  toneHeader: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.md },
  toneTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginLeft: 8 },
  toneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  toneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    minWidth: '45%',
    justifyContent: 'center',
  },
  toneBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryGlow,
  },
  toneLabel: { fontSize: 14, color: COLORS.textSecondary, marginLeft: 8, fontWeight: '500' },
  toneLabelActive: { color: COLORS.primary, fontWeight: '700' },

  // Generate
  generateBtn: { marginTop: SPACING.xl },

  // Script Result
  resultTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xl, marginBottom: SPACING.md },
  scriptCard: { position: 'relative' },
  scriptTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  draftBadge: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.bgCardLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  draftText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1 },
  scriptPreview: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginTop: SPACING.sm },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
});
