// Library Tab — Shows generated videos, audio files, and thumbnails from server
import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../src/components/Card';
import { COLORS, SPACING, RADIUS, API_BASE_URL } from '../../src/constants/theme';
import { getVideos, deleteVideo } from '../../src/services/api';

const TABS = ['All', 'Videos', 'Audio', 'Images'];

export default function LibraryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await getVideos();
      // The /api/videos endpoint returns { videos: [{filename, size, created}] }
      const files = (data.videos || []).map((v, i) => {
        const ext = v.filename?.split('.').pop()?.toLowerCase() || '';
        let type = 'video';
        let icon = 'movie';
        if (['mp3', 'wav', 'ogg'].includes(ext)) { type = 'audio'; icon = 'mic'; }
        else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) { type = 'image'; icon = 'image'; }
        return {
          id: i + 1,
          filename: v.filename,
          title: v.filename?.replace(/\.[^.]+$/, '').replace(/_/g, ' ') || 'Untitled',
          type,
          icon,
          size: v.size ? `${(v.size / 1024 / 1024).toFixed(1)} MB` : '',
          date: v.created ? new Date(v.created).toLocaleDateString() : '',
          url: `${API_BASE_URL}/output/${v.filename}`,
        };
      });
      setItems(files);
    } catch (err) {
      // Server may not be running
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadItems();
  }, []);

  const handleDelete = (item) => {
    Alert.alert('Delete', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteVideo(item.filename);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const filtered = activeTab === 'All'
    ? items
    : items.filter((i) => i.type === activeTab.toLowerCase().replace(/s$/, ''));

  const getTypeColor = (type) => {
    switch (type) {
      case 'video': return COLORS.primary;
      case 'audio': return COLORS.info;
      case 'image': return COLORS.success;
      default: return COLORS.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <TouchableOpacity style={styles.searchBtn}>
          <MaterialIcons name="search" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Tab Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items */}
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading library...</Text>
        </View>
      ) : filtered.length > 0 ? (
        <FlatList
          data={filtered}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          renderItem={({ item }) => (
            <Card style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View style={[styles.iconWrap, { backgroundColor: getTypeColor(item.type) + '22' }]}>
                  <MaterialIcons name={item.icon} size={22} color={getTypeColor(item.type)} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemDate}>{item.size} {item.size && item.date ? '•' : ''} {item.date}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                  <MaterialIcons name="delete-outline" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      ) : (
        <View style={styles.centerWrap}>
          <MaterialIcons name="folder-open" size={64} color={COLORS.textDark} />
          <Text style={styles.emptyTitle}>Library is empty</Text>
          <Text style={styles.emptySubtitle}>Generated videos, audio, and thumbnails will appear here</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabScroll: { maxHeight: 50 },
  tabRow: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },
  list: { padding: SPACING.lg },
  itemCard: { marginBottom: SPACING.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  itemDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  deleteBtn: { padding: 8 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: SPACING.xl },
});
