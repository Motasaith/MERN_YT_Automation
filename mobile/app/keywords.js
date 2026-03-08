// Keyword Trends — Search insights and viral topic discovery
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '../src/components/GradientButton';
import Card from '../src/components/Card';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';

const TRENDING_TOPICS = [
  { id: 1, keyword: 'AI Tools 2024', volume: '450K', trend: '+85%', heat: 'hot' },
  { id: 2, keyword: 'ChatGPT Prompts', volume: '320K', trend: '+42%', heat: 'hot' },
  { id: 3, keyword: 'Passive Income Ideas', volume: '280K', trend: '+28%', heat: 'warm' },
  { id: 4, keyword: 'YouTube Automation', volume: '190K', trend: '+65%', heat: 'hot' },
  { id: 5, keyword: 'Crypto Bull Run', volume: '210K', trend: '+33%', heat: 'warm' },
  { id: 6, keyword: 'No-Code Apps', volume: '145K', trend: '+55%', heat: 'warm' },
  { id: 7, keyword: 'AI Video Generator', volume: '120K', trend: '+120%', heat: 'hot' },
  { id: 8, keyword: 'Side Hustle 2024', volume: '175K', trend: '+19%', heat: 'mild' },
];

export default function KeywordsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = query
    ? TRENDING_TOPICS.filter((t) => t.keyword.toLowerCase().includes(query.toLowerCase()))
    : TRENDING_TOPICS;

  const getHeatColor = (heat) => {
    switch (heat) {
      case 'hot': return COLORS.error;
      case 'warm': return COLORS.warning;
      default: return COLORS.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Keyword Trends</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trending keywords..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Category Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {['All', 'Tech', 'Finance', 'Lifestyle', 'Education', 'Entertainment'].map((cat) => (
            <TouchableOpacity key={cat} style={styles.chip}>
              <Text style={styles.chipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Trending Section */}
        <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
        {filtered.map((topic, i) => (
          <Card key={topic.id} style={styles.trendCard} onPress={() => {
            router.push({ pathname: '/scripts/generator', params: { topic: topic.keyword } });
          }}>
            <View style={styles.trendRow}>
              <Text style={styles.trendRank}>#{i + 1}</Text>
              <View style={styles.trendInfo}>
                <Text style={styles.trendKeyword}>{topic.keyword}</Text>
                <Text style={styles.trendVolume}>{topic.volume} monthly searches</Text>
              </View>
              <View style={styles.trendRight}>
                <Text style={[styles.trendPercent, { color: getHeatColor(topic.heat) }]}>{topic.trend}</Text>
                <View style={[styles.heatDot, { backgroundColor: getHeatColor(topic.heat) }]} />
              </View>
            </View>
          </Card>
        ))}

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

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.text },

  chipScroll: { marginTop: SPACING.md, marginBottom: SPACING.sm },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: SPACING.lg, marginBottom: SPACING.md },

  trendCard: { marginBottom: SPACING.sm },
  trendRow: { flexDirection: 'row', alignItems: 'center' },
  trendRank: { fontSize: 16, fontWeight: '800', color: COLORS.primary, width: 32 },
  trendInfo: { flex: 1 },
  trendKeyword: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  trendVolume: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  trendRight: { alignItems: 'flex-end' },
  trendPercent: { fontSize: 14, fontWeight: '700' },
  heatDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
});
