// Pexels Media Gallery — Browse related stock photos & videos
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '../src/components/GradientButton';
import Card from '../src/components/Card';
import { COLORS, SPACING, RADIUS, API_BASE_URL } from '../src/constants/theme';
import { searchMedia } from '../src/services/api';

const { width: SCREEN_W } = Dimensions.get('window');
const COLUMN_GAP = SPACING.sm;
const NUM_COLUMNS = 2;
const TILE_W = (SCREEN_W - SPACING.lg * 2 - COLUMN_GAP) / NUM_COLUMNS;

export default function GalleryScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState('photo');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      Alert.alert('Required', 'Enter a search query');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchMedia(query.trim(), mediaType);
      setResults(data.results || []);
    } catch (err) {
      Alert.alert('Error', err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderPhotoItem = ({ item }) => (
    <TouchableOpacity style={styles.tile} activeOpacity={0.8}>
      <Image source={{ uri: item.thumbnail || item.url }} style={styles.tileImage} resizeMode="cover" />
      {item.photographer && (
        <View style={styles.tileOverlay}>
          <MaterialIcons name="camera-alt" size={12} color="#fff" />
          <Text style={styles.tilePhotographer} numberOfLines={1}>{item.photographer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderVideoItem = ({ item }) => (
    <TouchableOpacity style={styles.tile} activeOpacity={0.8}>
      <Image source={{ uri: item.image }} style={styles.tileImage} resizeMode="cover" />
      <View style={styles.playOverlay}>
        <MaterialIcons name="play-circle-outline" size={36} color="rgba(255,255,255,0.9)" />
      </View>
      {item.duration > 0 && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{item.duration}s</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Media Gallery</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <MaterialIcons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search photos & videos..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
          <MaterialIcons name="arrow-forward" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Type Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, mediaType === 'photo' && styles.toggleActive]}
          onPress={() => setMediaType('photo')}
        >
          <MaterialIcons name="photo-library" size={18} color={mediaType === 'photo' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.toggleText, mediaType === 'photo' && styles.toggleTextActive]}>Photos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mediaType === 'video' && styles.toggleActive]}
          onPress={() => setMediaType('video')}
        >
          <MaterialIcons name="videocam" size={18} color={mediaType === 'video' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.toggleText, mediaType === 'video' && styles.toggleTextActive]}>Videos</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching Pexels...</Text>
        </View>
      ) : results.length > 0 ? (
        <>
          <Text style={styles.countText}>{results.length} results for "{query}"</Text>
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={mediaType === 'photo' ? renderPhotoItem : renderVideoItem}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : searched ? (
        <View style={styles.centerWrap}>
          <MaterialIcons name="search-off" size={64} color={COLORS.textDark} />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>Try different keywords</Text>
        </View>
      ) : (
        <View style={styles.centerWrap}>
          <MaterialIcons name="collections" size={64} color={COLORS.textDark} />
          <Text style={styles.emptyTitle}>Search Pexels Library</Text>
          <Text style={styles.emptySubtitle}>Find free stock photos and videos for your content</Text>
          {/* Quick suggestions */}
          <View style={styles.suggestions}>
            {['AI Technology', 'Nature', 'Business', 'Gaming', 'Cooking'].map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestBtn}
                onPress={() => { setQuery(s); }}
              >
                <Text style={styles.suggestText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Pexels attribution */}
      <View style={styles.attribution}>
        <Text style={styles.attrText}>Powered by Pexels</Text>
      </View>
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

  // Search
  searchRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginTop: SPACING.md, gap: SPACING.sm },
  searchInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchIcon: { marginLeft: SPACING.md },
  searchInput: { flex: 1, padding: SPACING.md, fontSize: 15, color: COLORS.text },
  searchBtn: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },

  // Toggle
  toggleRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginTop: SPACING.md, gap: SPACING.sm },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  },
  toggleActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  toggleText: { fontSize: 14, color: COLORS.textMuted, marginLeft: 6, fontWeight: '600' },
  toggleTextActive: { color: COLORS.primary },

  // Count
  countText: { fontSize: 13, color: COLORS.textMuted, paddingHorizontal: SPACING.lg, marginTop: SPACING.md },

  // Grid
  gridContainer: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 60 },
  columnWrapper: { gap: COLUMN_GAP, marginBottom: COLUMN_GAP },
  tile: {
    width: TILE_W,
    height: TILE_W * 0.75,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
  },
  tileImage: { width: '100%', height: '100%' },
  tileOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 4, paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tilePhotographer: { fontSize: 10, color: '#fff', marginLeft: 4 },
  playOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  durationBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  durationText: { fontSize: 10, color: '#fff', fontWeight: '600' },

  // Center states
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: SPACING.xl },

  // Suggestions
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.lg },
  suggestBtn: {
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
  },
  suggestText: { fontSize: 13, color: COLORS.textSecondary },

  // Attribution
  attribution: { paddingVertical: 8, alignItems: 'center' },
  attrText: { fontSize: 11, color: COLORS.textMuted },
});
