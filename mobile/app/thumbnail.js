// Thumbnail AI — Smart thumbnail generation: DeepSeek prompt → editable → Stability AI image
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '../src/components/GradientButton';
import Card from '../src/components/Card';
import { COLORS, SPACING, RADIUS, API_BASE_URL } from '../src/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const THUMBNAIL_STYLES = [
  { id: 'bold', label: 'Bold & Colorful', icon: 'palette' },
  { id: 'minimal', label: 'Minimalist', icon: 'crop-square' },
  { id: 'dramatic', label: 'Dramatic', icon: 'flash-on' },
  { id: 'cinematic', label: 'Cinematic', icon: 'movie' },
];

const apiCall = async (endpoint, body) => {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
};

export default function ThumbnailScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [script, setScript] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('bold');
  const [promptLoading, setPromptLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [step, setStep] = useState(1); // 1=input, 2=edit prompt, 3=result

  // Step 1: Generate prompt from title/script via DeepSeek
  const handleGeneratePrompt = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Enter a video title');
      return;
    }
    setPromptLoading(true);
    try {
      const data = await apiCall('/api/thumbnail/prompt', {
        title: title.trim(),
        script: script.trim() || undefined,
        style: selectedStyle,
      });
      setGeneratedPrompt(data.prompt);
      setStep(2);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setPromptLoading(false);
    }
  };

  // Step 2: Generate actual thumbnail image via Stability AI
  const handleGenerateImage = async () => {
    if (!generatedPrompt.trim()) {
      Alert.alert('Required', 'Prompt cannot be empty');
      return;
    }
    setImageLoading(true);
    try {
      const data = await apiCall('/api/thumbnail/generate', {
        prompt: generatedPrompt.trim(),
      });
      setThumbnailUrl(`${API_BASE_URL}${data.imageUrl}`);
      setStep(3);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setImageLoading(false);
    }
  };

  const handleStartOver = () => {
    setStep(1);
    setGeneratedPrompt('');
    setThumbnailUrl(null);
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
        {/* Progress Indicator */}
        <View style={styles.steps}>
          {['Title & Style', 'Edit Prompt', 'Result'].map((label, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepDot, step > i && styles.stepDotActive]}>
                {step > i + 1 ? (
                  <MaterialIcons name="check" size={14} color="#fff" />
                ) : (
                  <Text style={[styles.stepNum, step > i && styles.stepNumActive]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, step > i && styles.stepLabelActive]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* STEP 1: Title, optional script, style */}
        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>Video Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your video title..."
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.sectionTitle}>Script (optional)</Text>
            <Text style={styles.hint}>Paste your script for a more accurate thumbnail prompt</Text>
            <TextInput
              style={[styles.input, { minHeight: 100 }]}
              placeholder="Paste script excerpt here..."
              placeholderTextColor={COLORS.textMuted}
              value={script}
              onChangeText={setScript}
              multiline
              textAlignVertical="top"
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
                </TouchableOpacity>
              ))}
            </View>

            <GradientButton
              title="Generate Prompt with AI"
              icon="auto-awesome"
              onPress={handleGeneratePrompt}
              loading={promptLoading}
              style={{ marginTop: SPACING.xl }}
            />
          </>
        )}

        {/* STEP 2: Editable AI prompt */}
        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>AI-Generated Prompt</Text>
            <Text style={styles.hint}>Edit the prompt below to refine your thumbnail before generating</Text>
            <TextInput
              style={[styles.input, styles.promptInput]}
              value={generatedPrompt}
              onChangeText={setGeneratedPrompt}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.btnRow}>
              <TouchableOpacity onPress={() => setStep(1)} style={styles.backStepBtn}>
                <MaterialIcons name="arrow-back" size={18} color={COLORS.textSecondary} />
                <Text style={styles.backStepText}>Back</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <GradientButton
                  title="Generate Thumbnail"
                  icon="image"
                  onPress={handleGenerateImage}
                  loading={imageLoading}
                />
              </View>
            </View>

            {imageLoading && (
              <Card style={styles.loadingCard}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Generating with Stability AI...</Text>
                <Text style={styles.loadingHint}>This may take 15-30 seconds</Text>
              </Card>
            )}
          </>
        )}

        {/* STEP 3: Result */}
        {step === 3 && thumbnailUrl && (
          <>
            <Text style={styles.sectionTitle}>Your Thumbnail</Text>
            <Card glow style={styles.resultCard}>
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
              <Text style={styles.resultTitle}>{title}</Text>
              <Text style={styles.resultPrompt} numberOfLines={3}>{generatedPrompt}</Text>
            </Card>

            <View style={styles.actionRow}>
              <GradientButton
                title="Regenerate"
                icon="refresh"
                onPress={() => { setStep(2); setThumbnailUrl(null); }}
                outline
                small
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <GradientButton
                title="Start Over"
                icon="restart-alt"
                onPress={handleStartOver}
                outline
                small
                style={{ flex: 1 }}
              />
            </View>
          </>
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  hint: { fontSize: 13, color: COLORS.textMuted, marginBottom: SPACING.sm },

  // Steps indicator
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.lg, marginBottom: SPACING.sm },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.bgCardLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNum: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  stepLabelActive: { color: COLORS.text },

  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  promptInput: {
    minHeight: 160,
    lineHeight: 22,
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

  // Step 2
  btnRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xl, gap: SPACING.md },
  backStepBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  backStepText: { fontSize: 14, color: COLORS.textSecondary, marginLeft: 4 },
  loadingCard: { alignItems: 'center', paddingVertical: SPACING.xl, marginTop: SPACING.lg },
  loadingText: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: SPACING.md },
  loadingHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  // Step 3 result
  resultCard: { overflow: 'hidden', padding: 0 },
  thumbnailImage: { width: '100%', height: (SCREEN_W - SPACING.lg * 2) * 9 / 16, borderTopLeftRadius: RADIUS.md, borderTopRightRadius: RADIUS.md },
  resultTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  resultPrompt: { fontSize: 12, color: COLORS.textMuted, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, marginTop: 4 },
  actionRow: { flexDirection: 'row', marginTop: SPACING.md },
});
