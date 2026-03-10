// Keyword Trends — Search insights and viral topic discovery
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
import GradientButton from '../src/components/GradientButton';
import Card from '../src/components/Card';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';
import { getKeywordTrends } from '../src/services/api';

const CATEGORIES = ['Tech', 'Finance', 'Lifestyle', 'Education', 'Gaming', 'Health'];

export default function KeywordsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [searched, setSearched] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);

  const handleSearch = async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q) {
      Alert.alert('Required', 'Enter a keyword or topic to search');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await getKeywordTrends(q);
      setKeywords(data.keywords || []);
    } catch (err) {
      Alert.alert('Error', err.message);
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (cat) => {
    setSelectedCat(cat);
    setQuery(cat);
    handleSearch(cat);
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
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search keywords, niches, topics..."
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity onPress={() => handleSearch()} style={styles.searchBtn}>
            <MaterialIcons name="arrow-forward" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Category Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCat === cat && styles.chipActive]}
              onPress={() => handleCategoryPress(cat)}
            >
              <Text style={[styles.chipText, selectedCat === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Analyzing keywords...</Text>
          </View>
        ) : keywords.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Related Keywords</Text>
            <Text style={styles.resultCount}>{keywords.length} keywords found for "{query}"</Text>
            {keywords.map((keyword, i) => (
              <Card key={i} style={styles.trendCard} onPress={() => {
                router.push({ pathname: '/scripts/generator', params: { topic: keyword } });
              }}>
                <View style={styles.trendRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.trendRank}>{i + 1}</Text>
                  </View>
                  <View style={styles.trendInfo}>
                    <Text style={styles.trendKeyword}>{keyword}</Text>
                    <Text style={styles.trendHint}>Tap to generate script</Text>
                  </View>
                  <MaterialIcons name="arrow-forward-ios" size={14} color={COLORS.textMuted} />
                </View>
              </Card>
            ))}
          </>
        ) : searched ? (
          <View style={styles.centerWrap}>
            <MaterialIcons name="search-off" size={48} color={COLORS.textDark} />
            <Text style={styles.emptyTitle}>No keywords found</Text>
            <Text style={styles.emptySubtitle}>Try different search terms</Text>
          </View>
        ) : (
          <View style={styles.centerWrap}>
            <MaterialIcons name="trending-up" size={64} color={COLORS.textDark} />
            <Text style={styles.emptyTitle}>Discover Trending Keywords</Text>
            <Text style={styles.emptySubtitle}>Search any topic or tap a category to find relevant keywords for your content</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
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

  searchRow: { flexDirection: 'row', marginTop: SPACING.lg, gap: SPACING.sm },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchIcon: { marginLeft: SPACING.md },
  searchInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, fontSize: 15, color: COLORS.text },
  searchBtn: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },

  chipScroll: { marginTop: SPACING.md, marginBottom: SPACING.sm },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextActive: { color: COLORS.primary },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  resultCount: { fontSize: 13, color: COLORS.textMuted, marginBottom: SPACING.md },

  trendCard: { marginBottom: SPACING.sm },
  trendRow: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.primaryGlow,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  trendRank: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  trendInfo: { flex: 1 },
  trendKeyword: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  trendHint: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  centerWrap: { alignItems: 'center', paddingTop: 80 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: SPACING.xl },
});
