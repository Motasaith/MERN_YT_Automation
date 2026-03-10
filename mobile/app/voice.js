// Voice Generator — AI Voiceover using Edge TTS neural voices
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '../src/components/GradientButton';
import Card from '../src/components/Card';
import { COLORS, SPACING, RADIUS, API_BASE_URL } from '../src/constants/theme';
import { getVoices, generateVoice } from '../src/services/api';

const RATE_OPTIONS = [
  { label: 'Slow', value: '-20%' },
  { label: 'Normal', value: '+0%' },
  { label: 'Fast', value: '+20%' },
  { label: 'Very Fast', value: '+40%' },
];

const PITCH_OPTIONS = [
  { label: 'Low', value: '-10Hz' },
  { label: 'Normal', value: '+0Hz' },
  { label: 'High', value: '+10Hz' },
];

export default function VoiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [text, setText] = useState(params.text || '');
  const [voices, setVoices] = useState({});
  const [selectedVoice, setSelectedVoice] = useState('en-US-ChristopherNeural');
  const [rate, setRate] = useState('+0%');
  const [pitch, setPitch] = useState('+0Hz');
  const [loading, setLoading] = useState(false);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState(null);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const data = await getVoices();
      setVoices(data.voices || {});
    } catch (err) {
      // Fallback voices if server is unreachable
      setVoices({
        'Christopher (Male, US)': 'en-US-ChristopherNeural',
        'Aria (Female, US)': 'en-US-AriaNeural',
        'Guy (Male, US)': 'en-US-GuyNeural',
        'Jenny (Female, US)': 'en-US-JennyNeural',
        'Emma (Female, UK)': 'en-GB-SoniaNeural',
        'Ryan (Male, UK)': 'en-GB-RyanNeural',
      });
    } finally {
      setVoicesLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      Alert.alert('Required', 'Enter text to convert to speech');
      return;
    }
    setLoading(true);
    setAudioUrl(null);
    try {
      const data = await generateVoice(text.trim(), selectedVoice, rate, pitch);
      if (data.audioUrl) {
        setAudioUrl(`${API_BASE_URL}${data.audioUrl}`);
        Alert.alert('Success', 'Voiceover generated! Audio file is ready.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const voiceEntries = Object.entries(voices);
  const getVoiceGender = (label) => label.includes('Male') ? 'male' : 'female';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Voice Generator</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Text Input */}
        <Text style={styles.sectionTitle}>Text to Speech</Text>
        <Text style={styles.hint}>Enter or paste the text you want to convert to speech</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Type or paste your script text here..."
          placeholderTextColor={COLORS.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{text.length} characters</Text>

        {/* Voice Selection */}
        <Text style={styles.sectionTitle}>Select Voice</Text>
        {voicesLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.voiceGrid}>
            {voiceEntries.map(([label, voiceId]) => (
              <TouchableOpacity
                key={voiceId}
                style={[styles.voiceCard, selectedVoice === voiceId && styles.voiceCardActive]}
                onPress={() => setSelectedVoice(voiceId)}
              >
                <MaterialIcons
                  name={getVoiceGender(label) === 'male' ? 'face' : 'face-3'}
                  size={22}
                  color={selectedVoice === voiceId ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={[styles.voiceName, selectedVoice === voiceId && styles.voiceNameActive]} numberOfLines={1}>
                  {label.split('(')[0].trim()}
                </Text>
                <Text style={styles.voiceAccent}>
                  {label.match(/\((.+)\)/)?.[1] || ''}
                </Text>
                {selectedVoice === voiceId && (
                  <MaterialIcons name="check-circle" size={16} color={COLORS.primary} style={styles.voiceCheck} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Speed */}
        <Text style={styles.sectionTitle}>Speed</Text>
        <View style={styles.optionRow}>
          {RATE_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.optionBtn, rate === r.value && styles.optionBtnActive]}
              onPress={() => setRate(r.value)}
            >
              <Text style={[styles.optionText, rate === r.value && styles.optionTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pitch */}
        <Text style={styles.sectionTitle}>Pitch</Text>
        <View style={styles.optionRow}>
          {PITCH_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.optionBtn, pitch === p.value && styles.optionBtnActive]}
              onPress={() => setPitch(p.value)}
            >
              <Text style={[styles.optionText, pitch === p.value && styles.optionTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate */}
        <GradientButton
          title="Generate Voiceover"
          icon="record-voice-over"
          onPress={handleGenerate}
          loading={loading}
          style={{ marginTop: SPACING.xl }}
        />

        {/* Result */}
        {audioUrl && (
          <Card glow style={styles.resultCard}>
            <View style={styles.resultRow}>
              <View style={styles.resultIcon}>
                <MaterialIcons name="graphic-eq" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>Voiceover Ready</Text>
                <Text style={styles.resultSub}>
                  {voiceEntries.find(([, v]) => v === selectedVoice)?.[0] || selectedVoice}
                </Text>
              </View>
              <MaterialIcons name="check-circle" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.resultHint}>
              Audio file saved on server. Use it in the Video Editor or download from your library.
            </Text>
          </Card>
        )}

        {loading && (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Generating with Edge TTS...</Text>
            <Text style={styles.loadingHint}>Using Microsoft Neural Voice technology</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  scroll: { flex: 1, paddingHorizontal: SPACING.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  hint: { fontSize: 13, color: COLORS.textMuted, marginBottom: SPACING.sm },

  textInput: {
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.lg, padding: SPACING.lg, paddingTop: SPACING.lg,
    fontSize: 15, color: COLORS.text, minHeight: 150, borderWidth: 1, borderColor: COLORS.border, lineHeight: 22,
  },
  charCount: { fontSize: 12, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },

  voiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  voiceCard: {
    width: '48%', padding: SPACING.md, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, position: 'relative',
  },
  voiceCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  voiceName: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginTop: 6 },
  voiceNameActive: { color: COLORS.primary },
  voiceAccent: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  voiceCheck: { position: 'absolute', top: 8, right: 8 },

  optionRow: { flexDirection: 'row', gap: SPACING.sm },
  optionBtn: {
    flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  },
  optionBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  optionText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  optionTextActive: { color: COLORS.primary },

  resultCard: { marginTop: SPACING.lg },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
  resultIcon: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primaryGlow,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  resultSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  resultHint: { fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.sm },

  loadingCard: { alignItems: 'center', paddingVertical: SPACING.xl, marginTop: SPACING.lg },
  loadingText: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: SPACING.md },
  loadingHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
});
