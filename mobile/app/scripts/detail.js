// Script Detail — matches AI Video Script design (mockup 2)
// Shows generated script with AI Voiceover, Source Media, and Video Editor options
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '../../src/components/GradientButton';
import Card from '../../src/components/Card';
import PremiumBadge from '../../src/components/PremiumBadge';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { generateVoice, startVideoGeneration } from '../../src/services/api';

export default function ScriptDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scriptData = params.script ? JSON.parse(params.script) : null;
  const topic = params.topic || 'Untitled Script';

  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceGenerated, setVoiceGenerated] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const fullText = scriptData?.scenes
    ? scriptData.scenes.map((s) => s.narration).join('\n\n')
    : 'No script generated yet.';

  const handleGenerateVoice = async () => {
    setVoiceLoading(true);
    try {
      await generateVoice(fullText, 'en-US-ChristopherNeural', '+0%', '+0Hz');
      setVoiceGenerated(true);
      Alert.alert('Success', 'AI voiceover generated successfully!');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setVoiceLoading(false);
    }
  };

  const handleAddMedia = async () => {
    setMediaLoading(true);
    try {
      // This triggers the full video generation with Pexels
      const result = await startVideoGeneration({
        title: topic,
        description: '',
        niche: 'general',
        videoFormat: 'reel',
        videoDuration: 'medium',
        videoSource: 'pexels',
        voice: 'en-US-ChristopherNeural',
      });
      Alert.alert('Processing', `Video generation started! Job ID: ${result.jobId}`);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setMediaLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Video Script</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <MaterialIcons name="more-horiz" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Script Section */}
        <Text style={styles.sectionLabel}>Generated Script</Text>

        {/* Script Card with Thumbnail */}
        <Card glow style={styles.scriptCard}>
          {/* Thumbnail Placeholder */}
          <View style={styles.thumbnailPlaceholder}>
            <MaterialIcons name="psychology" size={64} color={COLORS.info} />
          </View>

          {/* Title + Draft Badge */}
          <View style={styles.titleRow}>
            <Text style={styles.scriptTitle}>{topic}</Text>
            <View style={styles.draftBadge}>
              <Text style={styles.draftText}>DRAFT V1</Text>
            </View>
          </View>

          {/* Script Text */}
          <Text style={styles.scriptText}>
            {fullText.length > 300 ? fullText.substring(0, 300) + ' [Script continues...]' : fullText}
          </Text>

          {/* Edit Script Button */}
          <GradientButton
            title="Edit Script"
            icon="edit"
            onPress={() => router.push({ pathname: '/scripts/generator', params: { topic, prefill: fullText } })}
            small
            style={{ marginTop: SPACING.md }}
          />
        </Card>

        {/* AI Voiceover Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionRow}>
            <MaterialIcons name="record-voice-over" size={24} color={COLORS.info} />
            <Text style={styles.sectionTitle}>AI Voiceover</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Convert your script into professional narration with 50+ human-like voices.
          </Text>
          <GradientButton
            title={voiceGenerated ? 'Voice Generated ✓' : 'Generate Voice'}
            onPress={handleGenerateVoice}
            loading={voiceLoading}
            disabled={voiceGenerated}
            outline={!voiceGenerated}
            style={{ marginTop: SPACING.md }}
          />
        </Card>

        {/* Source Media Assets Section (PREMIUM) */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionRow}>
            <MaterialIcons name="perm-media" size={24} color={COLORS.success} />
            <Text style={styles.sectionTitle}>Source Media Assets</Text>
            <PremiumBadge style={{ marginLeft: 'auto' }} />
          </View>
          <Text style={styles.sectionDesc}>
            Automatically find stock footage or generate unique AI visuals for your scenes.
          </Text>
          <GradientButton
            title="Add Media"
            onPress={handleAddMedia}
            loading={mediaLoading}
            outline
            style={{ marginTop: SPACING.md }}
          />
        </Card>

        {/* Open in Video Editor */}
        <GradientButton
          title="Open in Video Editor"
          icon="movie-filter"
          onPress={() => router.push('/editor')}
          style={{ marginTop: SPACING.md }}
        />

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
  moreBtn: { padding: 8 },
  scroll: { flex: 1, paddingHorizontal: SPACING.lg },

  sectionLabel: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginTop: SPACING.lg, marginBottom: SPACING.md },

  // Script Card
  scriptCard: { overflow: 'hidden', padding: 0 },
  thumbnailPlaceholder: {
    height: 180,
    backgroundColor: COLORS.bgCardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  scriptTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, flex: 1 },
  draftBadge: {
    backgroundColor: COLORS.bgCardLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginLeft: SPACING.sm,
  },
  draftText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1 },
  scriptText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },

  // Section Cards
  sectionCard: { marginTop: SPACING.md },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginLeft: 10 },
  sectionDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});
